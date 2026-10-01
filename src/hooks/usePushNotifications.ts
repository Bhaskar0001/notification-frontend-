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

  const onesignalAppId =
    import.meta.env.VITE_ONESIGNAL_APP_ID ||
    '756275c6-1c4f-4ed3-82e2-fad9a79f0b06';

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

    // If native browser permission is already granted,
    // verify the existing OneSignal subscription.
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      checkStatus().catch(() => {});
    }

    // Attempt OneSignal initialization
    if (
      typeof window !== 'undefined' &&
      !isOneSignalInitAttempted &&
      onesignalAppId
    ) {
      isOneSignalInitAttempted = true;

      try {
        window.OneSignalDeferred = window.OneSignalDeferred || [];

        window.OneSignalDeferred.push(async (OneSignal: any) => {
          try {
            await OneSignal.init({
              appId: onesignalAppId,
              notifyButton: {
                enable: false,
              },
            });

            // Listen for subscription changes
            OneSignal.User?.PushSubscription?.addEventListener(
              'change',
              async (event: any) => {
                const newId = event.current?.id;
                const optedIn = event.current?.optedIn;

                if (optedIn && newId) {
                  localStorage.setItem('onesignal_sub_id', newId);

                  if (mounted) {
                    setIsSubscribed(true);
                  }

                  try {
                    await pushApi.subscribe(newId);
                  } catch (err) {
                    console.error(
                      'Failed to sync OneSignal subscription:',
                      err
                    );
                  }
                } else if (!optedIn) {
                  if (mounted) {
                    setIsSubscribed(false);
                  }

                  try {
                    await pushApi.unsubscribe();
                  } catch (err) {
                    console.error(
                      'Failed to unsubscribe from push notifications:',
                      err
                    );
                  }
                }
              }
            );

            // Sync an already-existing OneSignal subscription.
            const existingSubscriptionId =
              OneSignal.User?.PushSubscription?.id;

            const existingOptedIn =
              OneSignal.User?.PushSubscription?.optedIn;

            if (existingOptedIn && existingSubscriptionId) {
              localStorage.setItem(
                'onesignal_sub_id',
                existingSubscriptionId
              );

              try {
                await pushApi.subscribe(existingSubscriptionId);

                if (mounted) {
                  setIsSubscribed(true);
                }
              } catch (err) {
                console.error(
                  'Failed to sync existing OneSignal subscription:',
                  err
                );
              }
            }
          } catch (initErr) {
            console.warn(
              'OneSignal initialization note:',
              initErr
            );
          }
        });
      } catch (err) {
        console.warn(
          'OneSignal deferred push note:',
          err
        );
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
      if (
        typeof window === 'undefined' ||
        !('Notification' in window)
      ) {
        const message =
          'This browser does not support desktop push notifications.';

        toast.error(message);
        setError(message);
        setLoading(false);
        return;
      }

      // 2. Request native browser notification permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        const message =
          'Notification permission was blocked in browser settings. Please allow notifications.';

        toast.error(message);
        setError(message);
        setLoading(false);
        return;
      }

      // 3. Get the REAL OneSignal subscription ID
      let subscriptionId: string | null = null;

      try {
        const oneSignalPromise = new Promise<string>(
          (resolve, reject) => {
            let resolved = false;

            const resolveOnce = (id: string) => {
              if (!resolved && id) {
                resolved = true;
                resolve(id);
              }
            };

            const rejectOnce = (err: Error) => {
              if (!resolved) {
                resolved = true;
                reject(err);
              }
            };

            // If OneSignal is already available
            if (
              window.OneSignal?.User?.PushSubscription
            ) {
              window.OneSignal.User.PushSubscription
                .optIn()
                .then(() => {
                  const id =
                    window.OneSignal.User.PushSubscription.id;

                  if (id) {
                    resolveOnce(id);
                  }
                })
                .catch(rejectOnce);
            }

            // If OneSignal is still being initialized
            window.OneSignalDeferred =
              window.OneSignalDeferred || [];

            window.OneSignalDeferred.push(
              async (OneSignal: any) => {
                try {
                  await OneSignal.User?.PushSubscription?.optIn();

                  const id =
                    OneSignal.User?.PushSubscription?.id;

                  if (id) {
                    resolveOnce(id);
                  }
                } catch (err) {
                  rejectOnce(
                    err instanceof Error
                      ? err
                      : new Error(
                          'Unable to create OneSignal subscription.'
                        )
                  );
                }
              }
            );

            // Prevent this promise from hanging forever
            setTimeout(() => {
              if (!resolved) {
                rejectOnce(
                  new Error(
                    'OneSignal subscription was not created. Please try again.'
                  )
                );
              }
            }, 5000);
          }
        );

        subscriptionId = await oneSignalPromise;
      } catch (err) {
        subscriptionId = null;
      }

      // IMPORTANT:
      // Never generate a fake browser_* ID.
      // Only send a real OneSignal subscription ID to Django.
      if (!subscriptionId) {
        const message =
          'OneSignal could not create a browser subscription. Please refresh the page and try again.';

        toast.error(message);
        setError(message);
        setLoading(false);
        return;
      }

      // Store the REAL OneSignal subscription ID locally
      localStorage.setItem(
        'onesignal_sub_id',
        subscriptionId
      );

      // 4. Register REAL OneSignal subscription with Django
      await pushApi.subscribe(subscriptionId);

      setIsSubscribed(true);

      toast.success(
        'Browser push notifications enabled successfully!'
      );

      // Show immediate native desktop confirmation
      try {
        new Notification('Notification System Alert', {
          body:
            'Browser push notifications successfully enabled for your account!',
          icon: '/favicon.svg',
        });
      } catch {}
    } catch (err: any) {
      const message =
        err?.message ||
        'Failed to enable notifications.';

      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const disableNotifications = async () => {
    setLoading(true);

    try {
      try {
        if (
          window.OneSignal?.User?.PushSubscription?.optOut
        ) {
          await window.OneSignal.User.PushSubscription.optOut();
        }
      } catch {}

      await pushApi.unsubscribe();

      setIsSubscribed(false);

      localStorage.removeItem('onesignal_sub_id');

      toast.success(
        'Push notifications disabled.'
      );
    } catch {
      toast.error(
        'Failed to disable notifications.'
      );
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
