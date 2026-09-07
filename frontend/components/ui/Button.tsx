'use client';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'gold', size = 'md', loading = false, fullWidth = false, className, children, disabled, style, ...props }, ref) => {

    const base = [
      'inline-flex items-center justify-center gap-2 font-medium tracking-wide',
      'transition-all duration-[220ms] cubic-bezier(0.4,0,0.2,1)',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      'select-none whitespace-nowrap',
    ].join(' ');

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: { background: 'linear-gradient(135deg,#C4A24A,#E8C96A 50%,#9A7A2A)', color: '#000', border: 'none' },
      gold:    { background: 'linear-gradient(135deg,#C4A24A,#E8C96A 50%,#9A7A2A)', color: '#000', border: 'none' },
      outline: { background: 'transparent', color: '#B8933A', border: '1px solid rgba(184,147,58,0.6)' },
      ghost:   { background: 'transparent', color: 'rgba(245,245,240,0.65)', border: 'none' },
      danger:  { background: '#dc2626', color: '#fff', border: 'none' },
      glass:   { background: 'rgba(255,255,255,0.04)', color: '#F5F5F0', border: '1px solid rgba(255,255,255,0.1)' },
    };

    const hoverMap: Record<string, string> = {
      primary: 'hover:opacity-90 hover:shadow-gold active:scale-[0.98]',
      gold:    'hover:opacity-90 hover:shadow-gold active:scale-[0.98]',
      outline: 'hover:bg-gold/10 hover:border-gold active:scale-[0.98]',
      ghost:   'hover:text-cream hover:bg-white/6',
      danger:  'hover:bg-red-500 active:scale-[0.98]',
      glass:   'hover:bg-white/8 hover:border-white/20 active:scale-[0.98]',
    };

    const sizeMap: Record<string, string> = {
      xs: 'h-7 px-3 text-xs rounded-lg',
      sm: 'h-8 px-4 text-xs rounded-xl',
      md: 'h-10 px-5 text-sm rounded-xl',
      lg: 'h-12 px-7 text-sm rounded-xl',
      xl: 'h-14 px-10 text-base rounded-2xl',
    };

    return (
      <button
        ref={ref}
        className={cn(base, hoverMap[variant], sizeMap[size], fullWidth && 'w-full', className)}
        style={{ ...variantStyles[variant], ...style }}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
