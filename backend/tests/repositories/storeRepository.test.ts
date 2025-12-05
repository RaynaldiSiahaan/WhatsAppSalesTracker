import { storeRepository } from '../../src/repositories/storeRepository';
import pool from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  connect: jest.fn(),
}));

jest.mock('../../src/utils/logger');

describe('StoreRepository', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createStore', () => {
    it('should create a store and return it', async () => {
      const mockStore = {
        id: 'store-123',
        user_id: 'user-123',
        name: 'Test Store',
        location: 'Test Location',
        created_by: 'user-123',
        created_at: new Date(),
        updated_by: null,
        updated_at: null,
      };

      mockClient.query.mockResolvedValue({ rows: [mockStore] });

      const result = await storeRepository.createStore('user-123', 'Test Store', 'test-store', 'ABCDE', 'Test Location');

      expect(result).toEqual(mockStore);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO stores'),
        ['user-123', 'Test Store', 'test-store', 'ABCDE', 'Test Location']
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('findStoresByUserId', () => {
    it('should return stores for a given user id', async () => {
      const mockStores = [
        { id: 'store-1', name: 'Store 1', user_id: 'user-123' },
        { id: 'store-2', name: 'Store 2', user_id: 'user-123' },
      ];

      mockClient.query.mockResolvedValue({ rows: mockStores });

      const result = await storeRepository.findStoresByUserId('user-123');

      expect(result).toEqual(mockStores);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['user-123']
      );
    });
  });
});
