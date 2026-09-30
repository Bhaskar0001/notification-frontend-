import { apiClient } from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  register: async (data: any): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register/', data);
    return res.data;
  },

  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login/', credentials);
    return res.data;
  },

  logout: async (): Promise<void> => {
    const refresh = localStorage.getItem('refresh_token');
    try {
      await apiClient.post('/auth/logout/', { refresh });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me/');
    return res.data;
  },

  updateProfile: async (data: { first_name?: string; last_name?: string; phone?: string }): Promise<User> => {
    const res = await apiClient.patch<User>('/users/me/', data);
    return res.data;
  },
};
