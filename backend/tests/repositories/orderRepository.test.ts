import { orderRepository } from '../../src/repositories/orderRepository';
import pool from '../../src/config/database';
import { OrderStatus } from '../../src/entities/order';

jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
  },
  query: jest.fn(), // If used directly
}));

describe('OrderRepository', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    };
    // Mocking the private query method is tricky without changing the class.
    // Instead, we mock the pool.query (if no client passed) or client.query (if client passed).
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order using client', async () => {
      const mockOrder = { id: 500, order_code: 'CODE' };
      mockClient.query.mockResolvedValue({ rows: [mockOrder] });

      const result = await orderRepository.createOrder(
        mockClient,
        10,
        'CODE',
        'Cust',
        '123',
        new Date(),
        100
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orders'),
        expect.any(Array)
      );
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findOrderByCode', () => {
    it('should return order if found', async () => {
      const mockOrder = { id: 500, order_code: 'CODE' };
      // Since findOrderByCode uses this.query which defaults to pool.query
      // We need to mock pool.query. 
      // Wait, `pool` is imported as default export in `config/database.ts`.
      // In `repositories/orderRepository.ts`, it imports `pool` from `../config/database`.
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockOrder] });

      const result = await orderRepository.findOrderByCode('CODE');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, order_code, store_id'),
        ['CODE']
      );
      expect(result).toEqual(mockOrder);
    });
  });

  describe('getDashboardStats', () => {
    const userId = 1;

    it('should fetch dashboard stats without filters', async () => {
      const mockStats = [{
        total_stores: 2,
        total_products: 50,
        total_orders_received: 120,
        total_revenue: 15000000
      }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockStats });

      const result = await orderRepository.getDashboardStats(userId);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId]
      );
      expect(result).toEqual({
        total_stores: 2,
        total_products: 50,
        total_orders_received: 120,
        total_revenue: 15000000
      });
    });

    it('should fetch dashboard stats with storeId filter', async () => {
      const storeId = 10;
      const mockStats = [{
        total_stores: 1,
        total_products: 20,
        total_orders_received: 30,
        total_revenue: 500000
      }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockStats });

      const result = await orderRepository.getDashboardStats(userId, storeId);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId, storeId]
      );
      expect(result).toEqual({
        total_stores: 1,
        total_products: 20,
        total_orders_received: 30,
        total_revenue: 500000
      });
    });

    it('should fetch dashboard stats with startDate filter', async () => {
      const startDate = '2023-11-01';
      const mockStats = [{
        total_stores: 2,
        total_products: 40,
        total_orders_received: 80,
        total_revenue: 10000000
      }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockStats });

      const result = await orderRepository.getDashboardStats(userId, undefined, startDate);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId, startDate]
      );
      expect(result).toEqual({
        total_stores: 2,
        total_products: 40,
        total_orders_received: 80,
        total_revenue: 10000000
      });
    });

    it('should fetch dashboard stats with endDate filter', async () => {
      const endDate = '2023-11-30';
      const mockStats = [{
        total_stores: 2,
        total_products: 45,
        total_orders_received: 100,
        total_revenue: 12000000
      }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockStats });

      const result = await orderRepository.getDashboardStats(userId, undefined, undefined, endDate);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId, endDate]
      );
      expect(result).toEqual({
        total_stores: 2,
        total_products: 45,
        total_orders_received: 100,
        total_revenue: 12000000
      });
    });

    it('should fetch dashboard stats with all filters', async () => {
      const storeId = 10;
      const startDate = '2023-11-01';
      const endDate = '2023-11-30';
      const mockStats = [{
        total_stores: 1,
        total_products: 15,
        total_orders_received: 25,
        total_revenue: 400000
      }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockStats });

      const result = await orderRepository.getDashboardStats(userId, storeId, startDate, endDate);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId, storeId, startDate, endDate]
      );
      expect(result).toEqual({
        total_stores: 1,
        total_products: 15,
        total_orders_received: 25,
        total_revenue: 400000
      });
    });
  });
});
