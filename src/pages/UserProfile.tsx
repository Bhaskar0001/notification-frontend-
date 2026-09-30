import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { formatErrorMessage } from '../utils/errors';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().min(5, 'Valid phone number is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const UserProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setServerError(null);
    try {
      await updateUser(data);
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      setServerError(formatErrorMessage(err, 'Failed to update profile. Please verify your details.'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">User Profile</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your contact credentials for WhatsApp and Email notifications.
        </p>

        {serverError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Email is read-only per requirements */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed font-medium"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Email address cannot be changed once registered.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="First name"
              error={errors.first_name?.message}
              {...register('first_name')}
            />
            <Input
              label="Last Name"
              placeholder="Last name"
              error={errors.last_name?.message}
              {...register('last_name')}
            />
          </div>

          <Input
            label="Phone Number (for WhatsApp)"
            placeholder="+1234567890"
            helperText="Include country code without spaces (e.g. +919876543210)"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!isDirty}
            >
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
