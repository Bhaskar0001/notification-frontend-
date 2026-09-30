import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { apiClient } from '../api/client';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Bell, User as UserIcon, Mail, Phone, Send, History } from 'lucide-react';
import toast from 'react-hot-toast';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    isSubscribed,
    loading: pushLoading,
    enableNotifications,
    disableNotifications,
  } = usePushNotifications();

  const [testPushLoading, setTestPushLoading] = useState(false);

  // Poll user's notification history from backend
  const { data: userNotifications = [], refetch } = useQuery({
    queryKey: ['user-notifications'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/users/me/notifications/');
      return res.data;
    },
    refetchInterval: 5000,
  });

  const handleTestInAppPush = async () => {
    setTestPushLoading(true);
    try {
      // 1. Show immediate In-App rich toast
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-blue-600 p-4`}
        >
          <div className="flex-1 w-0">
            <div className="flex items-start">
              <div className="shrink-0 pt-0.5 text-blue-600">
                <Bell className="h-6 w-6" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  In-App Notification: Login Alert
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Hello {user?.first_name}, a successful login was recorded for your account at {new Date().toLocaleTimeString()}.
                </p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 5000 });

      // 2. Trigger native desktop notification if permission is granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Notification System Alert: ${user?.first_name}`, {
          body: `Real Push Notification delivered to ${user?.email} at ${new Date().toLocaleTimeString()}!`,
          icon: '/favicon.svg',
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(`Notification System Alert: ${user?.first_name}`, {
            body: `Real Push Notification delivered to ${user?.email}!`,
          });
        }
      }

      refetch();
    } catch (err: any) {
      toast.error('Failed to trigger in-app notification: ' + err.message);
    } finally {
      setTestPushLoading(false);
    }
  };

  const statusVariants: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
    SENT: 'success',
    FAILED: 'danger',
    PROCESSING: 'warning',
    PENDING: 'neutral',
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Welcome, {user?.first_name}!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time notification profile and device delivery channels.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleTestInAppPush}
          isLoading={testPushLoading}
        >
          <Send className="w-3.5 h-3.5 mr-1.5" />
          Test In-App & Desktop Push
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Contact Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center">
            <UserIcon className="w-4 h-4 mr-2 text-slate-400" />
            Contact Information
          </h3>

          <div className="space-y-3.5">
            <div>
              <span className="text-xs text-slate-400 block">Full Name</span>
              <span className="text-sm font-medium text-slate-900">
                {user?.first_name} {user?.last_name}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Email Address (for Email notifications)</span>
              <span className="text-sm font-medium text-slate-900 flex items-center mt-0.5">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                {user?.email}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Phone Number (for WhatsApp notifications)</span>
              <span className="text-sm font-medium text-slate-900 flex items-center mt-0.5">
                <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                {user?.phone || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Account Role</span>
              <Badge variant={user?.role === 'ADMIN' ? 'info' : 'neutral'} size="sm">
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Web Push Subscription Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4 flex items-center">
              <Bell className="w-4 h-4 mr-2 text-slate-400" />
              Browser Push Notifications
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 font-medium">Delivery Status:</span>
                {isSubscribed ? (
                  <Badge variant="success" size="md">
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="md">
                    Not enabled
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                When enabled, your current browser receives automated Web Push notifications triggered by events configured by system administrators.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6 space-y-2">
            {isSubscribed ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-slate-600 hover:text-red-600"
                onClick={disableNotifications}
                isLoading={pushLoading}
              >
                Disable browser notifications
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={enableNotifications}
                isLoading={pushLoading}
              >
                <Bell className="w-4 h-4 mr-2" />
                Enable browser notifications
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* In-App Notifications Feed */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <History className="w-4 h-4 mr-2 text-slate-400" />
              My Notification Activity Feed
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Notifications triggered by your events (Login, Logout)
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {userNotifications.length} records
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {userNotifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No notifications dispatched to your account yet.
            </div>
          ) : (
            userNotifications.map((notif: any) => (
              <div key={notif.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">
                      {notif.trigger_name} Trigger
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-slate-600 uppercase font-medium">
                      {notif.channel}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    {new Date(notif.created_at).toLocaleString()} (Provider: {notif.provider})
                  </div>
                </div>

                <Badge variant={statusVariants[notif.status] || 'neutral'} size="sm">
                  {notif.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
