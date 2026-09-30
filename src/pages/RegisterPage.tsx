import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { formatErrorMessage } from '../utils/errors';

const registerSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    phone: z.string().min(5, 'Valid phone number is required (for WhatsApp notifications)'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const user = await registerAuth(data);
      toast.success('Account created successfully!');
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    } catch (err: any) {
      setServerError(formatErrorMessage(err, 'Registration failed. Please check your information and try again.'));
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-6 text-center">
        Create a new account
      </h3>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            placeholder="John"
            error={errors.first_name?.message}
            {...register('first_name')}
          />
          <Input
            label="Last name"
            placeholder="Doe"
            error={errors.last_name?.message}
            {...register('last_name')}
          />
        </div>

        <Input
          label="Email address"
          type="email"
          placeholder="john.doe@company.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Phone number"
          type="tel"
          placeholder="+1234567890 (for WhatsApp)"
          helperText="Include country code without spaces"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
