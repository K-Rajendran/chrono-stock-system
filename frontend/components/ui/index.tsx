'use client';

import { cn } from '@/utils';
import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';

// ─── Shared input base styles ────────────────────────────────
const INPUT_BASE: React.CSSProperties = {
  backgroundColor: '#141414',
  color: '#F5F5F0',
  WebkitTextFillColor: '#F5F5F0',
  caretColor: '#B8933A',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
};

// ─────────────────────────────────────────────────────────────
// Label
// ─────────────────────────────────────────────────────────────
function FieldLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <label htmlFor={id} style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A5A55' }}>
      {children}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | "suffix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className, id, style, onFocus, onBlur, ...props }, ref) => {
    const inputId = id ?? `inp-${Math.random().toString(36).slice(2, 7)}`;
    const inputRef = useRef<HTMLInputElement>(null);
    const combinedRef = (ref as any) ?? inputRef;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {label && <FieldLabel id={inputId}>{label}</FieldLabel>}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {prefix && (
            <span style={{ position: 'absolute', left: '12px', color: '#5A5A55', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              {prefix}
            </span>
          )}
          <input
            ref={combinedRef}
            id={inputId}
            className={className}
            style={{
              ...INPUT_BASE,
              height: '42px',
              padding: `0 ${suffix ? '40px' : '14px'} 0 ${prefix ? '38px' : '14px'}`,
              borderColor: error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.08)',
              ...style,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#B8933A';
              e.target.style.boxShadow = '0 0 0 3px rgba(184,147,58,0.1)';
              onFocus?.(e);
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.08)';
              e.target.style.boxShadow = 'none';
              onBlur?.(e);
            }}
            {...props}
          />
          {suffix && (
            <span style={{ position: 'absolute', right: '12px', color: '#5A5A55', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              {suffix}
            </span>
          )}
        </div>
        {error && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '2px' }}>{error}</p>}
        {hint && !error && <p style={{ fontSize: '12px', color: '#5A5A55', marginTop: '2px' }}>{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─────────────────────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, style, onFocus, onBlur, ...props }, ref) => {
    const selectId = id ?? `sel-${Math.random().toString(36).slice(2, 7)}`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {label && <FieldLabel id={selectId}>{label}</FieldLabel>}
        <div style={{ position: 'relative' }}>
          <select
            ref={ref}
            id={selectId}
            className={className}
            style={{
              ...INPUT_BASE,
              height: '42px',
              padding: '0 36px 0 14px',
              appearance: 'none',
              WebkitAppearance: 'none',
              cursor: 'pointer',
              borderColor: error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.08)',
              ...style,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#B8933A';
              e.target.style.boxShadow = '0 0 0 3px rgba(184,147,58,0.1)';
              onFocus?.(e);
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.08)';
              e.target.style.boxShadow = 'none';
              onBlur?.(e);
            }}
            {...props}
          >
            {placeholder && <option value="" style={{ background: '#141414', color: '#5A5A55' }}>{placeholder}</option>}
            {options.map(o => (
              <option key={o.value} value={o.value} style={{ background: '#1A1A1A', color: '#F5F5F0' }}>{o.label}</option>
            ))}
          </select>
          <ChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#5A5A55', pointerEvents: 'none' }} />
        </div>
        {error && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '2px' }}>{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─────────────────────────────────────────────────────────────
// Textarea
// ─────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, style, onFocus, onBlur, ...props }, ref) => {
    const tid = id ?? `ta-${Math.random().toString(36).slice(2, 7)}`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {label && <FieldLabel id={tid}>{label}</FieldLabel>}
        <textarea
          ref={ref}
          id={tid}
          className={className}
          style={{
            ...INPUT_BASE,
            padding: '12px 14px',
            resize: 'vertical',
            minHeight: '96px',
            borderColor: error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.08)',
            ...style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#B8933A';
            e.target.style.boxShadow = '0 0 0 3px rgba(184,147,58,0.1)';
            onFocus?.(e);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.08)';
            e.target.style.boxShadow = 'none';
            onBlur?.(e);
          }}
          {...props}
        />
        {error && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '2px' }}>{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ─────────────────────────────────────────────────────────────
// SearchBar — reusable search input with icon
// ─────────────────────────────────────────────────────────────
export function SearchBar({
  placeholder = 'Search...', value, onChange, onSearch, className, ...rest
}: {
  placeholder?: string; value: string;
  onChange: (v: string) => void;
  onSearch?: (v: string) => void;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  return (
    <div style={{ position: 'relative', width: '100%' }} className={className}>
      <svg style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#5A5A55', pointerEvents: 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch?.(value)}
        style={{
          ...INPUT_BASE,
          height: '40px',
          paddingLeft: '38px',
          paddingRight: value ? '34px' : '14px',
        }}
        onFocus={e => { e.target.style.borderColor = '#B8933A'; e.target.style.boxShadow = '0 0 0 3px rgba(184,147,58,0.1)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
        {...rest}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#5A5A55', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
        >
          <X style={{ width: '14px', height: '14px' }} />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;

  const maxWidths = { sm: '400px', md: '560px', lg: '760px', xl: '1000px' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} role="dialog" aria-modal>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: maxWidths[size],
        background: '#141414', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', color: '#F5F5F0', fontWeight: 400 }}>{title}</h2>
            <button onClick={onClose} style={{ padding: '4px', borderRadius: '8px', cursor: 'pointer', color: '#5A5A55', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#5A5A55')}>
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        )}
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────
export function StatusBadge({ label, colorClass }: { label: string; colorClass: string }) {
  return <span className={cn('badge', colorClass)}>{label}</span>;
}

// ─────────────────────────────────────────────────────────────
// PriceDisplay
// ─────────────────────────────────────────────────────────────
export function PriceDisplay({ effectivePrice, sellingPrice, discountAmount, size = 'md' }: {
  effectivePrice: number; sellingPrice?: number; discountAmount?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const px = { sm: '18px', md: '22px', lg: '32px' }[size];
  const pxSub = { sm: '12px', md: '13px', lg: '15px' }[size];
  const hasDiscount = (discountAmount ?? 0) > 0;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px' }}>
      <span className="gold-text" style={{ fontFamily: "'Playfair Display',serif", fontSize: px, fontWeight: 600 }}>
        ₹{effectivePrice.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
      </span>
      {hasDiscount && sellingPrice && (
        <span style={{ fontSize: pxSub, color: '#5A5A55', textDecoration: 'line-through' }}>
          ₹{sellingPrice.toLocaleString('en-IN')}
        </span>
      )}
      {hasDiscount && discountAmount && (
        <span style={{ fontSize: pxSub, color: '#4ade80' }}>
          −₹{discountAmount.toLocaleString('en-IN')}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Loading
// ─────────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: '18px', md: '36px', lg: '52px' }[size];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
      <div style={{
        width: s, height: s,
        border: '2px solid rgba(255,255,255,0.06)',
        borderTop: '2px solid #B8933A',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
      <div className="skeleton" style={{ aspectRatio: '1', backgroundColor: '#1A1A1A' }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="skeleton" style={{ height: '14px', borderRadius: '6px', width: '70%', backgroundColor: '#1A1A1A' }} />
        <div className="skeleton" style={{ height: '11px', borderRadius: '6px', width: '45%', backgroundColor: '#1A1A1A' }} />
        <div className="skeleton" style={{ height: '20px', borderRadius: '6px', width: '35%', backgroundColor: '#1A1A1A' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
      {icon && <div style={{ marginBottom: '20px', color: 'rgba(90,90,85,0.6)', fontSize: '48px' }}>{icon}</div>}
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', color: '#F5F5F0', marginBottom: '8px', fontWeight: 400 }}>{title}</h3>
      {description && <p style={{ color: '#5A5A55', fontSize: '14px', maxWidth: '340px', marginBottom: '28px', lineHeight: 1.6 }}>{description}</p>}
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Error State
// ─────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <X style={{ width: '22px', height: '22px', color: '#f87171' }} />
      </div>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', color: '#F5F5F0', marginBottom: '8px', fontWeight: 400 }}>Something went wrong</h3>
      <p style={{ color: '#5A5A55', fontSize: '14px', marginBottom: '24px' }}>{message ?? 'An unexpected error occurred.'}</p>
      {onRetry && <button onClick={onRetry} style={{ color: '#B8933A', fontSize: '14px', textDecoration: 'underline', cursor: 'pointer' }}>Try again</button>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i;
    if (page < 4) return i;
    if (page > totalPages - 5) return totalPages - 7 + i;
    return page - 3 + i;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '40px' }}>
      <PagBtn onClick={() => onPageChange(page - 1)} disabled={page === 0}>‹</PagBtn>
      {pages.map(p => (
        <PagBtn key={p} onClick={() => onPageChange(p)} active={p === page}>{p + 1}</PagBtn>
      ))}
      <PagBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}>›</PagBtn>
    </div>
  );
}

function PagBtn({ children, onClick, disabled, active }: { children: ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: '34px', height: '34px', padding: '0 8px',
        borderRadius: '8px', fontSize: '13px', fontWeight: active ? 600 : 400,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        background: active ? '#B8933A' : 'transparent',
        color: active ? '#000' : '#A0A09A',
        border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => { if (!active && !disabled) { (e.currentTarget as HTMLElement).style.borderColor = '#B8933A'; (e.currentTarget as HTMLElement).style.color = '#B8933A'; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#A0A09A'; } }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// QuantitySelector
// ─────────────────────────────────────────────────────────────
export function QuantitySelector({ value, min = 1, max = 99, onChange }: {
  value: number; min?: number; max?: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
      {['−', '+'].map((sym, idx) => (
        idx === 0
          ? <button key="dec" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
              style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0A09A', cursor: 'pointer', fontSize: '18px', transition: 'all 0.15s', opacity: value <= min ? 0.35 : 1 }}
              onMouseEnter={e => { if (value > min) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >{sym}</button>
          : <button key="inc" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
              style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0A09A', cursor: 'pointer', fontSize: '18px', transition: 'all 0.15s', opacity: value >= max ? 0.35 : 1 }}
              onMouseEnter={e => { if (value < max) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >{sym}</button>
      ))}
      <span style={{ width: '38px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#F5F5F0', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={cn(hover ? 'card' : '', className)}
      style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
      {children}
    </div>
  );
}

export { Button } from './Button';
