import { api } from '@/lib/api';
import { ApiResponse } from '@/types/models';

export const aiService = {
  chat: async (message: string, context?: any[]) => {
    const response = await api.post<ApiResponse<string>>('/ai/chat', { message, context });
    return response.data;
  }
};
