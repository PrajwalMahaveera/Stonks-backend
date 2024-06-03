const { Pool } = require('pg');
require('dotenv').config();
//I have added my postgres
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'stonks',
  password: process.env.DB_PASSWORD,
  port: 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to the database');
});

module.exports = pool;
