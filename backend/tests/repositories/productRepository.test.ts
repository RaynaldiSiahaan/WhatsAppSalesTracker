import { productRepository } from '../../src/repositories/productRepository';
import pool from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  connect: jest.fn(),
}));

jest.mock('../../src/utils/logger');

describe('ProductRepository', () => {
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

  describe('createProduct', () => {
    it('should create a product and return it', async () => {
      const mockProduct = {
        id: 'prod-123',
        store_id: 'store-123',
        name: 'Test Product',
        price: 100,
        stock_quantity: 10,
        created_by: 'user-123',
      };

      mockClient.query.mockResolvedValue({ rows: [mockProduct] });

      const result = await productRepository.createProduct('store-123', 'user-123', {
        name: 'Test Product',
        price: 100,
        stock_quantity: 10,
      });

      expect(result).toEqual(mockProduct);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        ['store-123', 'Test Product', 100, 10, null, 'user-123']
      );
    });
  });

  describe('findProductById', () => {
    it('should return a product by id', async () => {
      const mockProduct = { id: 'prod-123', name: 'Test Product' };
      mockClient.query.mockResolvedValue({ rows: [mockProduct] });

      const result = await productRepository.findProductById('prod-123');

      expect(result).toEqual(mockProduct);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['prod-123']
      );
    });
  });
});
