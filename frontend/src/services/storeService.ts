import { api } from '@/lib/api';
import { Store, ApiResponse } from '@/types/models';

export const storeService = {
  createStore: async (data: { name: string; location: string }) => {
    const response = await api.post<ApiResponse<Store>>('/stores', data);
    return response.data;
  },

  getMyStores: async () => {
    const response = await api.get<ApiResponse<Store[]>>('/stores/my');
    return response.data;
  },

  getStoreBySlug: async (slug: string) => {
     // Note: This endpoint might need to be adjusted based on actual backend implementation 
     // if public catalog is different from internal store fetch. 
     // Based on contract: GET /api/public/catalog/:slug returns store info + products
     const response = await api.get<ApiResponse<{store: Store, products: any[]}>>(`/public/catalog/${slug}`);
     return response.data;
  }
};
