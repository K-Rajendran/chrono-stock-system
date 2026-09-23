'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface RequestItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  discountValue: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  quantity: number;
  lineTotal: number;
}

interface PurchaseRequest {
  id: string;
  referenceId: string;
  status: string;
  customerName: string;
  customerPhone: string;
  items: RequestItem[];
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  notes: string;
  createdAt: string;
  billId?: string;
  billNumber?: string;
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDateTime = (s: string) => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'];

export default function AdminPurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingBill, setGeneratingBill] = useState(false);

  const [billForm, setBillForm] = useState({
    paymentMethod: 'CASH',
    transactionReference: '',
    notes: '',
    showForm: false,
  });

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequest = async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/purchase-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setRequest(await res.json());
    } catch { setError('Could not load request.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequest(); }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!confirm(`Change status to "${newStatus}"?`)) return;
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/purchase-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      showToast(`Status updated to ${newStatus}.`);
      fetchRequest();
    } catch { showToast('Status update failed.', 'err'); }
    finally { setUpdatingStatus(false); }
  };

  const handleGenerateBill = async () => {
    setGeneratingBill(true);
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          purchaseRequestId: id,
          customerName: request!.customerName,
          customerPhone: request!.customerPhone,
          paymentMethod: billForm.paymentMethod,
          transactionRef: billForm.transactionReference,
          notes: billForm.notes,
          items: request!.items.map(i => ({
            productId: i.productId,
            discountValue: i.discountValue,
            discountType: i.discountType,
            quantity: i.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Bill generation failed');
      }

      const bill = await res.json();
      showToast(`Bill #${bill.billNumber} created!`);
      setBillForm(f => ({ ...f, showForm: false }));
      fetchRequest();
      setTimeout(() => router.push(`/admin/bills/${bill.id}`), 1500);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create bill.', 'err');
    } finally { setGeneratingBill(false); }
  };

  if (loading) return <LoadingSpinner message="Loading request…" />;
  if (error || !request) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#f87171' }}>
      {error ?? 'Request not found.'}
      <br /><button onClick={() => router.back()} style={{ marginTop: '12px', padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>← Back</button>
    </div>
  );

  const canGenerateBill = ['REQUESTED', 'UNDER_REVIEW'].includes(request.status) && !request.billId;
  const STATUS_TRANSITIONS: Record<string, string[]> = {
    REQUESTED: ['UNDER_REVIEW', 'CANCELLED'],
    UNDER_REVIEW: ['CANCELLED'],
    BILL_GENERATED: ['PAID', 'CANCELLED'],
  };
  const nextStatuses = STATUS_TRANSITIONS[request.status] ?? [];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', background: toast.type === 'err' ? 'rgba(239,68,68,0.15)' : 'var(--bg-elevated)', border: `1px solid ${toast.type === 'err' ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', color: toast.type === 'err' ? '#f87171' : 'var(--text-primary)', fontSize: '14px', zIndex: 9999, boxShadow: 'var(--shadow-lg)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <Link href="/admin/purchase-requests" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '6px', display: 'inline-block' }}>← Purchase Requests</Link>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: '700', color: 'var(--text-primary)' }}>
            Request #{request.referenceId}
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{fmtDateTime(request.createdAt)}</div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        {/* Left: main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Customer */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Customer</h3>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{request.customerName}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phone</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{request.customerPhone}</div>
              </div>
            </div>
            {request.notes && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(8,20,40,0.4)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                {request.notes}
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(8,20,40,0.4)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Requested Items</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Product', 'Unit Price', 'Qty', 'Total'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Product' ? 'left' : 'right', fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {request.items.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom: i < request.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: '500' }}>{item.productName}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(item.unitPrice)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>{fmt(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ minWidth: '200px' }}>
                {request.totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>Discount</span><span style={{ color: '#34d399' }}>−{fmt(request.totalDiscount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: '700' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{fmt(request.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Generate bill form */}
          {canGenerateBill && billForm.showForm && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(201,168,76,0.06)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '600', color: 'var(--gold)' }}>Generate Bill</h3>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment Method</label>
                  <select value={billForm.paymentMethod} onChange={e => setBillForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Transaction Reference</label>
                  <input value={billForm.transactionReference} onChange={e => setBillForm(f => ({ ...f, transactionReference: e.target.value }))} placeholder="Optional" className="quantity-input"
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', WebkitTextFillColor: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notes</label>
                  <textarea value={billForm.notes} onChange={e => setBillForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional" className="quantity-input"
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', resize: 'vertical', WebkitTextFillColor: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleGenerateBill} disabled={generatingBill}
                    style={{ flex: 1, padding: '11px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '14px', borderRadius: 'var(--radius-md)', border: 'none', cursor: generatingBill ? 'not-allowed' : 'pointer', opacity: generatingBill ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {generatingBill && <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                    {generatingBill ? 'Creating Bill…' : 'Confirm & Create Bill'}
                  </button>
                  <button onClick={() => setBillForm(f => ({ ...f, showForm: false }))}
                    style={{ padding: '11px 20px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: actions sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' }}>
          {/* Bill link */}
          {request.billId && (
            <Link href={`/admin/bills/${request.billId}`}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'all var(--transition)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.18)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.1)'; }}
            >
              <span style={{ fontSize: '20px' }}>🧾</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gold)' }}>Bill #{request.billNumber}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>View generated bill</div>
              </div>
            </Link>
          )}

          {/* Generate bill button */}
          {canGenerateBill && !billForm.showForm && (
            <button onClick={() => setBillForm(f => ({ ...f, showForm: true }))}
              style={{ width: '100%', padding: '13px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '14px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-gold)' }}>
              🧾 Generate Bill
            </button>
          )}

          {/* Status transitions */}
          {nextStatuses.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(8,20,40,0.4)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Update Status</h4>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {nextStatuses.map(status => (
                  <button key={status} onClick={() => handleUpdateStatus(status)} disabled={updatingStatus}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                      background: status === 'CANCELLED' ? 'rgba(239,68,68,0.08)' : 'rgba(61,143,212,0.08)',
                      color: status === 'CANCELLED' ? '#f87171' : 'var(--blue-bright)',
                      fontSize: '13px', fontWeight: '500', cursor: updatingStatus ? 'not-allowed' : 'pointer', opacity: updatingStatus ? 0.6 : 1,
                    }}>
                    → {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* WhatsApp to customer */}
          <button
            onClick={() => {
              const msg = encodeURIComponent(`Hello ${request.customerName},\n\nYour purchase request #${request.referenceId} is *${request.status}*.\n\nTotal: ${fmt(request.totalAmount)}\n\n— AFINO`);
              window.open(`https://wa.me/${request.customerPhone.replace(/\D/g, '')}?text=${msg}`, '_blank');
            }}
            style={{ width: '100%', padding: '11px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 'var(--radius-md)', color: '#25D366', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            📱 WhatsApp Customer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 300px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
