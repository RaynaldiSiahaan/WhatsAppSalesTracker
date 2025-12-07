import { api } from '@/lib/api';
import { ApiResponse, DashboardStats, DashboardFilter } from '@/types/models';

export const dashboardService = {
  getStats: async (filter?: DashboardFilter) => {
    const response = await api.get<ApiResponse<DashboardStats>>('/seller/dashboard/stats', {
      params: filter
    });
    return response.data;
  }
};
