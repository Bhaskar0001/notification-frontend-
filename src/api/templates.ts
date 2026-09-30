import { apiClient } from './client';
import type { NotificationTemplate } from '../types';

export const templatesApi = {
  list: async (triggerId?: string): Promise<NotificationTemplate[]> => {
    const params = triggerId ? { trigger: triggerId } : {};
    const res = await apiClient.get<{ results: NotificationTemplate[] } | NotificationTemplate[]>('/admin/templates/', { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  get: async (id: string): Promise<NotificationTemplate> => {
    const res = await apiClient.get<NotificationTemplate>(`/admin/templates/${id}/`);
    return res.data;
  },

  create: async (data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const res = await apiClient.post<NotificationTemplate>('/admin/templates/', data);
    return res.data;
  },

  update: async (id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const res = await apiClient.patch<NotificationTemplate>(`/admin/templates/${id}/`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/templates/${id}/`);
  },

  toggle: async (id: string): Promise<NotificationTemplate> => {
    const res = await apiClient.patch<NotificationTemplate>(`/admin/templates/${id}/toggle/`);
    return res.data;
  },

  testSend: async (id: string): Promise<{ status: string; notification_id: string; provider_response?: any }> => {
    const res = await apiClient.post(`/admin/templates/${id}/test/`);
    return res.data;
  },
};
