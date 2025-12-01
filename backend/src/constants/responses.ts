export interface BaseResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  error?: string | null;
}

const createResponse = <T>(statusCode: number, success: boolean, message: string, payload?: Partial<BaseResponse<T>>) => ({
  statusCode,
  success,
  message,
  data: payload?.data,
  error: success ? null : payload?.error ?? message
});

export const responseTemplates = {
  ok: <T>(message = 'Request processed successfully', data?: T): BaseResponse<T> =>
    createResponse(200, true, message, { data }),
  badRequest: (message = 'Your request is invalid'): BaseResponse =>
    createResponse(400, false, message, { error: message }),
  unauthorized: (message = 'You are not authorized to perform this action'): BaseResponse =>
    createResponse(401, false, message, { error: message }),
  notFound: (message = 'Resource not found'): BaseResponse =>
    createResponse(404, false, message, { error: message }),
  serverError: (message = 'Internal server error'): BaseResponse =>
    createResponse(500, false, message, { error: message })
};
