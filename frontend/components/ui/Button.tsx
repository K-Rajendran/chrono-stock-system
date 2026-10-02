'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<string, React.CSSProperties> = {
  primary: {
    background: 'var(--gold-gradient)',
    border: '1px solid var(--gold)',
    color: '#fff',
  },
  secondary: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-secondary)',
  },
  danger: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171',
  },
  gold: {
    background: 'var(--gold-gradient)',
    border: 'none',
    color: '#fff',
    fontWeight: '700',
    boxShadow: 'var(--shadow-gold)',
  },
};

const sizes: Record<string, React.CSSProperties> = {
  sm: { minHeight: '36px', padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius-sm)' },
  md: { minHeight: '44px', padding: '10px 20px', fontSize: '14px', borderRadius: 'var(--radius-md)' },
  lg: { minHeight: '48px', padding: '14px 28px', fontSize: '15px', borderRadius: 'var(--radius-md)' },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'var(--font-body)',
        fontWeight: '500',
        letterSpacing: '0.02em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all var(--transition)',
        opacity: disabled || loading ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        whiteSpace: 'nowrap',
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
      {...props}
    >
      {loading && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ animation: 'spin 0.8s linear infinite' }}
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </svg>
      )}
      {children}
    </button>
  );
}
