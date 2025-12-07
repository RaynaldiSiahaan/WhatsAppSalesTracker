import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/orderService';
import { sendResponse } from '../utils/http';
import { responseTemplates } from '../constants/responses';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId as number;
    const { storeId, startDate, endDate } = req.query;

    const stats = await orderService.getSellerStats(
      userId,
      storeId ? Number(storeId) : undefined,
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined
    );
    return sendResponse(res, responseTemplates.ok('Dashboard stats retrieved successfully', stats));
  } catch (error) {
    next(error);
  }
};
