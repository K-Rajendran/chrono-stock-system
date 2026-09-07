'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services';
import { useAuthStore } from '@/lib/store/authStore';
import { Button, Input } from '@/components/ui';
import { extractApiError } from '@/lib/apiClient';
import { cn } from '@/utils';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const schema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number').optional().or(z.literal('')),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v, 'You must accept the terms'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-all duration-300',
              i < score ? colors[score - 1] : 'bg-brand-black-border')}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-brand-gray">{labels[score - 1] ?? 'Enter password'}</span>
        <div className="flex gap-3">
          {checks.map(({ label, pass }) => (
            <span key={label} className={cn('text-xs flex items-center gap-1', pass ? 'text-green-400' : 'text-brand-gray')}>
              <CheckCircle2 className="w-3 h-3" /> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [watchPass, setWatchPass] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch('password', '');

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authService.register({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || '',
        password: data.password,
      });
      setAuth(
        { userId: res.userId, email: res.email, fullName: res.fullName, role: res.role as any },
        res.accessToken,
        res.refreshToken
      );
      toast.success('Account created! Welcome to SOUL x TIME.');
      router.push('/');
    } catch (err) {
      setError('root', { message: extractApiError(err) });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-black-soft">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="mb-10">
          <Link href="/" className="font-serif text-2xl tracking-[0.15em] text-brand-white block mb-8">
            SOUL<span className="gold-text mx-1">×</span>TIME
          </Link>
          <h1 className="font-serif text-3xl text-brand-white mb-2">Create your account</h1>
          <p className="text-brand-gray text-sm">Join the SOUL x TIME collection experience</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name"
            placeholder="Your name"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Phone Number (optional)"
            type="tel"
            placeholder="+91 98765 43210"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <div className="space-y-2">
            <div className="relative">
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="Create a strong password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password', {
                  onChange: (e) => setWatchPass(e.target.value),
                })}
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
            <PasswordStrength password={watchPass} />
          </div>

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded border-brand-black-border accent-brand-gold"
              {...register('terms')}
            />
            <span className="text-sm text-brand-gray leading-relaxed">
              I agree to the{' '}
              <span className="text-brand-gold">Terms of Service</span> and{' '}
              <span className="text-brand-gold">Privacy Policy</span>
            </span>
          </label>
          {errors.terms && <p className="text-xs text-red-400">{errors.terms.message}</p>}

          {errors.root && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errors.root.message}
            </div>
          )}

          <Button type="submit" variant="gold" size="lg" fullWidth loading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-brand-gray text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-gold hover:text-brand-gold-light transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
