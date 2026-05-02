const db = require('../db/index');
const { apiTypeCaseSql } = require('../lib/customerTypeMap');


async function getPortfolio(req, res) {
  const { id } = req.params;

  // 404 — customer must exist
  const customerResult = await db.query(
    `SELECT id, name AS full_name, email, ${apiTypeCaseSql()} FROM customers WHERE id = $1`,
    [id]
  );
  if (customerResult.rows.length === 0) {
    return res.status(404).json({ error: 'Account not found' });
  }

  // ── Unallocated holdings per metal ──────────────────────────
  // Net kg = total deposited kg - total withdrawn kg, then × spot price
  const unallocatedResult = await db.query(
    `SELECT
       m.id          AS metal_id,
       m.code        AS metal_code,
       m.name        AS metal_name,
       m.spot_price_usd,
       COALESCE(SUM(d.quantity_kg), 0) AS total_deposited_kg,
       COALESCE((
         SELECT SUM(w.quantity_kg)
         FROM withdrawals w
         WHERE w.customer_id = $1
           AND w.metal_id = m.id
           AND w.storage_type = 'unallocated'
       ), 0) AS total_withdrawn_kg
     FROM metals m
     LEFT JOIN deposits d
       ON d.metal_id = m.id
       AND d.customer_id = $1
       AND d.storage_type = 'unallocated'
     GROUP BY m.id, m.code, m.name, m.spot_price_usd
     HAVING COALESCE(SUM(d.quantity_kg), 0) > 0`,
    [id]
  );

  // ── Allocated holdings — list actual bars ───────────────────
  const allocatedResult = await db.query(
    `SELECT
       m.id          AS metal_id,
       m.code        AS metal_code,
       m.name        AS metal_name,
       m.spot_price_usd,
       b.id          AS bar_id,
       b.serial_number,
       b.fine_weight_kg,
       b.purity,
       b.status      AS bar_status
     FROM deposits d
     JOIN metals m    ON m.id = d.metal_id
     JOIN bar_allocations ba ON ba.deposit_id = d.id
     JOIN bars b      ON b.id = ba.bar_id
     WHERE d.customer_id = $1
       AND d.storage_type = 'allocated'
       AND b.status = 'active'
     ORDER BY m.code, b.serial_number`,
    [id]
  );

  // ── Total unallocated pool size per metal (all customers) ───
  // Used to calculate this customer's pool percentage
  const poolTotalsResult = await db.query(
    `SELECT
       metal_id,
       COALESCE(SUM(quantity_kg), 0) AS pool_total_kg
     FROM deposits
     WHERE storage_type = 'unallocated'
     GROUP BY metal_id`
  );
  const poolTotals = {};
  for (const row of poolTotalsResult.rows) {
    poolTotals[row.metal_id] = parseFloat(row.pool_total_kg);
  }

  // ── Shape unallocated response ───────────────────────────────
  const unallocated = unallocatedResult.rows.map((row) => {
    const net_kg = parseFloat(row.total_deposited_kg) - parseFloat(row.total_withdrawn_kg);
    const usd_value = net_kg * parseFloat(row.spot_price_usd);
    const pool_total = poolTotals[row.metal_id] || 0;
    const pool_percentage = pool_total > 0
      ? ((net_kg / pool_total) * 100).toFixed(2)
      : '0.00';

    return {
      metal_id: row.metal_id,
      metal_code: row.metal_code,
      metal_name: row.metal_name,
      spot_price_usd: parseFloat(row.spot_price_usd),
      net_kg,
      usd_value: parseFloat(usd_value.toFixed(2)),
      pool_percentage: `${pool_percentage}%`,
    };
  });

  // ── Shape allocated response — group bars by metal ──────────
  const allocatedByMetal = {};
  for (const row of allocatedResult.rows) {
    if (!allocatedByMetal[row.metal_id]) {
      allocatedByMetal[row.metal_id] = {
        metal_id: row.metal_id,
        metal_code: row.metal_code,
        metal_name: row.metal_name,
        spot_price_usd: parseFloat(row.spot_price_usd),
        bars: [],
        total_fine_kg: 0,
        usd_value: 0,
      };
    }
    const entry = allocatedByMetal[row.metal_id];
    entry.bars.push({
      bar_id: row.bar_id,
      serial_number: row.serial_number,
      fine_weight_kg: parseFloat(row.fine_weight_kg),
      purity: parseFloat(row.purity),
      status: row.bar_status,
    });
    entry.total_fine_kg += parseFloat(row.fine_weight_kg);
  }

  // Compute USD value per metal group after totalling bars
  const allocated = Object.values(allocatedByMetal).map((entry) => ({
    ...entry,
    total_fine_kg: parseFloat(entry.total_fine_kg.toFixed(6)),
    usd_value: parseFloat((entry.total_fine_kg * entry.spot_price_usd).toFixed(2)),
  }));

  return res.json({
    customer: customerResult.rows[0],
    portfolio: {
      unallocated,
      allocated,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// GET /api/accounts/:id/transactions
// Full deposit + withdrawal history, newest first
// ─────────────────────────────────────────────────────────────
async function getTransactions(req, res) {
  const { id } = req.params;

  // 404 — customer must exist
  const customerResult = await db.query(
    'SELECT id, name AS full_name FROM customers WHERE id = $1',
    [id]
  );
  if (customerResult.rows.length === 0) {
    return res.status(404).json({ error: 'Account not found' });
  }

  // UNION deposits and withdrawals into one timeline
  // 'type' column tells you which kind of event it is
  const result = await db.query(
    `SELECT
       'deposit'          AS type,
       d.id,
       d.deposit_number   AS reference,
       m.code             AS metal_code,
       d.storage_type,
       d.quantity_kg,
       d.deposited_at     AS event_at
     FROM deposits d
     JOIN metals m ON m.id = d.metal_id
     WHERE d.customer_id = $1

     UNION ALL

     SELECT
       'withdrawal'       AS type,
       w.id,
       NULL               AS reference,
       m.code             AS metal_code,
       w.storage_type,
       w.quantity_kg,
       w.withdrawn_at     AS event_at
     FROM withdrawals w
     JOIN metals m ON m.id = w.metal_id
     WHERE w.customer_id = $1

     ORDER BY event_at DESC`,
    [id]
  );

  return res.json({
    customer: customerResult.rows[0],
    transactions: result.rows,
    count: result.rows.length,
  });
}

module.exports = { getPortfolio, getTransactions };