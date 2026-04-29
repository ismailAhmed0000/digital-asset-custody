const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});



pool.on("error",(err)=>{
    console.error("Unexpected error on idle client", err);
});

async function query(text, params){
    return pool.query(text, params);

}

async function testConnection(){
    const result = await pool.query("SELECT NOW() AS now");
    return result.rows[0];    
}

module.exports ={
    pool,
    query,
    testConnection,
};