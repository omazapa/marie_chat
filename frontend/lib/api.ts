import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
console.log('🌐 API_URL configured as:', API_URL);

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    
    console.log(`🚀 Axios Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Axios Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    console.error(`❌ Axios Response Error: ${error.message} (${error.config?.url})`);
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        
        // Update tokens in store
        useAuthStore.getState().updateTokens(access_token);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout();
        
        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
