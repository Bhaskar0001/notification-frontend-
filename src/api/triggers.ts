import { apiClient } from './client';
import type { Trigger } from '../types';

export const triggersApi = {
  list: async (): Promise<Trigger[]> => {
    const res = await apiClient.get<{ results: Trigger[] } | Trigger[]>('/admin/triggers/');
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  get: async (id: string): Promise<Trigger> => {
    const res = await apiClient.get<Trigger>(`/admin/triggers/${id}/`);
    return res.data;
  },

  create: async (data: { name: string; event_key: string; description?: string; is_active?: boolean }): Promise<Trigger> => {
    const res = await apiClient.post<Trigger>('/admin/triggers/', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Trigger>): Promise<Trigger> => {
    const res = await apiClient.patch<Trigger>(`/admin/triggers/${id}/`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/triggers/${id}/`);
  },
};
