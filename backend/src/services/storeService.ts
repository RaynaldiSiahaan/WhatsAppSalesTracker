import { storeRepository, Store } from '../repositories/storeRepository';
import { BadRequestError, NotFoundError } from '../utils/custom-errors';

class StoreService {
  async createStore(userId: string, name: string, location?: string): Promise<Store> {
    if (!name) {
      throw new BadRequestError('Store name is required');
    }

    // Check for one-store-per-user constraint
    const existingStores = await storeRepository.findStoresByUserId(userId);
    if (existingStores.length > 0) {
      throw new BadRequestError('User already has a store. Only one store per user is allowed in this phase.');
    }

    return storeRepository.createStore(userId, name, location);
  }

  async getMyStores(userId: string): Promise<Store[]> {
    return storeRepository.findStoresByUserId(userId);
  }

  async getStoreById(storeId: string): Promise<Store> {
    const store = await storeRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundError('Store not found');
    }
    return store;
  }
}

export const storeService = new StoreService();
