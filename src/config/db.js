const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

module.exports = pool;
