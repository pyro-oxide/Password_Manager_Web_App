import mysql from 'mysql2/promise';

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306');
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'K@nw@l1007';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'password_manager';

let pool: mysql.Pool | null = null;

export function getConnection() {
  if (!pool) {
    pool = mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function ensureDatabaseExists() {
  const serverPool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    waitForConnections: true,
    connectionLimit: 1,
  });

  try {
    const connection = await serverPool.getConnection();
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\``);
    connection.release();
  } catch (error) {
    console.error('Error ensuring database exists:', error);
    throw error;
  } finally {
    await serverPool.end();
  }
}

export async function initializeTables() {
  const pool = getConnection();
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS passwords (
        id INT AUTO_INCREMENT PRIMARY KEY,
        site VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        password TEXT NOT NULL,
        website VARCHAR(512),
        category VARCHAR(64) DEFAULT 'Uncategorized',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_site_username (site, username)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS master_password (
        id TINYINT PRIMARY KEY,
        hash TEXT NOT NULL,
        salt BLOB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(191) PRIMARY KEY,
        \`value\` TEXT
      )
    `);
  } catch (error) {
    console.error('Error initializing tables:', error);
    throw error;
  }
}

