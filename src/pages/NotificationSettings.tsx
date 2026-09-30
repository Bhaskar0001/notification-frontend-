import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { triggersApi } from '../api/triggers';
import { templatesApi } from '../api/templates';
import type { Trigger, ChannelType, ChannelInfo } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { TemplateEditorModal } from './TemplateEditorModal';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatErrorMessage } from '../utils/errors';

export const NotificationSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTriggerName, setNewTriggerName] = useState('');
  const [newTriggerKey, setNewTriggerKey] = useState('');
  const [newTriggerDesc, setNewTriggerDesc] = useState('');

  // Active channel editing state
  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    triggerId: string;
    triggerName: string;
    channel: ChannelType;
    templateId: string | null;
  }>({
    isOpen: false,
    triggerId: '',
    triggerName: '',
    channel: 'EMAIL',
    templateId: null,
  });

  const { data: triggers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-triggers'],
    queryFn: triggersApi.list,
  });

  const [testingId, setTestingId] = useState<string | null>(null);

  const toggleMutation = useMutation({
    mutationFn: templatesApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-triggers'] });
      toast.success('Channel status updated.');
    },
    onError: (err: any) => {
      toast.error(formatErrorMessage(err, 'Failed to update channel status.'));
    },
  });

  const handleCellTestSend = async (templateId: string) => {
    setTestingId(templateId);
    try {
      const res = await templatesApi.testSend(templateId);
      toast.success(`Test message sent! Notification ID: ${res.notification_id.substring(0, 8)}...`);
    } catch (err: any) {
      toast.error(formatErrorMessage(err, 'Test send failed. Please verify provider credentials.'));
    } finally {
      setTestingId(null);
    }
  };

  const handleCreateTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTriggerName || !newTriggerKey) {
      toast.error('Trigger name and event key are required.');
      return;
    }

    try {
      await triggersApi.create({
        name: newTriggerName,
        event_key: newTriggerKey,
        description: newTriggerDesc,
        is_active: true,
      });
      toast.success('Trigger created successfully.');
      setIsCreateModalOpen(false);
      setNewTriggerName('');
      setNewTriggerKey('');
      setNewTriggerDesc('');
      refetch();
    } catch (err: any) {
      toast.error(formatErrorMessage(err, 'Failed to create trigger. Please verify input fields.'));
    }
  };

  const openEditor = (trigger: Trigger, channel: ChannelType, channelInfo: ChannelInfo) => {
    setEditorState({
      isOpen: true,
      triggerId: trigger.id,
      triggerName: trigger.name,
      channel,
      templateId: channelInfo.template_id,
    });
  };

  if (isLoading) return <Loading message="Loading notification settings..." />;
  if (error) return <ErrorState message="Could not fetch notification settings." onRetry={refetch} />;

  const renderChannelCell = (trigger: Trigger, channel: ChannelType, info: ChannelInfo) => {
    if (!info.configured) {
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="neutral" size="sm">
            Not configured
          </Badge>
          <button
            onClick={() => openEditor(trigger, channel, info)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline inline-flex items-center"
          >
            Configure
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <Badge variant={info.enabled ? 'success' : 'neutral'} size="sm">
          {info.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
        <button
          onClick={() => openEditor(trigger, channel, info)}
          className="text-xs text-slate-600 hover:text-slate-900 font-medium hover:underline"
          title="Edit template"
        >
          Edit
        </button>
        {info.template_id && (
          <>
            <button
              onClick={() => toggleMutation.mutate(info.template_id!)}
              className={`text-xs px-1.5 py-0.5 rounded font-mono transition-colors ${
                info.enabled
                  ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              title={info.enabled ? 'Disable channel' : 'Enable channel'}
            >
              {info.enabled ? 'Turn Off' : 'Turn On'}
            </button>
            <button
              onClick={() => handleCellTestSend(info.template_id!)}
              disabled={testingId === info.template_id}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline disabled:opacity-50"
              title="Test send notification immediately"
            >
              {testingId === info.template_id ? 'Sending...' : 'Test'}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notification Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure automated event triggers and channel templates
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Trigger
        </Button>
      </div>

      {/* Primary Table (Part 33) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Trigger</th>
                <th className="py-3 px-6">WhatsApp</th>
                <th className="py-3 px-6">Email</th>
                <th className="py-3 px-6">Web Push</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {triggers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No triggers found in database.
                  </td>
                </tr>
              ) : (
                triggers.map((trigger) => (
                  <tr key={trigger.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{trigger.name}</div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {trigger.event_key}
                      </div>
                      {trigger.description && (
                        <div className="text-[11px] text-slate-500 mt-1 max-w-xs line-clamp-1">
                          {trigger.description}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      {renderChannelCell(trigger, 'WHATSAPP', trigger.whatsapp)}
                    </td>

                    <td className="py-4 px-6">
                      {renderChannelCell(trigger, 'EMAIL', trigger.email)}
                    </td>

                    <td className="py-4 px-6">
                      {renderChannelCell(trigger, 'WEB_PUSH', trigger.web_push)}
                    </td>

                    <td className="py-4 px-6">
                      <Badge variant={trigger.is_active ? 'success' : 'neutral'} size="sm">
                        {trigger.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Trigger Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Trigger"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTrigger} className="space-y-4">
          <Input
            label="Trigger Name"
            placeholder="e.g. Password Reset"
            value={newTriggerName}
            onChange={(e) => setNewTriggerName(e.target.value)}
            required
          />

          <Input
            label="Event Key"
            placeholder="e.g. user.password_reset"
            helperText="Internal event key used by emit_event()"
            value={newTriggerKey}
            onChange={(e) => setNewTriggerKey(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of when this trigger fires..."
              value={newTriggerDesc}
              onChange={(e) => setNewTriggerDesc(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create Trigger
            </Button>
          </div>
        </form>
      </Modal>

      {/* Template Editor Modal */}
      {editorState.isOpen && (
        <TemplateEditorModal
          isOpen={editorState.isOpen}
          onClose={() => setEditorState((prev) => ({ ...prev, isOpen: false }))}
          triggerId={editorState.triggerId}
          triggerName={editorState.triggerName}
          channel={editorState.channel}
          existingTemplate={
            editorState.templateId
              ? ({
                  id: editorState.templateId,
                  trigger: editorState.triggerId,
                  channel: editorState.channel,
                } as any)
              : null
          }
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};
