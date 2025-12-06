import { storeService } from '../../src/services/storeService';
import { storeRepository } from '../../src/repositories/storeRepository';
import { BadRequestError } from '../../src/utils/custom-errors';

jest.mock('../../src/repositories/storeRepository');
jest.mock('../../src/utils/slug', () => ({
  generateSlug: jest.fn().mockReturnValue('test-slug'),
  generateStoreCode: jest.fn().mockReturnValue('CODE5'),
}));

describe('StoreService', () => {
  describe('createStore', () => {
    it('should create a store if valid and user has no stores', async () => {
      (storeRepository.findStoresByUserId as jest.Mock).mockResolvedValue([]);
      (storeRepository.createStore as jest.Mock).mockResolvedValue({ id: 10 });
      // Mock findStoreBySlug and findStoreByStoreCode to return null (no collision)
      (storeRepository.findStoreBySlug as jest.Mock).mockResolvedValue(null);
      (storeRepository.findStoreByStoreCode as jest.Mock).mockResolvedValue(null);

      const result = await storeService.createStore(1, 'New Store');

      expect(result).toEqual({ id: 10 });
      expect(storeRepository.findStoresByUserId).toHaveBeenCalledWith(1);
      expect(storeRepository.createStore).toHaveBeenCalledWith(1, 'New Store', 'test-slug', 'CODE5', undefined);
    });

    it('should throw BadRequestError if user already has a store', async () => {
      (storeRepository.findStoresByUserId as jest.Mock).mockResolvedValue([{ id: 10 }]);

      await expect(storeService.createStore(1, 'Another Store'))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if name is missing', async () => {
      await expect(storeService.createStore(1, ''))
        .rejects.toThrow(BadRequestError);
    });
  });
});
