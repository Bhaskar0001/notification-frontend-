import { apiClient } from './client';
import type { NotificationLog, NotificationDetail, AdminStats } from '../types';

export const notificationsApi = {
  list: async (params?: { status?: string; channel?: string }): Promise<NotificationLog[]> => {
    const res = await apiClient.get<{ results: NotificationLog[] } | NotificationLog[]>('/admin/notifications/', { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  get: async (id: string): Promise<NotificationDetail> => {
    const res = await apiClient.get<NotificationDetail>(`/admin/notifications/${id}/`);
    return res.data;
  },

  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get<AdminStats>('/admin/stats/');
    return res.data;
  },
};
