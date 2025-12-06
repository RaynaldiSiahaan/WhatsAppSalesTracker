import { catalogService } from '../../src/services/catalogService';
import { storeRepository } from '../../src/repositories/storeRepository';
import { productRepository } from '../../src/repositories/productRepository';
import { NotFoundError } from '../../src/utils/custom-errors';

jest.mock('../../src/repositories/storeRepository');
jest.mock('../../src/repositories/productRepository');

describe('CatalogService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCatalogBySlug', () => {
    it('should return store and active products', async () => {
      const mockStore = { id: 10, slug: 'my-store' };
      const mockProducts = [
        { id: 50, is_active: true, stock_quantity: 10 },
        { id: 51, is_active: false, stock_quantity: 10 },
        { id: 52, is_active: true, stock_quantity: 0 },
      ];

      (storeRepository.findStoreBySlug as jest.Mock).mockResolvedValue(mockStore);
      (productRepository.findProductsByStoreId as jest.Mock).mockResolvedValue(mockProducts);

      const result = await catalogService.getCatalogBySlug('my-store');

      expect(storeRepository.findStoreBySlug).toHaveBeenCalledWith('my-store');
      expect(productRepository.findProductsByStoreId).toHaveBeenCalledWith(10, 100, 0);
      expect(result.store).toEqual(mockStore);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].id).toBe(50);
    });

    it('should throw NotFoundError if store not found', async () => {
      (storeRepository.findStoreBySlug as jest.Mock).mockResolvedValue(null);

      await expect(catalogService.getCatalogBySlug('unknown'))
        .rejects.toThrow(NotFoundError);
    });
  });
});
