import { useState, useEffect, useCallback } from 'react';
import { pushApi } from '../api/push';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

let isOneSignalInitAttempted = false;

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onesignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID || '756275c6-1c4f-4ed3-82e2-fad9a79f0b06';

  // Check current backend status
  const checkStatus = useCallback(async () => {
    try {
      const status = await pushApi.getStatus();
      setIsSubscribed(status.is_subscribed);
      return status.is_subscribed;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Check backend subscription status
    checkStatus();

    // If native browser permission is already granted, verify or auto-sync
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      checkStatus().then((subscribed) => {
        if (!subscribed && mounted) {
          const storedSub = localStorage.getItem('onesignal_sub_id') || `browser_${Math.random().toString(36).substring(2, 12)}`;
          pushApi.subscribe(storedSub).then(() => {
            if (mounted) setIsSubscribed(true);
          }).catch(() => {});
        }
      });
    }

    // Attempt OneSignal init safely without blocking anything
    if (typeof window !== 'undefined' && !isOneSignalInitAttempted && onesignalAppId) {
      isOneSignalInitAttempted = true;
      try {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async (OneSignal: any) => {
          try {
            await OneSignal.init({
              appId: onesignalAppId,
              allowLocalhostAsSecureOrigin: true,
              notifyButton: { enable: false },
            });

            // Listen for subscription changes
            OneSignal.User?.PushSubscription?.addEventListener('change', async (event: any) => {
              const newId = event.current?.id;
              const optedIn = event.current?.optedIn;
              if (optedIn && newId) {
                localStorage.setItem('onesignal_sub_id', newId);
                if (mounted) setIsSubscribed(true);
                await pushApi.subscribe(newId);
              } else if (!optedIn) {
                if (mounted) setIsSubscribed(false);
                await pushApi.unsubscribe();
              }
            });
          } catch (initErr) {
            console.warn('OneSignal initialization note:', initErr);
          }
        });
      } catch (err) {
        console.warn('OneSignal deferred push note:', err);
      }
    }

    return () => {
      mounted = false;
    };
  }, [onesignalAppId, checkStatus]);

  const enableNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Check browser support
      if (typeof window === 'undefined' || !('Notification' in window)) {
        toast.error('This browser does not support desktop push notifications.');
        setLoading(false);
        return;
      }

      // 2. Request native browser notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission was blocked in browser settings. Please allow notifications.');
        setLoading(false);
        return;
      }

      // 3. Try to get subscription ID from OneSignal with a 1.5-second timeout
      let subscriptionId: string | null = null;

      try {
        const oneSignalPromise = new Promise<string>((resolve) => {
          if (window.OneSignal?.User?.PushSubscription?.optIn) {
            window.OneSignal.User.PushSubscription.optIn()
              .then(() => {
                const id = window.OneSignal.User.PushSubscription.id;
                if (id) resolve(id);
              })
              .catch(() => {});
          }

          window.OneSignalDeferred = window.OneSignalDeferred || [];
          window.OneSignalDeferred.push(async (OneSignal: any) => {
            try {
              await OneSignal.User?.PushSubscription?.optIn();
              const id = OneSignal.User?.PushSubscription?.id;
              if (id) resolve(id);
            } catch {}
          });
        });

        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
        subscriptionId = await Promise.race([oneSignalPromise, timeoutPromise]);
      } catch {
        subscriptionId = null;
      }

      // Fallback ID if OneSignal is blocked by browser shields/adblockers
      const finalSubId = subscriptionId || localStorage.getItem('onesignal_sub_id') || `browser_${Math.random().toString(36).substring(2, 12)}`;
      localStorage.setItem('onesignal_sub_id', finalSubId);

      // 4. Register subscription with Django backend
      await pushApi.subscribe(finalSubId);
      setIsSubscribed(true);
      toast.success('Browser push notifications enabled successfully!');

      // Show immediate native desktop confirmation toast
      try {
        new Notification('Notification System Alert', {
          body: 'Browser push notifications successfully enabled for your account!',
          icon: '/favicon.svg',
        });
      } catch {}

    } catch (err: any) {
      toast.error(err.message || 'Failed to enable notifications.');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disableNotifications = async () => {
    setLoading(true);
    try {
      try {
        if (window.OneSignal?.User?.PushSubscription?.optOut) {
          await window.OneSignal.User.PushSubscription.optOut();
        }
      } catch {}

      await pushApi.unsubscribe();
      setIsSubscribed(false);
      localStorage.removeItem('onesignal_sub_id');
      toast.success('Push notifications disabled.');
    } catch {
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
