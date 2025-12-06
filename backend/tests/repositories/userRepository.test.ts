import { userRepository } from '../../src/repositories/userRepository';
import pool from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  connect: jest.fn(),
}));

jest.mock('../../src/utils/logger');

describe('UserRepository', () => {
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

  describe('createUser', () => {
    it('should insert a user and return it', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hash',
        is_active: true,
      };
      mockClient.query.mockResolvedValue({ rows: [mockUser] });

      const result = await userRepository.createUser('test@example.com', 'hash');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['test@example.com', 'hash']
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findUserByEmail', () => {
    it('should return user if found', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      mockClient.query.mockResolvedValue({ rows: [mockUser] });

      const result = await userRepository.findUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null if not found', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await userRepository.findUserByEmail('test@example.com');

      expect(result).toBeNull();
    });
  });
});
