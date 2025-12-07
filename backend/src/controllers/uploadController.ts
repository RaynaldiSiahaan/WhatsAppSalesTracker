import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/http';
import { responseTemplates } from '../constants/responses';
import { BadRequestError } from '../utils/custom-errors';
import { env } from '../config/env';

export const uploadImage = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }
    let imageUploadPath = env.imageUploadPath;
    // Construct the relative URL
    // Assuming we serve 'uploads' directory at root or /uploads
    // Let's align with app.ts config.
    // If app.use('/uploads', express.static('uploads')), then URL is /uploads/filename
    const url = `${imageUploadPath}/uploads/${req.file.filename}`;

    return sendResponse(res, responseTemplates.ok('Image uploaded successfully', { url }));
  } catch (error) {
    next(error);
  }
};
