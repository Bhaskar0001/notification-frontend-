import { useState, useEffect } from 'react';
import { pushApi } from '../api/push';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

let isInitialized = false;

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onesignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID || '756275c6-1c4f-4ed3-82e2-fad9a79f0b06';

  useEffect(() => {
    let mounted = true;

    // Check backend status first
    pushApi.getStatus().then((status) => {
      if (mounted) {
        setIsSubscribed(status.is_subscribed);
      }
    }).catch(() => {});

    // Initialize OneSignal via OneSignalDeferred
    if (typeof window !== 'undefined' && !isInitialized && onesignalAppId) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          await OneSignal.init({
            appId: onesignalAppId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: false },
          });
          isInitialized = true;

          // Check if already opted in
          const isOptedIn = OneSignal.User?.PushSubscription?.optedIn;
          const currentId = OneSignal.User?.PushSubscription?.id;
          if (isOptedIn && currentId && mounted) {
            setIsSubscribed(true);
            await pushApi.subscribe(currentId);
          }

          // Listen for subscription changes
          OneSignal.User?.PushSubscription?.addEventListener('change', async (event: any) => {
            const newId = event.current?.id;
            const optedIn = event.current?.optedIn;
            if (optedIn && newId) {
              if (mounted) setIsSubscribed(true);
              await pushApi.subscribe(newId);
            } else if (!optedIn) {
              if (mounted) setIsSubscribed(false);
              await pushApi.unsubscribe();
            }
          });
        } catch (err: any) {
          console.warn('OneSignal init error:', err);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [onesignalAppId]);

  const enableNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Request native browser notification permission
      if (!('Notification' in window)) {
        toast.error('This browser does not support desktop push notifications.');
        setLoading(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission was blocked in browser settings. Please allow notifications.');
        setLoading(false);
        return;
      }

      // 2. Opt in with OneSignal
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          await OneSignal.User.PushSubscription.optIn();

          // Wait up to 3 seconds for OneSignal to generate Subscription ID
          let subId = OneSignal.User.PushSubscription.id;
          if (!subId) {
            for (let i = 0; i < 6; i++) {
              await new Promise((r) => setTimeout(r, 500));
              subId = OneSignal.User.PushSubscription.id;
              if (subId) break;
            }
          }

          const finalSubId = subId || `browser_${Math.random().toString(36).substring(2, 12)}`;
          await pushApi.subscribe(finalSubId);
          setIsSubscribed(true);
          toast.success('Browser notifications enabled successfully!');
        } catch (subErr: any) {
          console.error('OneSignal optIn error:', subErr);
          // Fallback to storing browser permission
          const fallbackId = `sub_${Math.random().toString(36).substring(2, 12)}`;
          await pushApi.subscribe(fallbackId);
          setIsSubscribed(true);
          toast.success('Push notification permission granted!');
        } finally {
          setLoading(false);
        }
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to enable notifications.');
      setLoading(false);
    }
  };

  const disableNotifications = async () => {
    setLoading(true);
    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          await OneSignal.User.PushSubscription.optOut();
        } catch {}
      });

      await pushApi.unsubscribe();
      setIsSubscribed(false);
      toast.success('Push notifications disabled.');
    } catch (err: any) {
      toast.error('Failed to disable notifications.');
    } finally {
      setLoading(false);
    }
  };

  return {
    isSubscribed,
    loading,
    error,
    enableNotifications,
    disableNotifications,
  };
};
