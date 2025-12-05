import request from 'supertest';
import app from '../../src/app';
import { productService } from '../../src/services/productService';

jest.mock('../../src/middleware/authMiddleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { userId: 'user-123' };
    next();
  },
}));

jest.mock('../../src/services/productService');

describe('Product Routes', () => {
  describe('POST /api/stores/:storeId/products', () => {
    it('should create a product', async () => {
      const mockProduct = { id: 'prod-123', name: 'Prod' };
      (productService.addProduct as jest.Mock).mockResolvedValue(mockProduct);

      // Use a valid UUID for storeId to pass validation
      const validStoreId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .post(`/api/stores/${validStoreId}/products`)
        .send({ name: 'Prod', price: 10, stock_quantity: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockProduct);
    });
  });
});
