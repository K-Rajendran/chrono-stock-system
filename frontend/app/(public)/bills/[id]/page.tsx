'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { authenticatedFetch } from '@/lib/auth';

interface BillItem {
  id: string;
  productName: string;
  sellingPrice: number;
  purchasePriceSnapshot?: number;
  discountValue: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  quantity: number;
  totalPrice: number;
}

interface Bill {
  id: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  updatedAt: string;
  items: BillItem[];
  subtotal: number;
  totalDiscount: number;
  finalTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionRef?: string;
  billStatus: string;
  notes?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
};

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBill();
  }, [id]);

  const fetchBill = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      if (!token) { router.push('/login'); return; }

      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customer/bills/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) { router.push('/login'); return; }
      if (res.status === 403) { setError('You are not authorised to view this bill.'); return; }
      if (res.status === 404) { setError('Bill not found.'); return; }
      if (!res.ok) throw new Error('Failed to load bill');

      const data = await res.json();
      setBill(data);
    } catch (err) {
      setError('Unable to load bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    if (!bill) return;
    const msg = encodeURIComponent(
      `*AFINO — Bill #${bill.billNumber}*\n\n` +
        `Customer: ${bill.customerName}\n` +
        `Date: ${formatDate(bill.createdAt)}\n\n` +
        bill.items.map(i => `• ${i.productName} × ${i.quantity} — ${formatCurrency(i.totalPrice)}`).join('\n') +
        `\n\nTotal: *${formatCurrency(bill.finalTotal)}*\n` +
        `Payment: ${PAYMENT_METHOD_LABELS[bill.paymentMethod]} | ${bill.paymentStatus}\n\n` +
        `Thank you for your purchase! 🕐`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (loading) return <LoadingSpinner message="Loading bill..." />;

  if (error) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px' }}>🚫</div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--text-primary)' }}>Bill Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '320px' }}>{error}</p>
        <Link href="/account" style={{ padding: '10px 24px', background: 'rgba(61,143,212,0.1)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-md)', color: 'var(--blue-bright)', fontSize: '14px', textDecoration: 'none' }}>
          ← Back to Account
        </Link>
      </div>
    );
  }

  if (!bill) return null;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; font-family: 'Inter', sans-serif; }
          .bill-wrapper { background: white !important; border: none !important; box-shadow: none !important; color: black !important; max-width: 100% !important; }
          .bill-header-brand { color: black !important; }
          .bill-divider { border-color: #999 !important; }
          .bill-table th { background: #f5f5f5 !important; color: black !important; }
          .bill-table td { color: black !important; border-bottom: 1px solid #ddd !important; }
          .total-row { background: #f5f5f5 !important; }
        }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 24px 80px' }}>
        {/* Top bar */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <Link
            href="/account"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'color var(--transition)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            ← Back to Account
          </Link>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleWhatsApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                background: 'rgba(37,211,102,0.1)',
                border: '1px solid rgba(37,211,102,0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#25D366',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,211,102,0.18)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(37,211,102,0.1)'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Share via WhatsApp
            </button>

            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                background: 'rgba(61,143,212,0.1)',
                border: '1px solid var(--border-active)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--blue-bright)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(61,143,212,0.18)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(61,143,212,0.1)'; }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print Bill
            </button>
          </div>
        </div>

        {/* Bill document */}
        <div
          ref={printRef}
          className="bill-wrapper"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '40px 48px 32px',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, rgba(8,20,40,0.9) 0%, rgba(13,32,64,0.8) 100%)',
            }}
          >
            {/* Brand */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div
                className="bill-header-brand"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '28px',
                  fontWeight: '600',
                  letterSpacing: '0.2em',
                  background: 'var(--gold-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '4px',
                }}
              >
                AFINO
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.15em', fontStyle: 'italic' }}>
                Where Time Finds Its Soul
              </div>
            </div>

            {/* Meta row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bill Number</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>#{bill.billNumber}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Date</div>
                <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>{formatDate(bill.createdAt)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Customer</div>
                <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '600' }}>{bill.customerName}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{bill.customerPhone}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Status</div>
                <StatusBadge status={bill.billStatus} />
              </div>
            </div>
          </div>

          {/* Items table */}
          <div style={{ overflowX: 'auto' }}>
            <table
              className="bill-table"
              style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}
            >
              <thead>
                <tr style={{ background: 'rgba(8,20,40,0.6)', borderBottom: '1px solid var(--border)' }}>
                  {['Product', 'Price', 'Qty', 'Discount', 'Total'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '14px 20px',
                        textAlign: h === 'Product' ? 'left' : 'right',
                        fontSize: '11px',
                        fontWeight: '600',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, i) => {
                  const discountDisplay =
                    item.discountValue > 0
                      ? item.discountType === 'PERCENTAGE'
                        ? `${item.discountValue}%`
                        : formatCurrency(item.discountValue)
                      : '—';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: `1px solid ${i < bill.items.length - 1 ? 'var(--border)' : 'transparent'}`,
                        background: i % 2 === 0 ? 'transparent' : 'rgba(8,20,40,0.3)',
                      }}
                    >
                      <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {item.productName}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {formatCurrency(item.sellingPrice)}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {discountDisplay}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals + payment */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0',
              borderTop: '1px solid var(--border)',
            }}
          >
            {/* Payment info */}
            <div style={{ padding: '28px 32px', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Payment Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Method</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{PAYMENT_METHOD_LABELS[bill.paymentMethod] || bill.paymentMethod}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <StatusBadge status={bill.paymentStatus} size="sm" />
                </div>
                {bill.transactionRef && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Reference</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>{bill.transactionRef}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Summary totals */}
            <div style={{ padding: '28px 32px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(bill.subtotal)}</span>
                </div>
                {bill.totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
                    <span style={{ color: '#34d399' }}>−{formatCurrency(bill.totalDiscount)}</span>
                  </div>
                )}
                <div
                  className="total-row"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '17px',
                    fontWeight: '700',
                    padding: '12px 0',
                    borderTop: '1px solid var(--border)',
                    marginTop: '4px',
                  }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span
                    style={{
                      background: 'var(--gold-gradient)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {formatCurrency(bill.finalTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {bill.notes && (
            <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', background: 'rgba(8,20,40,0.3)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Note: {bill.notes}
              </p>
            </div>
          )}

          {/* Footer slogan */}
          <div
            style={{
              padding: '24px 32px',
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
              background: 'rgba(8,20,40,0.4)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                letterSpacing: '0.08em',
              }}
            >
              Thank you for choosing AFINO — Where Time Finds Its Soul
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
