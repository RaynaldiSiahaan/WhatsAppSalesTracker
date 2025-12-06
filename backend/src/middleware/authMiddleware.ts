import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/custom-errors';
import { userRepository } from '../repositories/userRepository';

const JWT_SECRET = env.jwtSecret;

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    // Optional: Check if user still exists/active in DB on every request
    // This adds DB load but ensures strict security (e.g. immediate ban)
    const user = await userRepository.findUserById(decoded.userId);
    if (!user || !user.is_active) {
       return next(new UnauthorizedError('User not found or inactive'));
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid token'));
  }
};
