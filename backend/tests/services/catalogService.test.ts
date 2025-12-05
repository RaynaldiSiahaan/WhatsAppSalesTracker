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
      const mockStore = { id: 'store-123', slug: 'my-store' };
      const mockProducts = [
        { id: 'p1', is_active: true, stock_quantity: 10 },
        { id: 'p2', is_active: false, stock_quantity: 10 },
        { id: 'p3', is_active: true, stock_quantity: 0 },
      ];

      (storeRepository.findStoreBySlug as jest.Mock).mockResolvedValue(mockStore);
      (productRepository.findProductsByStoreId as jest.Mock).mockResolvedValue(mockProducts);

      const result = await catalogService.getCatalogBySlug('my-store');

      expect(storeRepository.findStoreBySlug).toHaveBeenCalledWith('my-store');
      expect(productRepository.findProductsByStoreId).toHaveBeenCalledWith('store-123', 100, 0);
      expect(result.store).toEqual(mockStore);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].id).toBe('p1');
    });

    it('should throw NotFoundError if store not found', async () => {
      (storeRepository.findStoreBySlug as jest.Mock).mockResolvedValue(null);

      await expect(catalogService.getCatalogBySlug('unknown'))
        .rejects.toThrow(NotFoundError);
    });
  });
});
