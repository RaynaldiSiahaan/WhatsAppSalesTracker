import { orderService } from '../../src/services/orderService';
import { orderRepository } from '../../src/repositories/orderRepository';
import { productRepository } from '../../src/repositories/productRepository';
import { storeRepository } from '../../src/repositories/storeRepository';
import pool from '../../src/config/database';
import { BadRequestError, NotFoundError } from '../../src/utils/custom-errors';

jest.mock('../../src/repositories/orderRepository');
jest.mock('../../src/repositories/productRepository');
jest.mock('../../src/repositories/storeRepository');
jest.mock('../../src/config/database', () => ({
  connect: jest.fn(),
}));
jest.mock('../../src/utils/logger');

describe('OrderService', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPublicOrder', () => {
    const mockOrderData = {
      store_id: 10,
      customer_name: 'Customer',
      customer_phone: '1234567890',
      pickup_time: '2023-01-01T10:00:00Z',
      items: [{ product_id: 50, quantity: 2 }]
    };

    it('should create an order successfully', async () => {
      (storeRepository.findStoreById as jest.Mock).mockResolvedValue({ 
        id: 10, 
        store_code: 'ABCDE' 
      });
      (productRepository.decreaseStock as jest.Mock).mockResolvedValue({ 
        id: 50, 
        name: 'Product 1', 
        price: 100, 
        store_id: 10 
      });
      (orderRepository.createOrder as jest.Mock).mockResolvedValue({ id: 500 });
      (orderRepository.createOrderItem as jest.Mock).mockResolvedValue({});

      const result = await orderService.createPublicOrder(mockOrderData);

      expect(pool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(storeRepository.findStoreById).toHaveBeenCalledWith(10);
      expect(productRepository.decreaseStock).toHaveBeenCalled();
      expect(orderRepository.createOrder).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toHaveProperty('id', 500);
    });

    it('should throw NotFoundError if store not found', async () => {
      (storeRepository.findStoreById as jest.Mock).mockResolvedValue(null);

      await expect(orderService.createPublicOrder(mockOrderData))
        .rejects.toThrow(NotFoundError);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw BadRequestError if product out of stock', async () => {
      (storeRepository.findStoreById as jest.Mock).mockResolvedValue({ id: 10 });
      (productRepository.decreaseStock as jest.Mock).mockResolvedValue(null);

      await expect(orderService.createPublicOrder(mockOrderData))
        .rejects.toThrow(BadRequestError);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
