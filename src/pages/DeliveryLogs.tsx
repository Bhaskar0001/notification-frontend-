import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Eye, RefreshCw } from 'lucide-react';

export const DeliveryLogs: React.FC = () => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');

  const { data: logs = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-logs', statusFilter, channelFilter],
    queryFn: () => notificationsApi.list({ status: statusFilter || undefined, channel: channelFilter || undefined }),
    refetchInterval: 10000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-log-detail', selectedLogId],
    queryFn: () => (selectedLogId ? notificationsApi.get(selectedLogId) : null),
    enabled: !!selectedLogId,
  });

  const statusVariants: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
    SENT: 'success',
    FAILED: 'danger',
    PROCESSING: 'warning',
    PENDING: 'neutral',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Delivery Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit trail of all real notifications dispatched across WhatsApp, Resend, and OneSignal
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isFetching}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="SENT">SENT</option>
            <option value="FAILED">FAILED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Channel:</label>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800"
          >
            <option value="">All Channels</option>
            <option value="WHATSAPP">WHATSAPP</option>
            <option value="EMAIL">EMAIL</option>
            <option value="WEB_PUSH">WEB PUSH</option>
          </select>
        </div>
      </div>

      {/* Primary Logs Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {isLoading ? (
          <Loading message="Loading delivery logs from PostgreSQL..." />
        ) : error ? (
          <ErrorState message="Could not load notification logs." onRetry={refetch} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Time</th>
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Trigger</th>
                  <th className="py-3 px-6">Channel</th>
                  <th className="py-3 px-6">Provider</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No delivery log records found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      onClick={() => setSelectedLogId(log.id)}
                    >
                      <td className="py-3.5 px-6 font-mono text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        {log.user_name || log.user_email}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-800">
                        {log.trigger_name}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-semibold text-slate-700">{log.channel}</span>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                        {log.provider}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge variant={statusVariants[log.status] || 'neutral'} size="sm">
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogId(log.id);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notification Details Modal (Part 35) */}
      <Modal
        isOpen={!!selectedLogId}
        onClose={() => setSelectedLogId(null)}
        title="Notification Delivery Details"
        maxWidth="xl"
      >
        {detailLoading || !detail ? (
          <Loading message="Fetching full log details..." />
        ) : (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-md">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Event ID</span>
                <span className="font-mono text-slate-900">{detail.event_id}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Event Key</span>
                <span className="font-mono text-slate-900">{detail.event_key}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Recipient</span>
                <span className="text-slate-900 font-medium">
                  {detail.user?.first_name} {detail.user?.last_name} ({detail.user?.email})
                </span>
                <span className="text-slate-500 block text-[11px]">{detail.user?.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Trigger</span>
                <span className="text-slate-900 font-medium">{detail.trigger?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Channel / Provider</span>
                <span className="text-slate-900 font-semibold">{detail.channel}</span>
                <span className="text-slate-500 font-mono ml-1.5">({detail.provider})</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Delivery Status</span>
                <Badge variant={statusVariants[detail.status] || 'neutral'} size="sm">
                  {detail.status}
                </Badge>
                <span className="text-slate-500 ml-2 font-mono">Attempts: {detail.attempt_count}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Provider Message ID</span>
                <span className="font-mono text-slate-900">{detail.provider_message_id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Created / Sent</span>
                <span className="text-slate-700 block">Created: {new Date(detail.created_at).toLocaleString()}</span>
                {detail.sent_at && (
                  <span className="text-emerald-700 block font-medium">
                    Sent: {new Date(detail.sent_at).toLocaleString()}
                  </span>
                )}
                {detail.failed_at && (
                  <span className="text-red-700 block font-medium">
                    Failed: {new Date(detail.failed_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Error Message if present */}
            {detail.error_message && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                <span className="font-semibold block mb-0.5">Error Message:</span>
                <p className="font-mono text-[11px]">{detail.error_message}</p>
              </div>
            )}

            {/* Rendered Payload */}
            <div className="border border-slate-200 rounded-md p-3">
              <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-1">
                Rendered Notification Payload
              </span>
              {detail.rendered_payload?.subject && (
                <div className="mb-1.5">
                  <span className="font-semibold text-slate-700">Subject: </span>
                  <span className="text-slate-900">{detail.rendered_payload.subject}</span>
                </div>
              )}
              {detail.rendered_payload?.title && (
                <div className="mb-1.5">
                  <span className="font-semibold text-slate-700">Title: </span>
                  <span className="text-slate-900">{detail.rendered_payload.title}</span>
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Body:</span>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] whitespace-pre-wrap">
                  {detail.rendered_payload?.body}
                </div>
              </div>
            </div>

            {/* Delivery Attempts Table */}
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-1">
                Delivery Attempts ({detail.delivery_attempts?.length || 0})
              </span>
              {detail.delivery_attempts?.length === 0 ? (
                <p className="text-slate-400 italic">No delivery attempts recorded yet.</p>
              ) : (
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Response / Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail.delivery_attempts.map((attempt) => (
                        <tr key={attempt.id}>
                          <td className="py-2 px-3 font-bold">{attempt.attempt_number}</td>
                          <td className="py-2 px-3">
                            <Badge variant={attempt.status === 'SENT' ? 'success' : 'danger'} size="sm">
                              {attempt.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono">
                            {new Date(attempt.created_at).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-600">
                            {attempt.error_message || JSON.stringify(attempt.provider_response)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedLogId(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
