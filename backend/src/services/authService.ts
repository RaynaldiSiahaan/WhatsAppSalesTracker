import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { userRepository } from '../repositories/userRepository';
import { env } from '../config/env';
import { BadRequestError, UnauthorizedError } from '../utils/custom-errors';

// Secret key for JWT
const JWT_SECRET = env.jwtSecret;
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

class AuthService {
  async register(email: string, password: string) {
    const existingUser = await userRepository.findUserByEmail(email);
    if (existingUser) {
      throw new BadRequestError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.createUser(email, passwordHash);
    
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(email: string, password: string) {
    const user = await userRepository.findUserByEmail(email);
    
    // Check if user exists and is active (Soft Delete Check)
    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    const storedToken = await userRepository.findRefreshToken(token);
    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (new Date() > storedToken.expires_at) {
      await userRepository.deleteRefreshToken(token);
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = await userRepository.findUserById(storedToken.user_id);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Rotate Refresh Token
    await userRepository.deleteRefreshToken(token);
    const newAccessToken = this.generateAccessToken(user.id);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async softDeleteAccount(userId: number) {
    const deletedUser = await userRepository.softDeleteUser(userId);
    if (!deletedUser) {
      throw new BadRequestError('User not found');
    }
    // Invalidate all refresh tokens for this user
    await userRepository.deleteRefreshTokensByUserId(userId);
    
    return { message: 'Account deactivated successfully' };
  }

  async changePassword(userId: number, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updateUser(userId, { password_hash: passwordHash });
    return { message: 'Password updated successfully' };
  }

  private generateAccessToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    // Use a random string for refresh token (opaque token)
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await userRepository.saveRefreshToken(token, userId, expiresAt);
    return token;
  }
}

export const authService = new AuthService();
