import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { ErrorState } from '../components/ui/ErrorState';
import { Sliders, Mail, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: notificationsApi.getStats,
    refetchInterval: 10000,
  });

  if (isLoading) return <Loading message="Loading real database metrics..." />;
  if (error || !stats) {
    return <ErrorState message="Failed to fetch dashboard metrics from PostgreSQL." onRetry={refetch} />;
  }

  const statCards = [
    {
      title: 'Total Triggers',
      value: stats.total_triggers,
      desc: 'Active system events',
      icon: Sliders,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Configured Templates',
      value: stats.configured_templates,
      desc: 'Active channel templates',
      icon: Mail,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Failed Notifications',
      value: stats.failed_notifications,
      desc: 'Permanent provider delivery failures',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Real-time notification engine metrics from PostgreSQL</p>
      </div>

      {/* Real PostgreSQL Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.title}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{card.desc}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bg} ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Notifications Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Notifications</h3>
            <p className="text-xs text-slate-500 mt-0.5">Last 5 notification dispatch records</p>
          </div>
          <Link
            to="/admin/logs"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View all logs →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Time</th>
                <th className="py-3 px-6">User</th>
                <th className="py-3 px-6">Trigger</th>
                <th className="py-3 px-6">Channel</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {stats.recent_notifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No notification events recorded yet.
                  </td>
                </tr>
              ) : (
                stats.recent_notifications.map((notif) => {
                  const statusVariants: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
                    SENT: 'success',
                    FAILED: 'danger',
                    PROCESSING: 'warning',
                    PENDING: 'neutral',
                  };

                  return (
                    <tr key={notif.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-slate-500">
                        {new Date(notif.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        {notif.user_name || notif.user_email}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-800">
                        {notif.trigger_name}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-semibold text-slate-600">
                          {notif.channel}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge variant={statusVariants[notif.status] || 'neutral'} size="sm">
                          {notif.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
