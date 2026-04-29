const db = require('../db/index');

async function getAllMetals(req, res){

    const result = await db.query('SELECT id,code,name,spot_price_usd FROM metals ORDER BY id');
    res.json({metals: result.rows});

}
module.exports = {getAllMetals};