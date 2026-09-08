'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authService } from '@/services';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/Button';
import { extractApiError } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type F = z.infer<typeof schema>;

const FIELD: React.CSSProperties = {
  backgroundColor: '#141414', color: '#F5F5F0', WebkitTextFillColor: '#F5F5F0',
  caretColor: '#B8933A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
  fontSize: '14px', outline: 'none', width: '100%', height: '46px', padding: '0 14px',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    try {
      const res = await authService.login(data);
      setAuth({ userId: res.userId, email: res.email, fullName: res.fullName, role: res.role as any }, res.accessToken, res.refreshToken);
      toast.success(`Welcome back, ${res.fullName.split(' ')[0]}!`);
      router.push(res.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) { setError('root', { message: extractApiError(err) }); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#080808' }}>
      {/* Left panel */}
      <div className="hidden lg:flex" style={{ width: '50%', position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(20,14,2,0.95) 0%, #080808 70%)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {[320, 220, 140].map(s => <div key={s} style={{ position: 'absolute', width: `${s}px`, height: `${s}px`, borderRadius: '50%', border: '1px solid rgba(184,147,58,0.1)' }} />)}
        </div>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '32px', letterSpacing: '0.15em', color: '#F5F5F0', marginBottom: '8px' }}>
            SOUL<span style={{ background: 'linear-gradient(135deg,#C4A24A,#E8C96A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 8px' }}>×</span>TIME
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '17px', color: 'rgba(245,245,240,0.3)', fontStyle: 'italic', letterSpacing: '0.06em' }}>Where Time Finds Its Soul</p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0,0,0.2,1] }} style={{ width: '100%', maxWidth: '400px' }}>
          <Link href="/" style={{ display: 'block', fontFamily: "'Playfair Display',serif", fontSize: '20px', letterSpacing: '0.15em', color: '#F5F5F0', textDecoration: 'none', marginBottom: '48px' }} className="lg:hidden">
            SOUL<span style={{ background: 'linear-gradient(135deg,#C4A24A,#E8C96A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 6px' }}>×</span>TIME
          </Link>

          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '30px', color: '#F5F5F0', fontWeight: 400, marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ fontSize: '14px', color: '#5A5A55', marginBottom: '36px' }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '7px' }}>Email</label>
              <input type="email" placeholder="you@example.com" autoComplete="email"
                {...register('email')}
                style={{ ...FIELD, borderColor: errors.email ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)' }}
                onFocus={e => { e.target.style.borderColor = '#B8933A'; e.target.style.boxShadow = '0 0 0 3px rgba(184,147,58,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = errors.email ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
              {errors.email && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '4px' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '7px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} placeholder="Your password" autoComplete="current-password"
                  {...register('password')}
                  style={{ ...FIELD, paddingRight: '44px', borderColor: errors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)' }}
                  onFocus={e => { e.target.style.borderColor = '#B8933A'; e.target.style.boxShadow = '0 0 0 3px rgba(184,147,58,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = errors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5A5A55', cursor: 'pointer', display: 'flex', alignItems: 'center' }} aria-label={showPass ? 'Hide' : 'Show'}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '4px' }}>{errors.password.message}</p>}
            </div>

            {errors.root && (
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
                {errors.root.message}
              </div>
            )}

            <Button type="submit" variant="gold" size="lg" fullWidth loading={isSubmitting} className="mt-2" style={{ gap: '8px' }}>
              Sign In <ArrowRight size={15} />
            </Button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#5A5A55', marginTop: '28px' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#B8933A', textDecoration: 'none' }}
              className="hover:text-[#D4AF6B]">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
