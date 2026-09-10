'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface BillItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  sellingPriceSnapshot: number;
  discountSnapshot: number;
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED';
  quantity: number;
  lineTotal: number;
}

interface Bill {
  id: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  subtotal: number;
  totalDiscount: number;
  finalTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionReference: string;
  billStatus: string;
  notes: string;
  createdAt: string;
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'PARTIAL', 'CANCELLED'];
const BILL_STATUSES = ['SENT', 'CANCELLED', 'ISSUED', 'PAID', 'DRAFT'];

export default function AdminBillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [editData, setEditData] = useState({
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    transactionReference: '',
    billStatus: 'PENDING',
    notes: '',
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const fetchBill = async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bills/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data: Bill = await res.json();
      setBill(data);
      setEditData({
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        transactionReference: data.transactionReference ?? '',
        billStatus: data.billStatus,
        notes: data.notes ?? '',
      });
    } catch { setError('Could not load bill.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBill(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Save failed');
      }
      showToast('Bill updated successfully.');
      setEditMode(false);
      fetchBill();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save changes.');
    } finally { setSaving(false); }
  };

  const handleSendWhatsApp = async () => {
    if (!bill) return;
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bills/${id}/send-whatsapp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
      } else {
        showToast(data.message ?? 'WhatsApp message prepared.');
      }
    } catch {
      // Fallback: build local link
      const msg = encodeURIComponent(
        `*AFINO — Bill #${bill.billNumber}*\n\n` +
          `Customer: ${bill.customerName}\n` +
          `Date: ${fmtDate(bill.createdAt)}\n\n` +
          bill.items.map(i => `• ${i.productNameSnapshot} × ${i.quantity} — ${fmt(i.lineTotal)}`).join('\n') +
          `\n\nTotal: *${fmt(bill.finalTotal)}*\n` +
          `Payment: ${bill.paymentMethod} | ${bill.paymentStatus}`
      );
      window.open(`https://wa.me/${bill.customerPhone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    }
  };

  const handleCancelBill = async () => {
    if (!confirm('Cancel this bill? Inventory will be restored.')) return;
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bills/${id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      showToast('Bill cancelled. Inventory restored.');
      fetchBill();
    } catch { showToast('Cancel failed.'); }
  };

  const handlePrint = () => window.print();

  if (loading) return <LoadingSpinner message="Loading bill…" />;
  if (error || !bill) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#f87171' }}>
      {error ?? 'Bill not found.'}
      <br /><button onClick={() => router.back()} style={{ marginTop: '12px', padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>← Back</button>
    </div>
  );

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; color: black !important; } }`}</style>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', zIndex: 9999, boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Top actions */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/admin/bills" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Bills</Link>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} style={{ padding: '8px 16px', background: 'rgba(61,143,212,0.1)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-md)', color: 'var(--blue-bright)', fontSize: '13px', cursor: 'pointer' }}>
                Edit Bill
              </button>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '13px', borderRadius: 'var(--radius-md)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={() => setEditMode(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </>
            )}
            <button onClick={handleSendWhatsApp} style={{ padding: '8px 16px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: 'var(--radius-md)', color: '#25D366', fontSize: '13px', cursor: 'pointer' }}>
              📱 Send WhatsApp
            </button>
            <button onClick={handlePrint} style={{ padding: '8px 16px', background: 'rgba(61,143,212,0.08)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
              🖨 Print
            </button>
            {bill.billStatus !== 'CANCELLED' && (
              <button onClick={handleCancelBill} style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '13px', cursor: 'pointer' }}>
                Cancel Bill
              </button>
            )}
          </div>
        </div>

        {/* Bill document */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
          {/* Brand header */}
          <div style={{ padding: '36px 48px 28px', background: 'linear-gradient(135deg, rgba(8,20,40,0.9) 0%, rgba(13,32,64,0.8) 100%)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '600', letterSpacing: '0.2em', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '4px' }}>
              AFINO
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', letterSpacing: '0.1em' }}>Where Time Finds Its Soul</div>
          </div>

          {/* Bill meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '28px 40px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bill Number</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>#{bill.billNumber}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Date</div>
              <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>{fmtDate(bill.createdAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Customer</div>
              <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '600' }}>{bill.customerName}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{bill.customerPhone}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Status</div>
              <StatusBadge status={bill.billStatus} />
            </div>
          </div>

          {/* Items */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'rgba(8,20,40,0.5)', borderBottom: '1px solid var(--border)' }}>
                  {['Product', 'Unit Price', 'Qty', 'Discount', 'Total'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: h === 'Product' ? 'left' : 'right', fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: i < bill.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontWeight: '500' }}>{item.productNameSnapshot}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(item.sellingPriceSnapshot)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>{item.quantity}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {item.discountSnapshot > 0 ? (item.discountType === 'PERCENTAGE' ? `${item.discountSnapshot}%` : fmt(item.discountSnapshot)) : '—'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>{fmt(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment + totals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--border)' }}>
            {/* Payment fields — editable if in edit mode */}
            <div style={{ padding: '24px 32px', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Payment</div>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Method', field: 'paymentMethod', options: PAYMENT_METHODS },
                    { label: 'Status', field: 'paymentStatus', options: PAYMENT_STATUSES },
                    { label: 'Bill Status', field: 'billStatus', options: BILL_STATUSES },
                  ].map(({ label, field, options }) => (
                    <div key={field}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{label}</label>
                      <select value={(editData as Record<string, string>)[field]} onChange={e => setEditData(d => ({ ...d, [field]: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Transaction Reference</label>
                    <input value={editData.transactionReference} onChange={e => setEditData(d => ({ ...d, transactionReference: e.target.value }))} placeholder="UPI/card ref…"
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', WebkitTextFillColor: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Notes</label>
                    <textarea value={editData.notes} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} rows={2}
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'vertical', WebkitTextFillColor: 'var(--text-primary)' }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    ['Method', bill.paymentMethod],
                    ['Status', null],
                    ['Reference', bill.transactionReference || '—'],
                  ].map(([label, val]) => (
                    <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      {label === 'Status' ? <StatusBadge status={bill.paymentStatus} size="sm" /> : <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{val as string}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div style={{ padding: '24px 32px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span style={{ color: 'var(--text-primary)' }}>{fmt(bill.subtotal)}</span>
                </div>
                {bill.totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
                    <span style={{ color: '#34d399' }}>−{fmt(bill.totalDiscount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{fmt(bill.finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'rgba(8,20,40,0.4)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', letterSpacing: '0.08em' }}>
              Thank you for choosing SOUL × TIME — Where Time Finds Its Soul
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"]:not(table *) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
