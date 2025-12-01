import { Response } from 'express';
import { BaseResponse } from '../constants/responses';

export const sendResponse = <T>(res: Response, body: BaseResponse<T>) => res.status(body.statusCode).json(body);
