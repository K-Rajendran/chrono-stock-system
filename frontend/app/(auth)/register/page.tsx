'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/Button';
import { extractApiError } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number').optional().or(z.literal('')),
  password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Needs uppercase').regex(/[a-z]/, 'Needs lowercase').regex(/[0-9]/, 'Needs number'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(v => v, 'You must accept the terms'),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type F = z.infer<typeof schema>;

const FIELD: React.CSSProperties = {
  backgroundColor: '#141414', color: '#F5F5F0', WebkitTextFillColor: '#F5F5F0',
  caretColor: '#B8933A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
  fontSize: '14px', outline: 'none', width: '100%', height: '46px', padding: '0 14px',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function StrengthBar({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  if (!password) return null;
  const colors = ['#ef4444','#f97316','#eab308','#22c55e'];
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: '2px', borderRadius: '2px', background: i < score ? colors[score-1] : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {checks.map(({ label, ok }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: ok ? '#22c55e' : '#5A5A55', transition: 'color 0.2s' }}>
            <CheckCircle2 size={11} />{label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [passVal, setPassVal] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, watch } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    try {
      const res = await authService.register({ fullName: data.fullName, email: data.email, phone: data.phone || '', password: data.password });
      setAuth({ userId: res.userId, email: res.email, fullName: res.fullName, role: res.role as any }, res.accessToken, res.refreshToken);
      toast.success('Account created! Welcome to SOUL x TIME.');
      router.push('/');
    } catch (err) { setError('root', { message: extractApiError(err) }); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808', padding: '40px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0,0,0.2,1] }} style={{ width: '100%', maxWidth: '460px' }}>
        <Link href="/" style={{ display: 'block', fontFamily: "'Playfair Display',serif", fontSize: '20px', letterSpacing: '0.15em', color: '#F5F5F0', textDecoration: 'none', marginBottom: '48px' }}>
          SOUL<span style={{ background: 'linear-gradient(135deg,#C4A24A,#E8C96A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 6px' }}>×</span>TIME
        </Link>

        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '30px', color: '#F5F5F0', fontWeight: 400, marginBottom: '6px' }}>Create account</h1>
        <p style={{ fontSize: '14px', color: '#5A5A55', marginBottom: '36px' }}>Join the SOUL x TIME collection experience</p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { name: 'fullName',  label: 'Full Name',   type: 'text',     placeholder: 'Your full name',    auto: 'name' },
            { name: 'email',     label: 'Email',        type: 'email',    placeholder: 'you@example.com',   auto: 'email' },
            { name: 'phone',     label: 'Phone (opt.)', type: 'tel',      placeholder: '+91 98765 43210',   auto: 'tel' },
          ].map(({ name, label, type, placeholder, auto }) => (
            <div key={name}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '7px' }}>{label}</label>
              <input type={type} placeholder={placeholder} autoComplete={auto}
                {...register(name as any)}
                style={{ ...FIELD, borderColor: (errors as any)[name] ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)' }}
                onFocus={e => { e.target.style.borderColor = '#B8933A'; e.target.style.boxShadow = '0 0 0 3px rgba(184,147,58,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = (errors as any)[name] ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
              {(errors as any)[name] && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '4px' }}>{(errors as any)[name].message}</p>}
            </div>
          ))}

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '7px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} placeholder="Create a strong password" autoComplete="new-password"
                {...register('password', { onChange: e => setPassVal(e.target.value) })}
                style={{ ...FIELD, paddingRight: '44px', borderColor: errors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)' }}
                onFocus={e => { e.target.style.borderColor = '#B8933A'; e.target.style.boxShadow = '0 0 0 3px rgba(184,147,58,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = errors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5A5A55', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '4px' }}>{errors.password.message}</p>}
            <StrengthBar password={passVal} />
          </div>

          {/* Confirm */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '7px' }}>Confirm Password</label>
            <input type="password" placeholder="Repeat your password" autoComplete="new-password"
              {...register('confirmPassword')}
              style={{ ...FIELD, borderColor: errors.confirmPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)' }}
              onFocus={e => { e.target.style.borderColor = '#B8933A'; e.target.style.boxShadow = '0 0 0 3px rgba(184,147,58,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = errors.confirmPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors.confirmPassword && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '4px' }}>{errors.confirmPassword.message}</p>}
          </div>

          {/* Terms */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" {...register('terms')} style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#B8933A', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#5A5A55', lineHeight: 1.65 }}>
              I agree to the <span style={{ color: '#B8933A' }}>Terms of Service</span> and <span style={{ color: '#B8933A' }}>Privacy Policy</span>
            </span>
          </label>
          {errors.terms && <p style={{ fontSize: '12px', color: '#f87171' }}>{errors.terms.message}</p>}

          {errors.root && (
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
              {errors.root.message}
            </div>
          )}

          <Button type="submit" variant="gold" size="lg" fullWidth loading={isSubmitting} style={{ marginTop: '4px', gap: '8px' }}>
            Create Account <ArrowRight size={15} />
          </Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#5A5A55', marginTop: '28px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#B8933A', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
