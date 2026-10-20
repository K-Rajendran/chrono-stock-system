'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveTokens } from '@/lib/auth';

const INPUT = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgb(255, 255, 255)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: '#F5F5F0',
  fontSize: '14px',
  outline: 'none',
  WebkitTextFillColor: '#030301',
  caretColor: '#c9a84c',
  transition: 'border-color var(--transition)',
} as React.CSSProperties;

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.status === 401) throw new Error('Invalid email or password.');
      if (!res.ok) throw new Error('Login failed. Please try again.');
      const data = await res.json();

      const accessToken = data.accessToken;

      // Guard: ensure we got a real token string before saving
      if (typeof accessToken !== 'string' || accessToken.split('.').length !== 3) {
        throw new Error('Invalid response from server. Please try again.');
      }

      const userName = data.fullName || data.email || 'User';
      saveTokens({ accessToken, refreshToken: data.refreshToken });

      localStorage.setItem(
        'sxt_user',
        JSON.stringify({
          name: userName,
          role: data.role || 'CUSTOMER',
          id: data.userId,
          email: data.email,
        })
      );
      // Notify Navbar to re-read user from localStorage
      window.dispatchEvent(new Event('auth-updated'));
      if (data.role === 'ADMIN') router.push('/admin/dashboard');
      else router.push('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Bg decoration */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(61,143,212,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/">
            <img src="/afino-logo-only.svg" alt="AFINO" style={{ width: '80px', height: '80px', margin: '0 auto 12px',}} />
          </Link>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '600', letterSpacing: '0.15em', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AFINO</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '40px', boxShadow: 'var(--shadow-lg)' }}>
          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '14px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="quantity-input"
                autoComplete="email"
                required
                style={INPUT}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-active)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="quantity-input"
                  autoComplete="current-password"
                  required
                  style={{ ...INPUT, paddingRight: '46px' }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-active)'; }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', fontSize: '16px' }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '14px', borderRadius: 'var(--radius-md)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
              {loading && <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--blue-bright)', fontWeight: '500', textDecoration: 'none' }}>Register</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to store</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
