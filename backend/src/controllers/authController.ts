import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { sendResponse } from '../utils/http';
import { responseTemplates } from '../constants/responses';
import { CustomError, UnauthorizedError } from '../utils/custom-errors';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendResponse(res, responseTemplates.badRequest('Email and password are required'));
    }
    const user = await authService.register(email, password);
    return sendResponse(res, responseTemplates.ok('User registered successfully', user));
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendResponse(res, responseTemplates.badRequest('Email and password are required'));
    }
    const data = await authService.login(email, password);
    return sendResponse(res, responseTemplates.ok('Login successful', data));
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return sendResponse(res, responseTemplates.unauthorized(error.message));
    }
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendResponse(res, responseTemplates.badRequest('Refresh token is required'));
    }
    const data = await authService.refreshToken(refreshToken);
    return sendResponse(res, responseTemplates.ok('Token refreshed successfully', data));
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Assuming user ID is attached to req.user by auth middleware
    const userId = (req as any).user?.userId as number; 
    await authService.softDeleteAccount(userId);
    return sendResponse(res, responseTemplates.ok('Account deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId as number;
    const { newPassword } = req.body;
    if (!newPassword) {
      return sendResponse(res, responseTemplates.badRequest('New password is required'));
    }
    await authService.changePassword(userId, newPassword);
    return sendResponse(res, responseTemplates.ok('Password changed successfully'));
  } catch (error) {
    next(error);
  }
};
