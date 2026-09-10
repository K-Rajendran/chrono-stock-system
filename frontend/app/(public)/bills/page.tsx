'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Bill {
  id: string;
  billNumber: string;
  finalTotal: number;
  billStatus: string;
  paymentStatus: string;
  createdAt: string;
  itemCount: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function BillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('sxt_token');
    if (!token) { router.push('/login'); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customer/bills`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) { router.push('/login'); throw new Error('auth'); }
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then(setBills)
      .catch((e) => { if (e.message !== 'auth') setError('Unable to load bills.'); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '120px 24px 80px' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link href="/account" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          ← Account
        </Link>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: '700', color: 'var(--text-primary)' }}>
          My Bills
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '8px' }}>Your purchase history and bill records.</p>
      </div>

      {loading && <LoadingSpinner message="Loading your bills..." />}

      {error && (
        <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: '#f87171' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '12px', padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {!loading && !error && bills.length === 0 && (
        <div style={{ padding: '80px 32px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧾</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>No Bills Yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>When your purchases are confirmed, your bills will appear here.</p>
          <Link href="/products" style={{ padding: '10px 24px', background: 'rgba(61,143,212,0.1)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-md)', color: 'var(--blue-bright)', textDecoration: 'none', fontSize: '14px' }}>
            Browse Collection →
          </Link>
        </div>
      )}

      {!loading && !error && bills.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bills.map((bill) => (
            <Link
              key={bill.id}
              href={`/bills/${bill.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '20px',
                alignItems: 'center',
                padding: '20px 24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                textDecoration: 'none',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'var(--border-active)';
                el.style.background = 'var(--bg-elevated)';
                el.style.transform = 'translateX(3px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'var(--border)';
                el.style.background = 'var(--bg-card)';
                el.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: 'rgba(61,143,212,0.1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                🧾
              </div>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px', marginBottom: '4px' }}>
                  Bill #{bill.billNumber}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {formatDate(bill.createdAt)} · {bill.itemCount} item{bill.itemCount !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ fontWeight: '700', fontSize: '16px', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {formatCurrency(bill.finalTotal)}
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <StatusBadge status={bill.billStatus} size="sm" />
                  <StatusBadge status={bill.paymentStatus} size="sm" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
