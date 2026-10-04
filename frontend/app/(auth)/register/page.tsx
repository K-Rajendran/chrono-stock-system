'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgb(252, 252, 252)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: '#151139',
  fontSize: '14px',
  outline: 'none',
  WebkitTextFillColor: '#151139',
  caretColor: '#c9a84c',
  transition: 'border-color var(--transition)',
  boxSizing: 'border-box',
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type FieldProps = {
  label: string;
  name: keyof FormData;
  type?: string;
  placeholder: string;
  form: FormData;
  fieldErrors: Partial<FormData>;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  extra?: React.ReactNode;
};

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  form,
  fieldErrors,
  setForm,
  extra,
}: FieldProps) {
  const hasError = !!fieldErrors[name];

  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-muted)',
          marginBottom: '8px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>

      <input
        className="quantity-input"
        type={type}
        value={form[name]}
        onChange={(e) => {
          const value = e.target.value;

          setForm((prev) => ({
            ...prev,
            [name]: value,
          }));
        }}
        placeholder={placeholder}
        autoComplete={
          name === 'name'
            ? 'name'
            : name === 'email'
              ? 'email'
              : name === 'phone'
                ? 'tel'
                : name === 'confirmPassword'
                  ? 'new-password'
                  : 'off'
        }
        style={{
          ...INPUT,
          borderColor: hasError ? '#f87171' : 'var(--border)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = hasError
            ? '#f87171'
            : 'var(--border-active)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hasError
            ? '#f87171'
            : 'var(--border)';
        }}
      />

      {fieldErrors[name] && (
        <p
          style={{
            fontSize: '12px',
            color: '#f87171',
            marginTop: '4px',
          }}
        >
          {fieldErrors[name]}
        </p>
      )}

      {extra}
    </div>
  );
}

function pwStrength(
  pw: string,
): { score: number; label: string; color: string } {
  let score = 0;

  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map = [
    { label: '', color: 'transparent' },
    { label: 'Weak', color: '#f87171' },
    { label: 'Fair', color: '#fbbf24' },
    { label: 'Good', color: '#60a5fa' },
    { label: 'Strong', color: '#34d399' },
  ];

  return {
    score,
    ...map[score],
  };
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<FormData>>({});

  const pw = pwStrength(form.password);

  const validate = () => {
    const e: Partial<FormData> = {};

    if (!form.name.trim()) {
      e.name = 'Name is required';
    }

    if (!form.email.includes('@')) {
      e.email = 'Valid email required';
    }

    if (!form.phone.match(/^\+?[\d\s\-]{7,15}$/)) {
      e.phone = 'Valid phone required';
    }

    if (form.password.length < 8) {
      e.password = 'At least 8 characters';
    }

    if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
          }),
        },
      );

      if (res.status === 409) {
        throw new Error('Email already registered.');
      }

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? 'Registration failed.');
      }

      const data = await res.json();

      if (
        !data.accessToken ||
        typeof data.accessToken !== 'string' ||
        data.accessToken.length < 10
      ) {
        throw new Error(
          'Invalid response from server. Please try again.',
        );
      }

      const userName = data.fullName || form.name || 'User';

      localStorage.setItem('sxt_token', data.accessToken);

      localStorage.setItem(
        'sxt_user',
        JSON.stringify({
          name: userName,
          role: data.role || 'CUSTOMER',
          id: data.userId,
          email: data.email,
          phone: form.phone,
        }),
      );

      window.dispatchEvent(new Event('auth-updated'));

      router.push('/');
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : 'An error occurred.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          maxWidth: '100vw',
          maxHeight: '100vw',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(61,143,212,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '36px',
          }}
        >
          <Link href="/">
            <img
              src="/afino-logo-only.svg"
              alt="AFINO"
              style={{
                width: '44px',
                height: '44px',
                display: 'block',
                margin: '0 auto 10px',
              }}
            />
          </Link>

          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '0.15em',
              background: 'var(--gold-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AFINO
          </div>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '13px',
              marginTop: '6px',
            }}
          >
            Create your account
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px',
            boxShadow: 'var(--shadow-lg)',
            boxSizing: 'border-box',
          }}
        >
          {/* General error */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-md)',
                color: '#f87171',
                fontSize: '14px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <Field
              label="Full Name"
              name="name"
              placeholder="Your full name"
              form={form}
              fieldErrors={fieldErrors}
              setForm={setForm}
            />

            <Field
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              form={form}
              fieldErrors={fieldErrors}
              setForm={setForm}
            />

            <Field
              label="Phone"
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
              form={form}
              fieldErrors={fieldErrors}
              setForm={setForm}
            />

            {/* Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Password
              </label>

              <div
                style={{
                  position: 'relative',
                }}
              >
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }));
                  }}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  style={{
                    ...INPUT,
                    paddingRight: '46px',
                    borderColor: fieldErrors.password
                      ? '#f87171'
                      : 'var(--border)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      fieldErrors.password
                        ? '#f87171'
                        : 'var(--border-active)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      fieldErrors.password
                        ? '#f87171'
                        : 'var(--border)';
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={
                    showPw
                      ? 'Hide password'
                      : 'Show password'
                  }
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px',
                  }}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>

              {/* Password strength */}
              {form.password && (
                <div
                  style={{
                    marginTop: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      marginBottom: '4px',
                    }}
                  >
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '3px',
                          borderRadius: '2px',
                          background:
                            i <= pw.score
                              ? pw.color
                              : 'var(--border)',
                          transition:
                            'background var(--transition)',
                        }}
                      />
                    ))}
                  </div>

                  {pw.label && (
                    <p
                      style={{
                        fontSize: '11px',
                        color: pw.color,
                        margin: 0,
                      }}
                    >
                      {pw.label} password
                    </p>
                  )}
                </div>
              )}

              {fieldErrors.password && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#f87171',
                    marginTop: '4px',
                  }}
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <Field
              label="Confirm Password"
              name="confirmPassword"
              type={showPw ? 'text' : 'password'}
              placeholder="Re-enter password"
              form={form}
              fieldErrors={fieldErrors}
              setForm={setForm}
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: 'var(--gold-gradient)',
                color: '#000',
                fontWeight: '700',
                fontSize: '14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              {loading && (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(0,0,0,0.3)',
                    borderTopColor: '#000',
                    borderRadius: '50%',
                    animation:
                      'spin 0.8s linear infinite',
                  }}
                />
              )}

              {loading
                ? 'Creating account…'
                : 'Create Account'}
            </button>
          </form>

          {/* Login link */}
          <p
            style={{
              textAlign: 'center',
              marginTop: '20px',
              fontSize: '14px',
              color: 'var(--text-muted)',
            }}
          >
            Already have an account?{' '}
            <Link
              href="/login"
              style={{
                color: 'var(--blue-bright)',
                fontWeight: '500',
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '20px',
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              textDecoration: 'none',
            }}
          >
            ← Back to store
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 520px) {
          .register-card {
            padding: 24px !important;
          }
        }

        @media (max-width: 380px) {
          .register-card {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
