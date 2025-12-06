import { response } from "express";

export interface BaseResponse<T = unknown> {
  status_code: number;
  success: boolean;
  message?: string;
  data?: T;
  error?: string|null;
}

const createResponse = <T>(status_code: number,  success:boolean, message?: string|null, data?: T|null, errorDetail?: string|null):BaseResponse<T> => {
  const response: BaseResponse<T> = {
    status_code,
    success
  };
  if (message) response.message = message;
  if (data !== undefined && data !== null) response.data = data;
  if (errorDetail && !success)  response.error = errorDetail;
  return response;
};

export const responseTemplates = {
  // SUKSES (200 OK)
  ok: <T>(message = 'Request processed successfully', data?: T): BaseResponse<T> =>
    createResponse(200, true, message, data),

  // ERROR (Generic)
  error: (statusCode: number, errorDetail: string, message?: string): BaseResponse<unknown> =>
    createResponse(statusCode, false, message, null, errorDetail),

  // ERROR (400 Bad Request)
  badRequest: (errorDetail = 'Your request is invalid', message?: string): BaseResponse<unknown> =>
    createResponse(400, false, message || 'Bad Request', null, errorDetail),

  // ERROR (401 Unauthorized)
  unauthorized: (errorDetail = 'You are not authorized to perform this action', message?: string): BaseResponse<unknown> =>
    createResponse(401, false, message || 'Unauthorized', null, errorDetail),

  // ERROR (403 Forbidden)
  forbidden: (errorDetail = 'Access to the resource is denied', message?: string): BaseResponse<unknown> =>
    createResponse(403, false, message || 'Forbidden', null, errorDetail),

  // ERROR (404 Not Found)
  notFound: (errorDetail = 'Resource not found', message?: string): BaseResponse<unknown> =>
    createResponse(404, false, message || 'Not Found', null, errorDetail),

  // ERROR (500 Internal Server Error)
  serverError: (errorDetail = 'Internal server error', message?: string): BaseResponse<unknown> =>
    createResponse(500, false, message || 'Server Error', null, errorDetail)
};