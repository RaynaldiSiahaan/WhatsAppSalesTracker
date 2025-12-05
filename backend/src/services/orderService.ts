import pool from '../config/database';
import { orderRepository } from '../repositories/orderRepository';
import { productRepository } from '../repositories/productRepository';
import { storeRepository } from '../repositories/storeRepository';
import { CreateOrderData, Order } from '../entities/order';
import { BadRequestError, NotFoundError, InternalServerError } from '../utils/custom-errors';
import { generateOrderCode } from '../utils/slug';
import { logger } from '../utils/logger';

class OrderService {
  async createPublicOrder(data: CreateOrderData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Verify Store
      const store = await storeRepository.findStoreById(data.store_id);
      if (!store) {
        throw new NotFoundError('Store not found');
      }

      // 2. Process Items & Stock
      let totalAmount = 0;
      const processedItems = [];

      for (const item of data.items) {
        if (item.quantity <= 0) {
            throw new BadRequestError(`Invalid quantity for product ${item.product_id}`);
        }

        // Attempt to decrease stock and get product details (atomic check & update)
        const product = await productRepository.decreaseStock(client, item.product_id, item.quantity);

        if (!product) {
            // Either product not found or insufficient stock
            // We should check which one it is, but for now generic error
            // To be precise, we could fetch product first, but that adds a query.
            // Assuming ID is correct, it's stock issue.
            throw new BadRequestError(`Insufficient stock or invalid product for ID: ${item.product_id}`);
        }

        if (product.store_id !== data.store_id) {
             throw new BadRequestError(`Product ${item.product_id} does not belong to this store`);
        }

        const itemTotal = Number(product.price) * item.quantity;
        totalAmount += itemTotal;

        processedItems.push({
            product_id: item.product_id,
            name: product.name,
            quantity: item.quantity,
            price_at_order: Number(product.price)
        });
      }

      // 3. Generate Order Code
      const orderCode = generateOrderCode(store.store_code);

      // 4. Create Order Header
      const order = await orderRepository.createOrder(
          client,
          data.store_id,
          orderCode,
          data.customer_name,
          data.customer_phone,
          data.pickup_time,
          totalAmount
      );

      // 5. Create Order Items
      for (const item of processedItems) {
          await orderRepository.createOrderItem(
              client,
              order.id,
              item.product_id,
              item.name,
              item.quantity,
              item.price_at_order
          );
      }

      await client.query('COMMIT');
      return { ...order, items: processedItems };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create order', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // For Seller (Phase 2)
  async getStoreOrders(userId: string, storeId: string) {
      // Verify ownership
      const store = await storeRepository.findStoreById(storeId);
      if (!store) throw new NotFoundError('Store not found');
      if (store.user_id !== userId) throw new BadRequestError('Unauthorized access to store orders');

      return orderRepository.findOrdersByStoreId(storeId);
  }
}

export const orderService = new OrderService();
