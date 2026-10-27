const pool = require('./db');

async function test(){
const [rows] = await pool.query('SELECT * FROM tasks');
console.log('rows',rows);
process.exit();
}

test();