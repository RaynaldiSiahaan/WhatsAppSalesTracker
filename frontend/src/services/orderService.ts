import { api } from '@/lib/api';
import { OrderPayload, Order, ApiResponse } from '@/types/models';

export const orderService = {
  createOrder: async (payload: OrderPayload) => {
    const response = await api.post<ApiResponse<Order>>('/public/orders', payload);
    return response.data;
  }
};
