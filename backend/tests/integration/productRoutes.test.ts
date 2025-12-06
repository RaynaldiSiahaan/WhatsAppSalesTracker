import request from 'supertest';
import app from '../../src/app';
import { productService } from '../../src/services/productService';

jest.mock('../../src/middleware/authMiddleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { userId: 1 };
    next();
  },
}));

jest.mock('../../src/services/productService');

describe('Product Routes', () => {
  describe('POST /api/stores/:storeId/products', () => {
    it('should create a product', async () => {
      const mockProduct = { id: 50, name: 'Prod' };
      (productService.addProduct as jest.Mock).mockResolvedValue(mockProduct);

      // Use a number for storeId. In route it is string from params, but controller validates and service expects number.
      // Wait, controller logic: `const { storeId } = req.params;`. Params are strings.
      // `isValidUUID` check in controller needs to be changed to `isValidId` (integer check).
      // I will refactor controller validation in next step. Here I assume I send a valid number string "10".
      
      const validStoreId = '10';

      const response = await request(app)
        .post(`/api/stores/${validStoreId}/products`)
        .send({ name: 'Prod', price: 10, stock_quantity: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockProduct);
    });
  });
});
