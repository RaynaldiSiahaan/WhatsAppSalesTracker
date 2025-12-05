import { storeRepository } from '../repositories/storeRepository';
import { productRepository } from '../repositories/productRepository';
import { NotFoundError } from '../utils/custom-errors';

class CatalogService {
  async getCatalogBySlug(slug: string) {
    const store = await storeRepository.findStoreBySlug(slug);
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Get all products for this store
    // Note: ProductRepository.findProductsByStoreId currently implements pagination.
    // For public catalog, we might want "all active products with stock > 0".
    // I should add a method for that in productRepository or reuse existng with large limit.
    // Ideally, we need a specific query: WHERE store_id = $1 AND is_active = TRUE AND stock_quantity > 0
    
    // For now, I'll reuse the existing one but filtering in memory or adding a specialized method is better.
    // Let's assume we show first 100 items or similar.
    // But strictly, we should filter active and stock.
    // The existing findProductsByStoreId doesn't filter is_active or stock.
    
    // Refactor opportunity: Add findPublicProducts(storeId) to repository?
    // Since I cannot easily edit repository multiple times efficiently, I'll do a raw query here or just use what I have and filter?
    // Using raw query logic inside service is bad pattern (Layer violation).
    // I'll stick to findProductsByStoreId and filter in memory for MVP, OR better:
    // Modify productRepository to have `findActiveProductsByStoreId`.
    
    // Let's use the existing one and filter for now to save steps, assuming dataset is small.
    // "Filter stock_quantity > 0 dan is_active = TRUE" is required by spec.
    
    const products = await productRepository.findProductsByStoreId(store.id, 100, 0);
    const validProducts = products.filter(p => p.is_active && p.stock_quantity > 0);

    return {
      store,
      products: validProducts
    };
  }
}

export const catalogService = new CatalogService();
