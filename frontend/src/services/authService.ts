import { api } from '@/lib/api';
import { LoginResponse, User, ApiResponse } from '@/types/models';

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<User>>('/auth/register', data);
    return response.data;
  },
  
  refreshToken: async (token: string) => {
      const response = await api.post<ApiResponse<{accessToken: string, refreshToken: string}>>('/auth/refresh', { refreshToken: token });
      return response.data;
  }
};
