import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Access environment variable
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to build full image URL
export const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already a full URL

  // Ensure BASE_URL and path are handled correctly for concatenation
  const cleanedBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanedPath = path.startsWith('/') ? path.substring(1) : path;

  return `${cleanedBaseUrl}/${cleanedPath}`;
};

// Interceptor to add Token to requests
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for responses (Global Error Handling could go here)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't retried yet
    // Exclude login/refresh endpoints from retry logic to avoid loops
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true;
      const { refreshToken, login, logout, user } = useAuthStore.getState();

      if (refreshToken) {
        try {
          // Use a separate axios instance to avoid interceptors
          const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          
          if (response.data.success) {
             const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
             
             // Update store
             if (user) {
                 login(user, newAccessToken, newRefreshToken);
             }

             // Update header for original request
             originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
             
             // Retry original request with new token
             return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed (e.g. refresh token expired)
          logout();
          return Promise.reject(refreshError);
        }
      } else {
          // No refresh token available
          logout();
      }
    }

    // Standardize error message for frontend consumption
    if (error.response && error.response.data) {
        // Backend standard error response: { status_code, success: false, message, error: "Detail" }
        const apiError = error.response.data;
        // Attach a friendly message to the error object for UI to use
        // We prefer the 'message' field if it's intended for display, or 'error' if it's a detail.
        // Typically backend sends "message" as human readable status and "error" as detail.
        // Let's try to find the most useful one.
        error.message = apiError.message || apiError.error || error.message;
    }

    return Promise.reject(error);
  }
);
