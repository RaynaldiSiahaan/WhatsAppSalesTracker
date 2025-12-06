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
        id: 10,
        user_id: 1,
        name: 'Test Store',
        slug: 'test-store',
        store_code: 'ABCDE',
        location: 'Test Location',
        created_by: 1,
        created_at: new Date(),
        updated_by: null,
        updated_at: null,
      };

      mockClient.query.mockResolvedValue({ rows: [mockStore] });

      const result = await storeRepository.createStore(1, 'Test Store', 'test-store', 'ABCDE', 'Test Location');

      expect(result).toEqual(mockStore);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO stores'),
        [1, 'Test Store', 'test-store', 'ABCDE', 'Test Location']
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('findStoresByUserId', () => {
    it('should return stores for a given user id', async () => {
      const mockStores = [
        { id: 1, name: 'Store 1', user_id: 1 },
        { id: 2, name: 'Store 2', user_id: 1 },
      ];

      mockClient.query.mockResolvedValue({ rows: mockStores });

      const result = await storeRepository.findStoresByUserId(1);

      expect(result).toEqual(mockStores);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });
  });
});
