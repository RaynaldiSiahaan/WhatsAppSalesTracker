import { PoolClient } from 'pg';
import pool from '../config/database';
import { logger } from '../utils/logger';

export interface Store {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  slug: string;
  store_code: string;
  created_by: string | null; // User ID who created the store
  created_at: Date;
  updated_by: string | null; // User ID who last updated the store
  updated_at: Date;
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

class StoreRepository {
  async createStore(userId: string, name: string, slug: string, storeCode: string, location: string | null = null): Promise<Store> {
    const text = `
      INSERT INTO stores (user_id, name, slug, store_code, location, created_by)
      VALUES ($1, $2, $3, $4, $5, $1) -- created_by is the same as user_id initially
      RETURNING id, user_id, name, slug, store_code, location, created_by, created_at, updated_by, updated_at;
    `;
    const rows = await query<Store>(text, [userId, name, slug, storeCode, location]);
    return rows[0];
  }

  async findStoresByUserId(userId: string): Promise<Store[]> {
    const text = `
      SELECT id, user_id, name, slug, store_code, location, created_by, created_at, updated_by, updated_at
      FROM stores
      WHERE user_id = $1;
    `;
    const rows = await query<Store>(text, [userId]);
    return rows;
  }

  async findStoreById(storeId: string): Promise<Store | null> {
    const text = `
      SELECT id, user_id, name, slug, store_code, location, created_by, created_at, updated_by, updated_at
      FROM stores
      WHERE id = $1;
    `;
    const rows = await query<Store>(text, [storeId]);
    return rows[0] || null;
  }

  async findStoreBySlug(slug: string): Promise<Store | null> {
    const text = `
      SELECT id, user_id, name, slug, store_code, location, created_by, created_at, updated_by, updated_at
      FROM stores
      WHERE slug = $1;
    `;
    const rows = await query<Store>(text, [slug]);
    return rows[0] || null;
  }

  async findStoreByStoreCode(storeCode: string): Promise<Store | null> {
    const text = `
      SELECT id, user_id, name, slug, store_code, location, created_by, created_at, updated_by, updated_at
      FROM stores
      WHERE store_code = $1;
    `;
    const rows = await query<Store>(text, [storeCode]);
    return rows[0] || null;
  }

  async updateStore(storeId: string, updatedByUserId: string, data: Partial<{ name: string; location: string | null }>): Promise<Store | null> {
    const updates: string[] = [];
    const params: any[] = [storeId];
    let paramIndex = 1;

    if (data.name !== undefined) {
      paramIndex++;
      updates.push(`name = $${paramIndex}`);
      params.push(data.name);
    }
    if (data.location !== undefined) {
      paramIndex++;
      updates.push(`location = $${paramIndex}`);
      params.push(data.location);
    }

    if (updates.length === 0) {
      return this.findStoreById(storeId);
    }
    
    paramIndex++;
    params.push(updatedByUserId);
    updates.push(`updated_by = $${paramIndex}`);
    
    updates.push(`updated_at = NOW()`);
    
    const text = `
      UPDATE stores
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, user_id, name, slug, store_code, location, created_by, created_at, updated_by, updated_at;
    `;
    const rows = await query<Store>(text, params);
    return rows[0] || null;
  }

  // The spec doesn't explicitly mention soft delete for stores, only for users and products.
  // I will implement a hard delete for now. If soft delete is required, the table schema needs modification.
  async deleteStore(storeId: string): Promise<boolean> {
    const text = `
      DELETE FROM stores
      WHERE id = $1
      RETURNING id;
    `;
    const rows = await query<{ id: string }>(text, [storeId]);
    return rows.length > 0;
  }
}

export const storeRepository = new StoreRepository();
