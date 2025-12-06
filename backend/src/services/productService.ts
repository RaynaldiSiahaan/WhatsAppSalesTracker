import { productRepository } from '../repositories/productRepository';
import { storeRepository } from '../repositories/storeRepository'; // To verify store ownership
import { Product, CreateProductData } from '../entities/product';
import { BadRequestError, NotFoundError, ForbiddenError, InternalServerError } from '../utils/custom-errors';

class ProductService {
  async addProduct(userId: number, storeId: number, data: CreateProductData): Promise<Product> {
    // 1. Validate input data (basic checks, more detailed validation can be done in DTO/Controller)
    if (!data.name || data.price === undefined || data.stock_quantity === undefined) {
      throw new BadRequestError('Product name, price, and stock quantity are required.');
    }
    if (data.price < 0) {
      throw new BadRequestError('Product price cannot be negative.');
    }
    if (data.stock_quantity < 0) {
      throw new BadRequestError('Product stock quantity cannot be negative.');
    }

    // 2. Verify store ownership (Data Isolation)
    const store = await storeRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundError('Store not found.');
    }
    if (store.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to add products to this store.');
    }

    // 3. Create product
    return productRepository.createProduct(storeId, userId, data);
  }

  async updateStock(userId: number, productId: number, newQuantity: number): Promise<Product> {
    // 1. Validate input
    if (newQuantity < 0) {
      throw new BadRequestError('Stock quantity cannot be negative.');
    }

    // 2. Verify product exists
    const product = await productRepository.findProductById(productId);
    if (!product) {
      throw new NotFoundError('Product not found.');
    }

    // 3. Verify store ownership (Data Isolation)
    const store = await storeRepository.findStoreById(product.store_id);
    if (!store || store.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to update stock for this product.');
    }

    // 4. Update stock
    const updatedProduct = await productRepository.updateProductStock(productId, userId, newQuantity);
    if (!updatedProduct) {
        throw new InternalServerError('Failed to update product stock.'); // Should not happen if product found and updated
    }
    return updatedProduct;
  }

  async deleteProduct(userId: number, productId: number): Promise<{ message: string }> {
    // 1. Verify product exists
    const product = await productRepository.findProductById(productId);
    if (!product) {
      throw new NotFoundError('Product not found.');
    }

    // 2. Verify store ownership (Data Isolation)
    const store = await storeRepository.findStoreById(product.store_id);
    if (!store || store.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to delete this product.');
    }

    // 3. Soft delete product
    await productRepository.softDeleteProduct(productId, userId);
    return { message: 'Product soft-deleted successfully.' };
  }
}

export const productService = new ProductService();
