import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService';
import { sendResponse } from '../utils/http';
import { responseTemplates } from '../constants/responses';
import { BadRequestError } from '../utils/custom-errors';

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      throw new BadRequestError('Message is required');
    }

    // Check if context is valid JSON if provided
    // (Express json middleware handles parsing, so if it's here it's already an object/value)

    const response = await aiService.chat(message, context);
    return sendResponse(res, responseTemplates.ok('AI response retrieved successfully', response));
  } catch (error) {
    next(error);
  }
};
