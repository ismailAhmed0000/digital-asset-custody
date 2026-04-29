const db = require('../db/index');

async function getAllCustomers(req ,res) {
    const result = await db.query('SELECT id,name,email,type FROM customers ORDER BY id');
    res.json({customers: result.rows});
    
}

async function createCustomer(req, res){
    const {full_name, email, type} = req.body;

    if(!full_name || !email || !type){
        return res.status(400).json({error:'Missing required fields'});
    }
    if(type !== 'individual' && type !== 'business'){
        return res.status(400).json({error:'Invalid customer type'});
    }
    const result = await db.query(`INSERT INTO customers(ful_name,email,type)
        Values($1,$2,$3)
        RETURNING id,full_name,email,type,created_at`
        [full_name,email,type]
        );
    res.status(201).json({customer: result.rows[0]});    
}

async function getCustomerAccount(req,res) {
    const {id} =req.params;
    const customerResult = await db.query('SELECT id,name,email,type FROM customers WHERE id = $1', [id]);

    if(customerResult.rows.length === 0){
        return res.status(404).json({error:'Customer not found'});
    }

    const depositsResult = await db.query(
        `SELECT d.id, m.code AS metal, d.storage_type, d.quantity_oz, d.deposited_at
         FROM deposits d
         JOIN metals m ON m.id = d.metal_id
         WHERE d.customer_id = $1
         ORDER BY d.deposited_at DESC`,
        [id]
      );
      res.json({
        customer: result.rows[0],
        deposits: depositsResult.rows,
      });
   
    
}

module.exports = {getAllCustomers, createCustomer, getCustomerAccount};
