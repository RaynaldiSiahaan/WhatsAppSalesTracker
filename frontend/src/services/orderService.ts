import { api } from '@/lib/api';
import { OrderPayload, Order, ApiResponse } from '@/types/models';

export const orderService = {
  createOrder: async (payload: OrderPayload) => {
    const response = await api.post<ApiResponse<Order>>('/public/orders', payload);
    return response.data;
  },

  getStoreOrders: async (storeId: number) => {
    const response = await api.get<ApiResponse<Order[]>>(`/stores/${storeId}/orders`);
    return response.data;
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${orderId}/status`, { status });
    return response.data;
  }
};
