import { apiClient } from './client';

export const pushApi = {
  getStatus: async (): Promise<{ is_subscribed: boolean; subscription_id: string | null }> => {
    const res = await apiClient.get('/push/subscribe/');
    return res.data;
  },

  subscribe: async (onesignalSubscriptionId: string): Promise<any> => {
    const res = await apiClient.post('/push/subscribe/', {
      onesignal_subscription_id: onesignalSubscriptionId,
    });
    return res.data;
  },

  unsubscribe: async (): Promise<any> => {
    const res = await apiClient.delete('/push/subscribe/');
    return res.data;
  },
};
