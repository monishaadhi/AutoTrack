import path from 'path';
import dotenv from 'dotenv';
import mysql, { Pool, PoolOptions } from 'mysql2/promise';

// Ensure backend/.env is loaded before creating the connection pool
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}
dotenv.config();

export function getPoolConfig(): PoolOptions {
  const rawPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
  const password = typeof rawPassword === 'string' ? rawPassword.trim() : String(rawPassword);

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: password,
    database: process.env.DB_NAME || 'autotrack_db',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  };
}

export const pool: Pool = mysql.createPool(getPoolConfig());

/**
 * Tests connection to MySQL database by attempting to ping and run a test query.
 */
export async function testConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    await connection.query('SELECT 1 + 1 AS health_check');
    connection.release();
    return { connected: true, message: 'Database connection verified' };
  } catch (error) {
    const err = error as Error;
    return { connected: false, message: err.message };
  }
}
