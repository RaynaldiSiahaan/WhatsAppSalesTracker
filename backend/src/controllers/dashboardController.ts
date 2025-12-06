import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/orderService';
import { sendResponse } from '../utils/http';
import { responseTemplates } from '../constants/responses';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId as number;
    const stats = await orderService.getSellerStats(userId);
    return sendResponse(res, responseTemplates.ok('Dashboard stats retrieved successfully', stats));
  } catch (error) {
    next(error);
  }
};
