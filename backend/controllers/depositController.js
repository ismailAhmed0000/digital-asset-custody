
const db = require('../db/index');


function generateDepositNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `DEP-${dateStr}-${rand}`;
}

async function createDeposit(req, res) {
  const { customer_id, metal_id, storage_type, quantity_kg, serial_number, vault_id } = req.body;

  if (!quantity_kg || Number(quantity_kg) <= 0) {
    return res.status(422).json({ error: 'quantity_kg must be greater than 0' });
  }


  if (!customer_id || !metal_id || !storage_type) {
    return res.status(400).json({ error: 'customer_id, metal_id and storage_type are required' });
  }

  if (!['allocated', 'unallocated'].includes(storage_type)) {
    return res.status(400).json({ error: "storage_type must be 'allocated' or 'unallocated'" });
  }


  const customerCheck = await db.query('SELECT id FROM customers WHERE id = $1', [customer_id]);
  if (customerCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }


  const metalCheck = await db.query('SELECT id FROM metals WHERE id = $1', [metal_id]);
  if (metalCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Metal not found' });
  }

  const deposit_number = generateDepositNumber();


  if (storage_type === 'allocated') {
    if (!serial_number) {
      return res.status(400).json({ error: 'serial_number is required for allocated deposits' });
    }


    const barCheck = await db.query(
      'SELECT id FROM bars WHERE serial_number = $1',
      [serial_number]
    );
    if (barCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Bar with this serial number already exists' });
    }


    const barResult = await db.query(
      `INSERT INTO bars (serial_number, metal_id, vault_id, gross_weight_kg, fine_weight_kg, purity, status)
       VALUES ($1, $2, $3, $4, $4, 1.0000, 'active')
       RETURNING id`,
      [serial_number, metal_id, vault_id || null, quantity_kg]
    );
    const bar_id = barResult.rows[0].id;

    const depositResult = await db.query(
      `INSERT INTO deposits (customer_id, metal_id, vault_id, storage_type, quantity_kg, deposit_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [customer_id, metal_id, vault_id || null, storage_type, quantity_kg, deposit_number]
    );
    const deposit = depositResult.rows[0];

    await db.query(
      `INSERT INTO bar_allocations (deposit_id, bar_id, allocated_weight_kg)
       VALUES ($1, $2, $3)`,
      [deposit.id, bar_id, quantity_kg]
    );

    return res.status(201).json({ deposit, bar_id });
  }

  const depositResult = await db.query(
    `INSERT INTO deposits (customer_id, metal_id, vault_id, storage_type, quantity_kg, deposit_number)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [customer_id, metal_id, vault_id || null, storage_type, quantity_kg, deposit_number]
  );

  return res.status(201).json({ deposit: depositResult.rows[0] });
}

module.exports = { createDeposit };