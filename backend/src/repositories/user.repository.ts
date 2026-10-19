import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/database';
import { UserRow, RegisterInput } from '../types/auth.types';

export class UserRepository {
  async findByEmail(email: string): Promise<UserRow | null> {
    const sql = `
      SELECT user_id, username, email, password_hash, role, first_name, last_name, is_active, created_at, updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [email.toLowerCase().trim()]);
    return (rows[0] as UserRow) || null;
  }

  async findByUsername(username: string): Promise<UserRow | null> {
    const sql = `
      SELECT user_id, username, email, password_hash, role, first_name, last_name, is_active, created_at, updated_at
      FROM users
      WHERE username = ?
      LIMIT 1
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [username.trim()]);
    return (rows[0] as UserRow) || null;
  }

  async findById(id: number): Promise<UserRow | null> {
    const sql = `
      SELECT user_id, username, email, password_hash, role, first_name, last_name, is_active, created_at, updated_at
      FROM users
      WHERE user_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [id]);
    return (rows[0] as UserRow) || null;
  }

  async create(data: RegisterInput & { password_hash: string }): Promise<number> {
    const sql = `
      INSERT INTO users (username, email, password_hash, role, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.username.trim(),
      data.email.toLowerCase().trim(),
      data.password_hash,
      data.role || 'OPERATOR',
      data.first_name || null,
      data.last_name || null,
    ];
    const [result] = await pool.query<ResultSetHeader>(sql, params);
    return result.insertId;
  }
}

export const userRepository = new UserRepository();
