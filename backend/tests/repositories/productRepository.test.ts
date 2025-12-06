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
        id: 50,
        store_id: 10,
        name: 'Test Product',
        price: 100,
        stock_quantity: 10,
        created_by: 1,
      };

      mockClient.query.mockResolvedValue({ rows: [mockProduct] });

      const result = await productRepository.createProduct(10, 1, {
        name: 'Test Product',
        price: 100,
        stock_quantity: 10,
      });

      expect(result).toEqual(mockProduct);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        [10, 'Test Product', 100, 10, null, 1]
      );
    });
  });

  describe('findProductById', () => {
    it('should return a product by id', async () => {
      const mockProduct = { id: 50, name: 'Test Product' };
      mockClient.query.mockResolvedValue({ rows: [mockProduct] });

      const result = await productRepository.findProductById(50);

      expect(result).toEqual(mockProduct);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [50]
      );
    });
  });
});
