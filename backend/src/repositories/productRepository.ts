import { PoolClient } from 'pg';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { Product, CreateProductData, UpdateProductData } from '../entities/product';

// Helper function to execute queries
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

class ProductRepository {
  async createProduct(storeId: string, userId: string, data: CreateProductData): Promise<Product> {
    const text = `
      INSERT INTO products (store_id, name, price, stock_quantity, image_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, store_id, name, price, stock_quantity, image_url, is_active, created_by, created_at, updated_by, updated_at, deleted_by, deleted_at;
    `;
    const rows = await query<Product>(text, [
      storeId,
      data.name,
      data.price,
      data.stock_quantity,
      data.image_url || null,
      userId,
    ]);
    return rows[0];
  }

  async findProductById(productId: string): Promise<Product | null> {
    const text = `
      SELECT id, store_id, name, price, stock_quantity, image_url, is_active, created_by, created_at, updated_by, updated_at, deleted_by, deleted_at
      FROM products
      WHERE id = $1;
    `;
    const rows = await query<Product>(text, [productId]);
    return rows[0] || null;
  }

  async findProductsByStoreId(storeId: string, limit: number, offset: number): Promise<Product[]> {
    const text = `
      SELECT id, store_id, name, price, stock_quantity, image_url, is_active, created_by, created_at, updated_by, updated_at, deleted_by, deleted_at
      FROM products
      WHERE store_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const rows = await query<Product>(text, [storeId, limit, offset]);
    return rows;
  }

  async updateProduct(productId: string, userId: string, data: UpdateProductData): Promise<Product | null> {
    const updates: string[] = [];
    const params: any[] = [productId]; // $1 is productId
    let paramIndex = 1;

    if (data.name !== undefined) {
      paramIndex++;
      updates.push(`name = $${paramIndex}`);
      params.push(data.name);
    }
    if (data.price !== undefined) {
      paramIndex++;
      updates.push(`price = $${paramIndex}`);
      params.push(data.price);
    }
    if (data.stock_quantity !== undefined) {
      paramIndex++;
      updates.push(`stock_quantity = $${paramIndex}`);
      params.push(data.stock_quantity);
    }
    if (data.image_url !== undefined) {
      paramIndex++;
      updates.push(`image_url = $${paramIndex}`);
      params.push(data.image_url);
    }
    if (data.is_active !== undefined) {
      paramIndex++;
      updates.push(`is_active = $${paramIndex}`);
      params.push(data.is_active);
    }

    if (updates.length === 0) {
      return this.findProductById(productId);
    }

    // Always update updated_by and updated_at
    paramIndex++;
    params.push(userId);
    updates.push(`updated_by = $${paramIndex}`);
    updates.push(`updated_at = NOW()`);

    const text = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, store_id, name, price, stock_quantity, image_url, is_active, created_by, created_at, updated_by, updated_at, deleted_by, deleted_at;
    `;
    const rows = await query<Product>(text, params);
    return rows[0] || null;
  }

  async updateProductStock(productId: string, userId: string, newQuantity: number): Promise<Product | null> {
    // Ensure stock_quantity is not negative as per CHECK constraint in schema
    if (newQuantity < 0) {
        throw new Error('Stock quantity cannot be negative');
    }
    return this.updateProduct(productId, userId, { stock_quantity: newQuantity });
  }

  async softDeleteProduct(productId: string, userId: string): Promise<Product | null> {
    const text = `
      UPDATE products
      SET is_active = FALSE, deleted_at = NOW(), deleted_by = $2, updated_at = NOW(), updated_by = $2
      WHERE id = $1
      RETURNING id, store_id, name, price, stock_quantity, image_url, is_active, created_by, created_at, updated_by, updated_at, deleted_by, deleted_at;
    `;
    const rows = await query<Product>(text, [productId, userId]);
    return rows[0] || null;
  }
}

export const productRepository = new ProductRepository();