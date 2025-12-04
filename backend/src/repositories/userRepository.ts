import { PoolClient } from 'pg';
import pool from '../config/database';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  token: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
}

const query = async <T>(text: string, params: any[] = []): Promise<T[]> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const res = await client.query(text, params);
    return res.rows;
  } catch (err) {
    logger.error('Database query failed', { query: text, params, error: err });
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
};

class UserRepository {
  async createUser(email: string, passwordHash: string): Promise<User> {
    const text = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, password_hash, is_active, deleted_at, created_at, updated_at;
    `;
    const rows = await query<User>(text, [email, passwordHash]);
    return rows[0];
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const text = `
      SELECT id, email, password_hash, is_active, deleted_at, created_at, updated_at
      FROM users
      WHERE email = $1;
    `;
    const rows = await query<User>(text, [email]);
    return rows[0] || null;
  }

  async findUserById(id: string): Promise<User | null> {
    const text = `
      SELECT id, email, password_hash, is_active, deleted_at, created_at, updated_at
      FROM users
      WHERE id = $1;
    `;
    const rows = await query<User>(text, [id]);
    return rows[0] || null;
  }

  async softDeleteUser(userId: string): Promise<User | null> {
    const text = `
      UPDATE users
      SET is_active = FALSE, deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, password_hash, is_active, deleted_at, created_at, updated_at;
    `;
    const rows = await query<User>(text, [userId]);
    return rows[0] || null;
  }

  async updateUser(userId: string, data: Partial<{ email: string; password_hash: string }>): Promise<User | null> {
    const updates: string[] = [];
    const params: any[] = [userId];
    let paramIndex = 1;

    if (data.email !== undefined) {
      paramIndex++;
      updates.push(`email = $${paramIndex}`);
      params.push(data.email);
    }
    if (data.password_hash !== undefined) {
      paramIndex++;
      updates.push(`password_hash = $${paramIndex}`);
      params.push(data.password_hash);
    }

    if (updates.length === 0) {
      return this.findUserById(userId);
    }

    paramIndex++;
    updates.push(`updated_at = NOW()`);
    
    const text = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, email, password_hash, is_active, deleted_at, created_at, updated_at;
    `;
    const rows = await query<User>(text, params);
    return rows[0] || null;
  }

  async saveRefreshToken(token: string, userId: string, expiresAt: Date): Promise<RefreshToken> {
    const text = `
      INSERT INTO refresh_tokens (token, user_id, expires_at)
      VALUES ($1, $2, $3)
      RETURNING token, user_id, expires_at, created_at;
    `;
    const rows = await query<RefreshToken>(text, [token, userId, expiresAt]);
    return rows[0];
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    const text = `
      SELECT token, user_id, expires_at, created_at
      FROM refresh_tokens
      WHERE token = $1;
    `;
    const rows = await query<RefreshToken>(text, [token]);
    return rows[0] || null;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    const text = `
      DELETE FROM refresh_tokens
      WHERE token = $1;
    `;
    await query(text, [token]);
  }

  async deleteRefreshTokensByUserId(userId: string): Promise<void> {
    const text = `
      DELETE FROM refresh_tokens
      WHERE user_id = $1;
    `;
    await query(text, [userId]);
  }
}

export const userRepository = new UserRepository();
