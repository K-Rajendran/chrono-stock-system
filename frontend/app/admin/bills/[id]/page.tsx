'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { authenticatedFetch } from '@/lib/auth';

interface BillItem {
  id: string;
  productId: string;
  productName: string;
  sellingPrice: number;
  discountValue: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  quantity: number;
  totalPrice: number;
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
  transactionRef: string;
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
    billStatus: 'DRAFT',
    notes: '',
  });

  const [editItems, setEditItems] = useState<BillItem[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const fetchBill = async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bills/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data: Bill = await res.json();
      setBill(data);
      setEditData({
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        transactionReference: data.transactionRef ?? '',
        billStatus: data.billStatus,
        notes: data.notes ?? '',
      });
      setEditItems(data.items);
    } catch { setError('Could not load bill.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBill(); }, [id]);

  const calculateEditLine = (
    item: BillItem,
    discountValue: number,
    discountType: BillItem['discountType'],
    quantity: number
  ) => {
    const safeQuantity = Math.max(0, quantity);
    let normalizedDiscount = Math.max(0, Number(discountValue) || 0);

    if (discountType === 'PERCENTAGE') {
      normalizedDiscount = Math.min(100, normalizedDiscount);
    } else {
      normalizedDiscount = Math.min(item.sellingPrice, normalizedDiscount);
    }

    const discountPerUnit =
      discountType === 'PERCENTAGE'
        ? item.sellingPrice * normalizedDiscount / 100
        : normalizedDiscount;

    const unitPrice = Math.max(
      0,
      item.sellingPrice - discountPerUnit
    );

    return {
      discountValue: normalizedDiscount,
      lineDiscount: discountPerUnit * safeQuantity,
      totalPrice: unitPrice * safeQuantity,
    };
  };

  const updateEditDiscount = (
    itemId: string,
    value: number,
    type?: BillItem['discountType']
  ) => {
    setEditItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;

        const discountType = type ?? item.discountType;

        const {
          discountValue,
          totalPrice,
        } = calculateEditLine(
          item,
          value,
          discountType,
          item.quantity
        );

        return {
          ...item,
          discountValue,
          discountType,
          totalPrice,
        };
      })
    );
  };

  const updateEditQty = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setEditItems(prev =>
        prev.filter(item => item.id !== itemId)
      );
      return;
    }

    setEditItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;

        const { totalPrice } = calculateEditLine(
          item,
          item.discountValue,
          item.discountType,
          quantity
        );

        return {
          ...item,
          quantity,
          totalPrice,
        };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem('sxt_token');

      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/bills/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...editData,

            transactionRef: editData.transactionReference,

            items: editItems.map(item => ({
              productId: Number(item.productId),
              quantity: item.quantity,
              discountValue: item.discountValue ?? 0,
              discountType:
                item.discountType === 'FIXED_AMOUNT'
                  ? 'FIXED_AMOUNT'
                  : item.discountType === 'PERCENTAGE'
                    ? 'PERCENTAGE'
                    : null,
            })),
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Save failed');
      }

      showToast('Bill updated successfully.');
      setEditMode(false);

      await fetchBill();
    } catch (e: unknown) {
      showToast(
        e instanceof Error
          ? e.message
          : 'Failed to save changes.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!bill) return;
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bills/${id}/send-whatsapp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.whatsappLink) {
        window.open(data.whatsappLink, '_blank');
      } else {
        showToast(data.message ?? 'WhatsApp message prepared.');
      }
    } catch {
      // Fallback: build local link
      const msg = encodeURIComponent(
        `*AFINO — Bill #${bill.billNumber}*\n\n` +
          `Customer: ${bill.customerName}\n` +
          `Date: ${fmtDate(bill.createdAt)}\n\n` +
          bill.items.map(i => `• ${i.productName} × ${i.quantity} — ${fmt(i.totalPrice)}`).join('\n') +
          `\n\nTotal: *${fmt(displayedFinalTotal)}*\n` +
          `Payment: ${bill.paymentMethod} | ${bill.paymentStatus}`
      );
      window.open(`https://wa.me/${bill.customerPhone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    }
  };

  const handleCancelBill = async () => {
    if (!confirm('Cancel this bill? Inventory will be restored.')) return;
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bills/${id}/cancel`, {
        method: 'POST',
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

  const displayedItems = editMode
  ? editItems
  : bill.items;

  const displayedSubtotal = displayedItems.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0
  );

  const displayedDiscount = displayedItems.reduce((sum, item) => {
    if (item.discountType === 'PERCENTAGE') {
      const percentage = Math.min(
        100,
        Math.max(0, item.discountValue ?? 0)
      );

      return sum +
        item.sellingPrice *
        (percentage / 100) *
        item.quantity;
    }

    const fixedDiscount = Math.min(
      item.sellingPrice,
      Math.max(0, item.discountValue ?? 0)
    );

    return sum + fixedDiscount * item.quantity;
  }, 0);

  const displayedFinalTotal =
    Math.max(0, displayedSubtotal - displayedDiscount);

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          /* Hide the entire application */
          body * {
            visibility: hidden !important;
          }

          /* Show only the bill */
          .bill-print,
          .bill-print * {
            visibility: visible !important;
          }

          .bill-page-container {
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
          }

          /* Remove screen positioning/container restrictions */
          .bill-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;

            width: 100% !important;
            max-width: none !important;

            margin: 0 !important;
            padding: 0 !important;

            border: 1px solid #d1d5db !important;
            border-radius: 0 !important;

            box-shadow: none !important;

            background: #ffffff !important;
            color: #111827 !important;

            overflow: visible !important;
          }

          /* Never print admin controls */
          .no-print {
            display: none !important;
          }

          /* Preserve colors/backgrounds when printing */
          .bill-print,
          .bill-print * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Prevent sections from being split unnecessarily */
          .bill-print table {
            page-break-inside: auto;
          }

          .bill-print tr {
            page-break-inside: avoid !important;
            page-break-after: auto;
          }

          .bill-print thead {
            display: table-header-group;
          }

          .bill-print tfoot {
            display: table-footer-group;
          }

          /* Don't allow horizontal scrolling in the printed document */
          .bill-print > div {
            overflow: visible !important;
          }
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', zIndex: 9999, boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}

      <div className="bill-page-container" style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Top actions */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/admin/bills" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Bills</Link>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {bill.billStatus !== 'CANCELLED' && (
              !editMode ? (
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
              )
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
        <div
          className="bill-print"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Brand header */}
          <div style={{ padding: '36px 48px 28px', background: 'linear-gradient(135deg, rgba(8,20,40,0.9) 0%, rgba(13,32,64,0.8) 100%)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '600', letterSpacing: '0.2em', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '4px' }}>
              AFINO
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', letterSpacing: '0.1em' }}>Where Time Finds Its Soul</div>
          </div>

          {/* Bill meta */}
          <div
            className="bill-meta"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              padding: '28px 40px',
              borderBottom: '1px solid var(--border)',
            }}
          >
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
                {displayedItems.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: i < displayedItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontWeight: '500' }}>{item.productName}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(item.sellingPrice)}</td>
                    <td style={{
                      padding: '14px 20px',
                      textAlign: 'right',
                      color: 'var(--text-secondary)'
                    }}>
                      {editMode ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          <button
                            onClick={() =>
                              updateEditQty(item.id, item.quantity - 1)
                            }
                            style={{
                              width: '28px',
                              height: '28px',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            −
                          </button>

                          <span style={{
                            width: '34px',
                            textAlign: 'center',
                            color: 'var(--text-primary)',
                            fontWeight: '600',
                          }}>
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateEditQty(item.id, item.quantity + 1)
                            }
                            style={{
                              width: '28px',
                              height: '28px',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td style={{
                      padding: '14px 20px',
                      textAlign: 'right',
                      color: 'var(--text-secondary)'
                    }}>
                      {editMode ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '6px'
                        }}>
                          <input
                            type="number"
                            min="0"
                            max={
                              item.discountType === 'PERCENTAGE'
                                ? 100
                                : item.sellingPrice
                            }
                            step="0.01"
                            value={item.discountValue ?? 0}
                            onChange={e =>
                              updateEditDiscount(
                                item.id,
                                Number(e.target.value)
                              )
                            }
                            style={{
                              width: '70px',
                              padding: '7px 8px',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              textAlign: 'right',
                              outline: 'none',
                            }}
                          />

                          <select
                            value={item.discountType}
                            onChange={e =>
                              updateEditDiscount(
                                item.id,
                                item.discountValue ?? 0,
                                e.target.value as BillItem['discountType']
                              )
                            }
                            style={{
                              padding: '7px 6px',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              outline: 'none',
                            }}
                          >
                            <option value="PERCENTAGE">%</option>
                            <option value="FIXED_AMOUNT">₹</option>
                          </select>
                        </div>
                      ) : (
                        item.discountValue > 0
                          ? (
                            item.discountType === 'PERCENTAGE'
                              ? `${item.discountValue}%`
                              : fmt(item.discountValue)
                          )
                          : '—'
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>{fmt(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment + totals */}
          <div
            className="bill-payment-summary"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              borderTop: '1px solid var(--border)',
            }}
          >
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
                    ['Reference', bill.transactionRef || '—'],
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
                  <span style={{ color: 'var(--text-primary)' }}>{fmt(displayedSubtotal)}</span>
                </div>
                {displayedDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
                    <span style={{ color: '#34d399' }}>−{fmt(displayedDiscount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{fmt(displayedFinalTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'rgba(8,20,40,0.4)' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', letterSpacing: '0.08em' }}>
              Thank you for choosing AFINO — Where Time Finds Its Soul
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .bill-meta {
            grid-template-columns: 1fr !important;
            padding: 24px 20px !important;
          }

          .bill-payment-summary {
            grid-template-columns: 1fr !important;
          }

          .bill-payment-summary > div {
            border-right: none !important;
            border-bottom: 1px solid var(--border);
          }
        }

        @media (max-width: 480px) {
          .bill-print table {
            font-size: 12px !important;
          }

          .bill-print th,
          .bill-print td {
            padding: 10px 8px !important;
          }

          .bill-print > div:first-child {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
      `}</style>
    </>
  );
}
