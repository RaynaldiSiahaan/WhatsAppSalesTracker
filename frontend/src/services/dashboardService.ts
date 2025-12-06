import { api } from '@/lib/api';
import { ApiResponse, DashboardStats } from '@/types/models';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get<ApiResponse<DashboardStats>>('/seller/dashboard/stats');
    return response.data;
  }
};
