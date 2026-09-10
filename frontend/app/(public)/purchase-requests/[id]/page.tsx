'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PurchaseRequestItem {
  id: string;
  productId: string;
  productName: string;
  productNameSnapshot: string;
  sellingPriceSnapshot: number;
  discountSnapshot: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  quantity: number;
  lineTotal: number;
}

interface PurchaseRequest {
  id: string;
  requestNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  items: PurchaseRequestItem[];
  subtotal: number;
  totalDiscount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  billId?: string;
  billNumber?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const STATUS_STEPS = [
  { key: 'REQUESTED', label: 'Request Sent', icon: '📤' },
  { key: 'UNDER_REVIEW', label: 'Under Review', icon: '🔍' },
  { key: 'BILL_GENERATED', label: 'Bill Ready', icon: '🧾' },
  { key: 'PAID', label: 'Completed', icon: '✅' },
];

const STATUS_ORDER: Record<string, number> = {
  REQUESTED: 0,
  UNDER_REVIEW: 1,
  BILL_GENERATED: 2,
  SENT: 2,
  PAID: 3,
  COMPLETED: 3,
  CANCELLED: -1,
};

export default function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('sxt_token');
    if (!token) { router.push('/login'); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customer/purchase-requests/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) { router.push('/login'); throw new Error('auth'); }
        if (r.status === 403) throw new Error('forbidden');
        if (r.status === 404) throw new Error('not_found');
        if (!r.ok) throw new Error('failed');
        return r.json();
      })
      .then(setRequest)
      .catch((e) => {
        if (e.message === 'auth') return;
        if (e.message === 'forbidden') setError('You are not authorised to view this request.');
        else if (e.message === 'not_found') setError('Purchase request not found.');
        else setError('Unable to load request. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleWhatsApp = () => {
    if (!request) return;
    const msg = encodeURIComponent(
      `*SOUL × TIME — Purchase Request #${request.requestNumber}*\n\n` +
        `Customer: ${request.customerName}\n` +
        `Phone: ${request.customerPhone}\n` +
        `Date: ${formatDateTime(request.createdAt)}\n\n` +
        `*Items:*\n` +
        request.items.map((i) => `• ${i.productNameSnapshot} × ${i.quantity} — ${formatCurrency(i.lineTotal)}`).join('\n') +
        `\n\nSubtotal: ${formatCurrency(request.subtotal)}\n` +
        (request.totalDiscount > 0 ? `Discount: −${formatCurrency(request.totalDiscount)}\n` : '') +
        `*Total: ${formatCurrency(request.total)}*\n\n` +
        `Request ID: ${request.requestNumber}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const currentStep = request ? STATUS_ORDER[request.status] ?? 0 : 0;
  const isCancelled = request?.status === 'CANCELLED';

  if (loading) return <LoadingSpinner message="Loading request..." />;

  if (error) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px' }}>🚫</div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--text-primary)' }}>Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '320px' }}>{error}</p>
        <Link href="/account" style={{ padding: '10px 24px', background: 'rgba(61,143,212,0.1)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-md)', color: 'var(--blue-bright)', fontSize: '14px', textDecoration: 'none' }}>
          ← Back to Account
        </Link>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 24px 80px' }}>
      {/* Back + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <Link href="/account" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ← Back to Account
        </Link>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {request.billId && (
            <Link
              href={`/bills/${request.billId}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '9px 18px', background: 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.3)', borderRadius: 'var(--radius-md)',
                color: 'var(--gold)', fontSize: '13px', fontWeight: '500', textDecoration: 'none', transition: 'all var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.18)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.1)'; }}
            >
              🧾 View Bill #{request.billNumber}
            </Link>
          )}
          <button
            onClick={handleWhatsApp}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '9px 18px', background: 'rgba(37,211,102,0.1)',
              border: '1px solid rgba(37,211,102,0.3)', borderRadius: 'var(--radius-md)',
              color: '#25D366', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all var(--transition)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,211,102,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,211,102,0.1)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Send to WhatsApp
          </button>
        </div>
      </div>

      {/* Header card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '24px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(8,20,40,0.9) 0%, rgba(13,32,64,0.8) 100%)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Purchase Request</div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                #{request.requestNumber}
              </h1>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Submitted {formatDateTime(request.createdAt)}</div>
            </div>
            <StatusBadge status={request.status} />
          </div>
        </div>

        {/* Progress stepper */}
        {!isCancelled && (
          <div style={{ padding: '28px 32px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', position: 'relative' }}>
              {STATUS_STEPS.map((step, idx) => {
                const done = currentStep > idx;
                const active = currentStep === idx;
                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: idx < STATUS_STEPS.length - 1 ? 1 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px',
                        background: done ? 'rgba(16,185,129,0.15)' : active ? 'rgba(61,143,212,0.15)' : 'rgba(8,20,40,0.6)',
                        border: `2px solid ${done ? '#34d399' : active ? 'var(--blue-accent)' : 'var(--border)'}`,
                        transition: 'all var(--transition)',
                      }}>
                        {done ? '✓' : step.icon}
                      </div>
                      <span style={{ fontSize: '11px', color: done ? '#34d399' : active ? 'var(--blue-bright)' : 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: active ? '600' : '400', textAlign: 'center' }}>
                        {step.label}
                      </span>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div style={{ flex: 1, height: '2px', background: done ? '#34d399' : 'var(--border)', margin: '0 8px', marginBottom: '28px', transition: 'background var(--transition-slow)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div style={{ padding: '20px 32px', background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ color: '#f87171', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🚫</span> This purchase request has been cancelled.
            </p>
          </div>
        )}

        {/* Customer + Items */}
        <div style={{ padding: '28px 32px' }}>
          {/* Customer info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Customer</div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>{request.customerName}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>{request.customerPhone}</div>
            </div>
            {request.notes && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>{request.notes}</div>
              </div>
            )}
          </div>

          {/* Items table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Product', 'Unit Price', 'Qty', 'Total'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      textAlign: h === 'Product' ? 'left' : 'right',
                      fontSize: '11px', fontWeight: '600',
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {request.items.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: i < request.items.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(8,20,40,0.2)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: '500' }}>{item.productNameSnapshot}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatCurrency(item.sellingPriceSnapshot)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>{item.quantity}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <div style={{ minWidth: '240px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                <span>Subtotal</span><span>{formatCurrency(request.subtotal)}</span>
              </div>
              {request.totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#34d399', borderBottom: '1px solid var(--border)' }}>
                  <span>Discount</span><span>−{formatCurrency(request.totalDiscount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '18px', fontWeight: '700' }}>
                <span style={{ color: 'var(--text-primary)' }}>Total</span>
                <span style={{ background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {formatCurrency(request.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What happens next */}
      {!isCancelled && currentStep < 3 && (
        <div style={{ padding: '24px', background: 'rgba(61,143,212,0.05)', border: '1px solid rgba(61,143,212,0.15)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '12px' }}>What happens next?</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { step: 1, text: 'Our team will review your purchase request.', done: currentStep >= 1 },
              { step: 2, text: 'We\'ll generate a bill and notify you via WhatsApp.', done: currentStep >= 2 },
              { step: 3, text: 'Complete payment and your order will be processed.', done: currentStep >= 3 },
            ].map(({ step, text, done }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: done ? 'rgba(16,185,129,0.15)' : 'rgba(61,143,212,0.1)', border: `1px solid ${done ? '#34d399' : 'var(--border-active)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: done ? '#34d399' : 'var(--blue-bright)', flexShrink: 0, marginTop: '1px' }}>
                  {done ? '✓' : step}
                </div>
                <span style={{ fontSize: '14px', color: done ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: done ? 'line-through' : 'none' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
