import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/orderService';
import { sendResponse } from '../utils/http';
import { responseTemplates } from '../constants/responses';
import { UnauthorizedError, BadRequestError } from '../utils/custom-errors';
import { isValidId } from '../utils/validation';

export const getStoreOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;
    const userId = (req as any).user?.userId as number;

    if (!isValidId(storeId)) {
        throw new BadRequestError('Invalid store ID');
    }

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const orders = await orderService.getStoreOrders(userId, Number(storeId));
    return sendResponse(res, responseTemplates.ok('Orders retrieved successfully', orders));
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const userId = (req as any).user?.userId as number;

        if (!isValidId(orderId)) {
            throw new BadRequestError('Invalid order ID');
        }
        if (!status) {
            throw new BadRequestError('Status is required');
        }
        if (!userId) {
            throw new UnauthorizedError('User not authenticated');
        }

        const order = await orderService.updateOrderStatus(userId, Number(orderId), status);
        return sendResponse(res, responseTemplates.ok('Order status updated successfully', order));
    } catch (error) {
        next(error);
    }
}
