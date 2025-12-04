import { Request, Response, NextFunction } from 'express';
import { storeService } from '../services/storeService';
import { sendResponse } from '../utils/http';
import { responseTemplates } from '../constants/responses';
import { BadRequestError } from '../utils/custom-errors';
import { isValidName, isOptionalString } from '../utils/validation';

export const createStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, location } = req.body;

    if (!isValidName(name)) {
      throw new BadRequestError('Store name is required and must be between 1 and 255 characters');
    }

    if (!isOptionalString(location)) {
      throw new BadRequestError('Location must be a string');
    }

    // Assuming userId is available from authentication middleware
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendResponse(res, responseTemplates.unauthorized('User not authenticated'));
    }

    const newStore = await storeService.createStore(userId, name, location);
    return sendResponse(res, responseTemplates.ok('Store created successfully', newStore));
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

export const getMyStores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendResponse(res, responseTemplates.unauthorized('User not authenticated'));
    }

    const stores = await storeService.getMyStores(userId);
    return sendResponse(res, responseTemplates.ok('My stores retrieved successfully', stores));
  } catch (error) {
    next(error);
  }
};