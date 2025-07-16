import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { adminApi } from '@/services/adminApi';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mfaCode: z.string().length(6).optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const response = await adminApi.post('/admin/auth/login', data);
      
      if (response.data.status === 'mfa_required') {
        setRequiresMFA(true);
        showToast.warning('Please enter your 6-digit MFA code');
      } else {
        // Store admin auth data
        const { accessToken, admin } = response.data.data;
        localStorage.setItem('adminToken', accessToken);
        localStorage.setItem('adminUser', JSON.stringify(admin));

        showToast.success('Welcome to the admin panel');

        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Stable Ride</h1>
          <p className="mt-2 text-sm text-muted-foreground">Admin Portal</p>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-foreground">
          Sign in to your admin account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card dark:bg-zinc-900 py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                disabled={requiresMFA}
                error={errors.email?.message}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                disabled={requiresMFA}
                error={errors.password?.message}
              />
            </div>

            {requiresMFA && (
              <div>
                <label htmlFor="mfaCode" className="block text-sm font-medium text-foreground">
                  MFA Code
                </label>
                <Input
                  id="mfaCode"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                  {...register('mfaCode')}
                  className="text-center text-lg tracking-widest"
                  error={errors.mfaCode?.message}
                />
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  requiresMFA ? 'Verify MFA' : 'Sign in'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card dark:bg-zinc-900 text-muted-foreground">Security Notice</span>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>This is a secure admin area. All actions are logged.</p>
              <p className="mt-1">Unauthorized access attempts will be reported.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}