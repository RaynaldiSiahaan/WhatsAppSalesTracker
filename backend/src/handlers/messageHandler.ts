import { NextFunction, Request, Response } from 'express';
import { responseTemplates } from '../constants/responses';
import { parseMessagePreviewRequest } from '../parsers/messageParser';
import { generateMessagePreview } from '../usecases/generateMessagePreview';
import { sendResponse } from '../utils/http';

export const createMessagePreviewHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseMessagePreviewRequest(req.body);
    const preview = await generateMessagePreview(payload);
    return sendResponse(res, responseTemplates.ok('Message preview generated', preview));
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return sendResponse(res, responseTemplates.badRequest(error.message));
    }
    return next(error);
  }
};
