import { Request, Response, NextFunction } from 'express';
import { CustomError, InternalServerError } from '../utils/custom-errors';
import { responseTemplates } from '../constants/responses';
import { logError, logger } from '../utils/logger'; // Use the structured logger

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  let errorResponse;
  if (err instanceof CustomError) {
    errorResponse = responseTemplates.error(err.statusCode, err.message, err.message);
    // Log 4xx errors as warnings to avoid noise/stack traces in logs
    if (err.statusCode < 500) {
        logger.warn(`Request Error: ${err.message}`, { 
            path: req.path, 
            method: req.method, 
            statusCode: err.statusCode, 
            errors: err.errors 
        });
    } else {
        logError('Request Error', err.message, err, { path: req.path, method: req.method, statusCode: err.statusCode, errors: err.errors });
    }
  } else {
    // For unexpected errors, send a generic server error response
    // and log the full error for debugging.
    const internalError = new InternalServerError();
    errorResponse = responseTemplates.serverError(internalError.message);
    logError('Unhandled Error', err.message, err, { path: req.path, method: req.method, stack: err.stack });
  }

  return res.status(errorResponse.status_code).json(errorResponse);
};
