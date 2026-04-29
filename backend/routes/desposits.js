// backend/controllers/withdrawalsController.js
const db = require('../db/index');

async function createWithdrawal(req, res) {
  const { customer_id, metal_id, storage_type, quantity_oz, bar_id } = req.body;

  // 422 — invalid quantity
  if (!quantity_oz || Number(quantity_oz) <= 0) {
    return res.status(422).json({ error: 'quantity_oz must be greater than 0' });
  }

  if (!customer_id || !metal_id || !storage_type) {
    return res.status(400).json({ error: 'customer_id, metal_id and storage_type are required' });
  }

  if (!['allocated', 'unallocated'].includes(storage_type)) {
    return res.status(400).json({ error: "storage_type must be 'allocated' or 'unallocated'" });
  }

  // 404 — customer must exist
  const customerCheck = await db.query('SELECT id FROM customers WHERE id = $1', [customer_id]);
  if (customerCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  // ─── ALLOCATED path ───────────────────────────────────────────────
  if (storage_type === 'allocated') {
    if (!bar_id) {
      return res.status(400).json({ error: 'bar_id is required for allocated withdrawals' });
    }

    // Check bar exists and is active
    const barResult = await db.query(
      'SELECT id, status FROM bars WHERE id = $1',
      [bar_id]
    );
    if (barResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bar not found' });
    }
    if (barResult.rows[0].status === 'withdrawn') {
      return res.status(400).json({ error: 'Bar has already been withdrawn' });
    }

    // 403 — bar must belong to this customer via bar_allocations → deposits
    const ownerCheck = await db.query(
      `SELECT ba.id FROM bar_allocations ba
       JOIN deposits d ON d.id = ba.deposit_id
       WHERE ba.bar_id = $1 AND d.customer_id = $2`,
      [bar_id, customer_id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'This bar does not belong to the requesting customer' });
    }

    // Mark bar as withdrawn
    await db.query(
      `UPDATE bars SET status = 'withdrawn', updated_at = NOW() WHERE id = $1`,
      [bar_id]
    );

    // Record withdrawal
    const result = await db.query(
      `INSERT INTO withdrawals (customer_id, metal_id, bar_id, storage_type, quantity_oz)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [customer_id, metal_id, bar_id, storage_type, quantity_oz]
    );

    return res.status(201).json({ withdrawal: result.rows[0] });
  }

  // ─── UNALLOCATED path ─────────────────────────────────────────────

  // Calculate available balance: total deposited - total withdrawn
  const balanceResult = await db.query(
    `SELECT
       COALESCE(SUM(d.quantity_oz), 0) AS total_deposited,
       COALESCE((
         SELECT SUM(w.quantity_oz)
         FROM withdrawals w
         WHERE w.customer_id = $1
           AND w.metal_id = $2
           AND w.storage_type = 'unallocated'
       ), 0) AS total_withdrawn
     FROM deposits d
     WHERE d.customer_id = $1
       AND d.metal_id = $2
       AND d.storage_type = 'unallocated'`,
    [customer_id, metal_id]
  );

  const { total_deposited, total_withdrawn } = balanceResult.rows[0];
  const available = parseFloat(total_deposited) - parseFloat(total_withdrawn);

  // 400 — insufficient balance
  if (Number(quantity_oz) > available) {
    return res.status(400).json({
      error: 'Insufficient balance',
      available_oz: available,
      requested_oz: Number(quantity_oz),
    });
  }

  const result = await db.query(
    `INSERT INTO withdrawals (customer_id, metal_id, storage_type, quantity_oz)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [customer_id, metal_id, storage_type, quantity_oz]
  );

  return res.status(201).json({ withdrawal: result.rows[0] });
}

module.exports = { createWithdrawal };