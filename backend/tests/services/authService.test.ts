import { authService } from '../../src/services/authService';
import { userRepository } from '../../src/repositories/userRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BadRequestError, UnauthorizedError } from '../../src/utils/custom-errors';

jest.mock('../../src/repositories/userRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      };

      (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (userRepository.createUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.register('test@example.com', 'password');

      expect(userRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(userRepository.createUser).toHaveBeenCalledWith('test@example.com', 'hashed_password');
      expect(result).not.toHaveProperty('password_hash');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw BadRequestError if email already exists', async () => {
      (userRepository.findUserByEmail as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(authService.register('test@example.com', 'password'))
        .rejects.toThrow(BadRequestError);
    });
  });

  describe('login', () => {
    it('should login successfully and return tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        is_active: true
      };

      (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('access_token');
      (userRepository.saveRefreshToken as jest.Mock).mockResolvedValue({});

      const result = await authService.login('test@example.com', 'password');

      expect(userRepository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed_password');
      expect(result).toHaveProperty('accessToken', 'access_token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('test@example.com', 'password'))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password invalid', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        is_active: true
      };

      (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'password'))
        .rejects.toThrow(UnauthorizedError);
    });
  });
});
