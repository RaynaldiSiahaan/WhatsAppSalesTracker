import request from 'supertest';
import app from '../../src/app';
import { storeService } from '../../src/services/storeService';

// Mock auth middleware to bypass real authentication
jest.mock('../../src/middleware/authMiddleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { userId: 'user-123' };
    next();
  },
}));

jest.mock('../../src/services/storeService');

describe('Store Routes', () => {
  describe('POST /api/stores', () => {
    it('should create a store', async () => {
      const mockStore = { id: 'store-123', name: 'Test Store' };
      (storeService.createStore as jest.Mock).mockResolvedValue(mockStore);

      const response = await request(app)
        .post('/api/stores')
        .send({ name: 'Test Store', location: 'Loc' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockStore);
    });
  });

  describe('GET /api/stores/my', () => {
    it('should return my stores', async () => {
      const mockStores = [{ id: 'store-123', name: 'Test Store' }];
      (storeService.getMyStores as jest.Mock).mockResolvedValue(mockStores);

      const response = await request(app).get('/api/stores/my');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockStores);
    });
  });
});