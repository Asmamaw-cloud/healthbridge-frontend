'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or Phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const isEmail = data.emailOrPhone.includes('@');
      const payload = isEmail ? { email: data.emailOrPhone, password: data.password } : { phone: data.emailOrPhone, password: data.password };
      
      const response = await api.post('/auth/login', payload);
      const { user, accessToken: token } = response.data;
      
      login(user, token);
      router.push(`/${user.role}/dashboard`);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: unknown } } })
        ?.response?.data;
      const msg = data?.message;
      const text =
        typeof msg === 'string'
          ? msg
          : Array.isArray(msg)
            ? msg.join(', ')
            : 'Login failed';
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Sign in to HealthBridge</h2>
        
        {error && <div className="p-3 text-sm text-red-500 bg-red-100 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email or Phone Number</label>
            <input
              type="text"
              {...register('emailOrPhone')}
              className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.emailOrPhone && (
              <p className="mt-1 text-xs text-red-500">{errors.emailOrPhone.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="text-sm text-center">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
