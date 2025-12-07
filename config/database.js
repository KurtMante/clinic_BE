const mysql = require('mysql2/promise');

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'wahing',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create database if it doesn't exist
async function createDatabase() {
  const tempConfig = { ...baseConfig };
  delete tempConfig.database; // Connect without specifying database
  
  try {
    const tempConnection = await mysql.createConnection(tempConfig);
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${baseConfig.database}`);
    await tempConnection.end();
    console.log(`Database '${baseConfig.database}' created/verified`);
  } catch (error) {
    console.error('Database creation failed:', error.message);
    throw error;
  }
}

const pool = mysql.createPool(baseConfig);

// Test connection
async function testConnection() {
  try {
    await createDatabase(); // Create database first
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
}

module.exports = { pool, testConnection };
