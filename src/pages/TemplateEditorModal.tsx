import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { templatesApi } from '../api/templates';
import type { NotificationTemplate, ChannelType } from '../types';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import { formatErrorMessage } from '../utils/errors';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerId: string;
  triggerName: string;
  channel: ChannelType;
  existingTemplate?: NotificationTemplate | null;
  onSuccess: () => void;
}

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().optional(),
  title: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  is_enabled: z.boolean(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  triggerId,
  triggerName,
  channel,
  existingTemplate,
  onSuccess,
}) => {
  const [testing, setTesting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const availableVariables = [
    '{{user.first_name}}',
    '{{user.last_name}}',
    '{{user.email}}',
    '{{user.phone}}',
    '{{event.time}}',
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      subject: '',
      title: '',
      body: '',
      is_enabled: true,
    },
  });

  const bodyValue = watch('body');

  useEffect(() => {
    if (existingTemplate) {
      reset({
        name: existingTemplate.name,
        subject: existingTemplate.subject || '',
        title: existingTemplate.title || '',
        body: existingTemplate.body || '',
        is_enabled: existingTemplate.is_enabled,
      });
    } else {
      reset({
        name: `${triggerName} - ${channel}`,
        subject: channel === 'EMAIL' ? `Notification: ${triggerName}` : '',
        title: channel === 'WEB_PUSH' ? triggerName : '',
        body: `Hello {{user.first_name}}, ${triggerName} event occurred at {{event.time}}.`,
        is_enabled: true,
      });
    }
  }, [existingTemplate, triggerName, channel, reset]);

  const insertVariable = (varText: string) => {
    setValue('body', `${bodyValue} ${varText}`);
  };

  const onSubmit = async (data: TemplateFormData) => {
    setServerError(null);

    // Validate channel constraints
    if (channel === 'EMAIL' && !data.subject) {
      setServerError('Subject line is required for Email templates.');
      return;
    }
    if (channel === 'WEB_PUSH' && !data.title) {
      setServerError('Notification title is required for Web Push templates.');
      return;
    }

    try {
      if (existingTemplate) {
        await templatesApi.update(existingTemplate.id, data);
        toast.success(`${channel} template updated successfully.`);
      } else {
        await templatesApi.create({
          ...data,
          trigger: triggerId,
          channel,
        });
        toast.success(`${channel} template created successfully.`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setServerError(formatErrorMessage(err, 'Failed to save template. Please check all fields.'));
    }
  };

  const handleTestSend = async () => {
    if (!existingTemplate) {
      toast.error('Please save the template first before performing a test send.');
      return;
    }

    setTesting(true);
    try {
      const res = await templatesApi.testSend(existingTemplate.id);
      toast.success(`Test message dispatched! Notification ID: ${res.notification_id.substring(0, 8)}...`);
    } catch (err: any) {
      toast.error(formatErrorMessage(err, 'Test send failed. Please verify provider credentials.'));
    } finally {
      setTesting(false);
    }
  };

  const channelNames: Record<ChannelType, string> = {
    WHATSAPP: 'Meta WhatsApp',
    EMAIL: 'Resend Email',
    WEB_PUSH: 'OneSignal Web Push',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${existingTemplate ? 'Edit' : 'Configure'} ${channelNames[channel]} Template (${triggerName})`}
      maxWidth="lg"
    >
      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Template Name"
          placeholder="e.g. User Login Email"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Email specific: Subject */}
        {channel === 'EMAIL' && (
          <Input
            label="Email Subject"
            placeholder="e.g. Account Security Alert"
            error={errors.subject?.message}
            {...register('subject')}
          />
        )}

        {/* Web Push specific: Title */}
        {channel === 'WEB_PUSH' && (
          <Input
            label="Push Notification Title"
            placeholder="e.g. New Login Detected"
            error={errors.title?.message}
            {...register('title')}
          />
        )}

        {/* Message / Body */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            {channel === 'EMAIL' ? 'HTML / Text Body' : 'Message Body'}
          </label>
          <textarea
            rows={4}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="Enter template message..."
            {...register('body')}
          />
          {errors.body && <p className="mt-1 text-xs text-red-600 font-medium">{errors.body.message}</p>}
        </div>

        {/* Variables chips */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <p className="text-xs font-semibold text-slate-700 mb-1.5">Available Variables (Click to insert):</p>
          <div className="flex flex-wrap gap-1.5">
            {availableVariables.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="px-2 py-0.5 text-xs font-mono bg-white border border-slate-300 rounded text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Enabled checkbox */}
        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="is_enabled"
            className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            {...register('is_enabled')}
          />
          <label htmlFor="is_enabled" className="text-sm font-medium text-slate-800">
            Channel Enabled (Notifications will be dispatched when event triggers)
          </label>
        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
          <div>
            {existingTemplate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestSend}
                isLoading={testing}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Test Send
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Save Template
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
