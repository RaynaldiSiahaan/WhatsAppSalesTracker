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
        expect.stringContaining('SELECT * FROM orders'),
        ['CODE']
      );
      expect(result).toEqual(mockOrder);
    });
  });
});
