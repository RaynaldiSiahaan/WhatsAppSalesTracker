import { api } from '@/lib/api';
import { Product, ApiResponse } from '@/types/models';

export const productService = {
  addProduct: async (storeId: number, data: any) => {
    // data should include image_url which is result of upload
    const response = await api.post<ApiResponse<Product>>(`/stores/${storeId}/products`, data);
    return response.data;
  },

  updateStock: async (productId: number, newQuantity: number) => {
    const response = await api.patch<ApiResponse<Product>>(`/products/${productId}/stock`, { newQuantity });
    return response.data;
  },
  
  deleteProduct: async (productId: number) => {
      const response = await api.delete<ApiResponse<any>>(`/products/${productId}`);
      return response.data;
  },

  uploadImage: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post<ApiResponse<{url: string}>>('/upload', formData, {
          headers: {
              'Content-Type': 'multipart/form-data'
          }
      });
      return response.data;
  }
};
