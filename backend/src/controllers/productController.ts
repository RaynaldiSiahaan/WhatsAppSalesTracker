import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/productService';
import { sendResponse } from '../utils/http';
import { responseTemplates } from '../constants/responses';
import { BadRequestError } from '../utils/custom-errors';
import { 
  isValidName, 
  isNonNegativeNumber, 
  isNonNegativeInteger, 
  isValidUrl, 
  isValidId
} from '../utils/validation';

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.params;
    const { name, price, stock_quantity, image_url } = req.body;

    if (!isValidId(storeId)) {
      throw new BadRequestError('Invalid store ID format');
    }

    if (!isValidName(name)) {
      throw new BadRequestError('Product name is required and must be between 1 and 255 characters');
    }

    if (!isNonNegativeNumber(price)) {
      throw new BadRequestError('Price must be a non-negative number');
    }

    if (!isNonNegativeInteger(stock_quantity)) {
      throw new BadRequestError('Stock quantity must be a non-negative integer');
    }

    if (!isValidUrl(image_url)) {
      throw new BadRequestError('Image URL must be a valid URL');
    }

    const userId = (req as any).user?.userId as number;

    if (!userId) {
      return sendResponse(res, responseTemplates.unauthorized('User not authenticated'));
    }

    const newProduct = await productService.addProduct(
      userId,
      Number(storeId),
      { name, price, stock_quantity, image_url }
    );
    return sendResponse(res, responseTemplates.ok('Product added successfully', newProduct));
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { newQuantity } = req.body;

    if (!isValidId(productId)) {
      throw new BadRequestError('Invalid product ID format');
    }

    if (!isNonNegativeInteger(newQuantity)) {
      throw new BadRequestError('New quantity must be a non-negative integer');
    }

    const userId = (req as any).user?.userId as number;

    if (!userId) {
      return sendResponse(res, responseTemplates.unauthorized('User not authenticated'));
    }

    const updatedProduct = await productService.updateStock(userId, Number(productId), newQuantity);
    return sendResponse(res, responseTemplates.ok('Product stock updated successfully', updatedProduct));
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;

    if (!isValidId(productId)) {
      throw new BadRequestError('Invalid product ID format');
    }

    const userId = (req as any).user?.userId as number;

    if (!userId) {
      return sendResponse(res, responseTemplates.unauthorized('User not authenticated'));
    }

    const result = await productService.deleteProduct(userId, Number(productId));
    return sendResponse(res, responseTemplates.ok(result.message));
  } catch (error) {
    next(error);
  }
};