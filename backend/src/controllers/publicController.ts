import { Request, Response, NextFunction } from 'express';
import { catalogService } from '../services/catalogService';
import { orderService } from '../services/orderService';
import { sendResponse } from '../utils/http';
import { responseTemplates } from '../constants/responses';
import { BadRequestError } from '../utils/custom-errors';
import { isValidUUID } from '../utils/validation';

export const getCatalog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      throw new BadRequestError('Store slug is required');
    }

    const data = await catalogService.getCatalogBySlug(slug);
    return sendResponse(res, responseTemplates.ok('Catalog retrieved successfully', data));
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { store_id, customer_name, customer_phone, pickup_time, items } = req.body;

    // Basic Validation
    if (!isValidUUID(store_id)) {
      throw new BadRequestError('Invalid store ID');
    }
    if (!customer_name || !customer_phone) {
      throw new BadRequestError('Customer name and phone are required');
    }
    if (!pickup_time) {
      throw new BadRequestError('Pickup time is required');
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new BadRequestError('Order must contain at least one item');
    }

    const order = await orderService.createPublicOrder({
        store_id,
        customer_name,
        customer_phone,
        pickup_time,
        items
    });

    return sendResponse(res, responseTemplates.ok('Order created successfully', order));
  } catch (error) {
    next(error);
  }
};
