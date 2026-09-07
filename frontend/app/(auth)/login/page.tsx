'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services';
import { useAuthStore } from '@/lib/store/authStore';
import { Button, Input } from '@/components/ui';
import { extractApiError } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authService.login(data);
      setAuth(
        { userId: res.userId, email: res.email, fullName: res.fullName, role: res.role as any },
        res.accessToken,
        res.refreshToken
      );
      toast.success(`Welcome back, ${res.fullName.split(' ')[0]}!`);
      router.push(res.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      const msg = extractApiError(err);
      setError('root', { message: msg });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, #1a1200 0%, #0A0A0A 70%)' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-48 h-48 rounded-full border border-brand-gold/10 mx-auto flex items-center justify-center mb-8 relative">
              <div className="absolute inset-3 rounded-full border border-brand-gold/15" />
              <div className="absolute inset-6 rounded-full border border-brand-gold/20" />
              <span className="font-serif text-3xl tracking-widest text-brand-white">ST</span>
            </div>
            <p className="font-display text-3xl text-brand-white/70 italic">Where Time</p>
            <p className="font-display text-3xl gold-text italic">Finds Its Soul</p>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-brand-black-soft">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <Link href="/" className="font-serif text-2xl tracking-[0.15em] text-brand-white block mb-8">
              SOUL<span className="gold-text mx-1">×</span>TIME
            </Link>
            <h1 className="font-serif text-3xl text-brand-white mb-2">Welcome back</h1>
            <p className="text-brand-gray text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-[34px] text-brand-gray hover:text-brand-white transition-colors"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errors.root && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {errors.root.message}
              </div>
            )}

            <Button type="submit" variant="gold" size="lg" fullWidth loading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-brand-gray text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-brand-gold hover:text-brand-gold-light transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
