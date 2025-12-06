import { PoolClient } from 'pg';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { Order, OrderItem, OrderStatus } from '../entities/order';

export class OrderRepository {
  // Helper to execute query with optional client
  private async query<T>(text: string, params: any[], client?: PoolClient): Promise<T[]> {
    if (client) {
      const res = await client.query(text, params);
      return res.rows;
    }
    const res = await pool.query(text, params);
    return res.rows;
  }

  async createOrder(
    client: PoolClient,
    storeId: number,
    orderCode: string,
    customerName: string,
    customerPhone: string,
    pickupTime: Date | string,
    totalAmount: number
  ): Promise<Order> {
    const text = `
      INSERT INTO orders (order_code, store_id, customer_name, customer_phone, pickup_time, status, total_amount_gross)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const rows = await this.query<Order>(text, [
      orderCode,
      storeId,
      customerName,
      customerPhone,
      pickupTime,
      OrderStatus.RECEIVED,
      totalAmount
    ], client);
    return rows[0];
  }

  async createOrderItem(
    client: PoolClient,
    orderId: number,
    productId: number,
    name: string,
    quantity: number,
    priceAtOrder: number
  ): Promise<OrderItem> {
    const text = `
      INSERT INTO order_items (order_id, product_id, name, quantity, price_at_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const rows = await this.query<OrderItem>(text, [
      orderId,
      productId,
      name,
      quantity,
      priceAtOrder
    ], client);
    return rows[0];
  }

  async findOrderByCode(orderCode: string): Promise<Order | null> {
    const text = `SELECT * FROM orders WHERE order_code = $1`;
    const rows = await this.query<Order>(text, [orderCode]);
    return rows[0] || null;
  }
  
  async findOrdersByStoreId(storeId: number, limit: number = 20, offset: number = 0): Promise<Order[]> {
      const text = `
        SELECT * FROM orders 
        WHERE store_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      const rows = await this.query<Order>(text, [storeId, limit, offset]);
      return rows;
  }

  async getDashboardStats(userId: number): Promise<{ total_sales_gross: number, orders_count: { pending: number, completed: number, total: number } }> {
    const text = `
      SELECT 
          COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN o.total_amount_gross ELSE 0 END), 0) as total_sales_gross,
          COUNT(CASE WHEN o.status IN ('RECEIVED', 'PREPARING', 'READY_FOR_PICKUP') THEN 1 END) as pending_count,
          COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completed_count,
          COUNT(o.id) as total_count
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE s.user_id = $1
    `;
    
    const rows = await this.query<any>(text, [userId]);
    const row = rows[0];

    return {
      total_sales_gross: Number(row.total_sales_gross),
      orders_count: {
        pending: Number(row.pending_count),
        completed: Number(row.completed_count),
        total: Number(row.total_count)
      }
    };
  }
}

export const orderRepository = new OrderRepository();
