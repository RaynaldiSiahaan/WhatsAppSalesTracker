import { storeRepository, Store } from '../repositories/storeRepository';
import { BadRequestError, NotFoundError } from '../utils/custom-errors';
import { generateSlug, generateStoreCode } from '../utils/slug';

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

    // Generate Unique Slug
    let slug = generateSlug(name);
    let slugSuffix = 0;
    let isSlugUnique = false;
    
    // Simple collision resolution: append -1, -2, etc.
    // Safety break after 10 tries to prevent infinite loops (though unlikely)
    while (!isSlugUnique && slugSuffix < 10) {
      const candidateSlug = slugSuffix === 0 ? slug : `${slug}-${slugSuffix}`;
      const existing = await storeRepository.findStoreBySlug(candidateSlug);
      if (!existing) {
        slug = candidateSlug;
        isSlugUnique = true;
      } else {
        slugSuffix++;
      }
    }
    
    if (!isSlugUnique) {
       // Fallback: append random string if simple increment fails
       slug = `${slug}-${Date.now()}`;
    }

    // Generate Unique Store Code
    let storeCode = generateStoreCode();
    let isCodeUnique = false;
    let codeRetries = 0;

    while (!isCodeUnique && codeRetries < 5) {
      const existing = await storeRepository.findStoreByStoreCode(storeCode);
      if (!existing) {
        isCodeUnique = true;
      } else {
        storeCode = generateStoreCode();
        codeRetries++;
      }
    }

    if (!isCodeUnique) {
        throw new BadRequestError('Failed to generate a unique store code. Please try again.');
    }

    return storeRepository.createStore(userId, name, slug, storeCode, location);
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

  // Public Access
  async getStoreBySlug(slug: string): Promise<Store> {
    const store = await storeRepository.findStoreBySlug(slug);
    if (!store) {
      throw new NotFoundError('Store not found');
    }
    return store;
  }
}

export const storeService = new StoreService();
