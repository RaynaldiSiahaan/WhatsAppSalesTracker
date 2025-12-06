import { productService } from '../../src/services/productService';
import { productRepository } from '../../src/repositories/productRepository';
import { storeRepository } from '../../src/repositories/storeRepository';
import { BadRequestError, ForbiddenError } from '../../src/utils/custom-errors';

jest.mock('../../src/repositories/productRepository');
jest.mock('../../src/repositories/storeRepository');

describe('ProductService', () => {
  describe('addProduct', () => {
    it('should add a product if user owns the store', async () => {
      (storeRepository.findStoreById as jest.Mock).mockResolvedValue({ user_id: 1 });
      (productRepository.createProduct as jest.Mock).mockResolvedValue({ id: 50 });

      const result = await productService.addProduct(1, 10, {
        name: 'Product',
        price: 10,
        stock_quantity: 5,
      });

      expect(result).toEqual({ id: 50 });
    });

    it('should throw ForbiddenError if user does not own the store', async () => {
      (storeRepository.findStoreById as jest.Mock).mockResolvedValue({ user_id: 2 });

      await expect(productService.addProduct(1, 10, {
        name: 'Product',
        price: 10,
        stock_quantity: 5,
      })).rejects.toThrow(ForbiddenError);
    });

    it('should throw BadRequestError for negative price', async () => {
      await expect(productService.addProduct(1, 10, {
        name: 'Product',
        price: -10,
        stock_quantity: 5,
      })).rejects.toThrow(BadRequestError);
    });
  });
});
