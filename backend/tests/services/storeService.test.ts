import { storeService } from '../../src/services/storeService';
import { storeRepository } from '../../src/repositories/storeRepository';
import { BadRequestError } from '../../src/utils/custom-errors';

jest.mock('../../src/repositories/storeRepository');

describe('StoreService', () => {
  describe('createStore', () => {
    it('should create a store if valid and user has no stores', async () => {
      (storeRepository.findStoresByUserId as jest.Mock).mockResolvedValue([]);
      (storeRepository.createStore as jest.Mock).mockResolvedValue({ id: 'store-123' });

      const result = await storeService.createStore('user-123', 'New Store');

      expect(result).toEqual({ id: 'store-123' });
      expect(storeRepository.findStoresByUserId).toHaveBeenCalledWith('user-123');
      expect(storeRepository.createStore).toHaveBeenCalledWith('user-123', 'New Store', undefined);
    });

    it('should throw BadRequestError if user already has a store', async () => {
      (storeRepository.findStoresByUserId as jest.Mock).mockResolvedValue([{ id: 'existing-store' }]);

      await expect(storeService.createStore('user-123', 'Another Store'))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if name is missing', async () => {
      await expect(storeService.createStore('user-123', ''))
        .rejects.toThrow(BadRequestError);
    });
  });
});
