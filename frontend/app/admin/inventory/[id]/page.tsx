'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: string;
}

interface InventoryTransaction {
  id: string;
  transactionType: string;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  createdAt: string;
  performedByName: string;
}

const TRANSACTION_TYPES = [
  { value: 'PURCHASE', label: 'Restock (Purchase)' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'RETURN', label: 'Return' },
  { value: 'CANCELLATION', label: 'Cancellation' },
];

const TYPE_COLORS: Record<string, string> = {
  PURCHASE: '#34d399',
  SALE: '#f87171',
  RETURN: '#60a5fa',
  ADJUSTMENT: '#fbbf24',
  CANCELLATION: '#f87171',
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: 'PURCHASE',
    quantity: '',
    reason: '',
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      const headers = { Authorization: `Bearer ${token}` };
      const base = process.env.NEXT_PUBLIC_API_URL;

      const [pRes, tRes] = await Promise.all([
        fetch(`${base}/api/admin/products/${id}`, { headers }),
        fetch(`${base}/api/admin/inventory/${id}/history?page=0&size=20`, { headers }),
      ]);

      if (!pRes.ok) throw new Error('product');
      setProduct(await pRes.json());

      if (tRes.ok) {
        const tData = await tRes.json();
        setTransactions(tData.content ?? tData ?? []);
      }
    } catch { setError('Could not load inventory data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAdjust = async () => {
    if (!form.quantity || isNaN(Number(form.quantity))) {
      showToast('Enter a valid quantity.'); return;
    }
    const qty = Number(form.quantity);
    if (qty === 0) { showToast('Quantity cannot be zero.'); return; }

    setAdjusting(true);
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/inventory/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: form.type, quantity: Math.abs(qty), reason: form.reason }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Adjustment failed');
      }

      showToast('Stock updated successfully.');
      setForm({ type: 'PURCHASE', quantity: '', reason: '' });
      fetchData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Adjustment failed.');
    } finally {
      setAdjusting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading inventory…" />;
  if (error) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#f87171' }}>{error}
      <br /><button onClick={fetchData} style={{ marginTop: '12px', padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Retry</button>
    </div>
  );

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', zIndex: 9999, boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <Link href="/admin/products" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '6px', display: 'inline-block' }}>← Products</Link>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: '700', color: 'var(--text-primary)' }}>
            {product?.name}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>{product?.sku}</p>
        </div>
        <StatusBadge status={product?.stockStatus ?? 'IN_STOCK'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px', alignItems: 'start' }}>
        {/* Current stock + adjust form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Stock card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Current Stock</div>
            <div style={{
              fontSize: '64px', fontWeight: '700', lineHeight: 1,
              color: product?.stockStatus === 'OUT_OF_STOCK' ? '#f87171'
                : product?.stockStatus === 'LOW_STOCK' ? '#fbbf24'
                  : '#34d399',
            }}>
              {product?.stockQuantity}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Low stock at ≤ {product?.lowStockThreshold} units
            </div>
          </div>

          {/* Adjust form */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(8,20,40,0.4)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Adjust Stock</h3>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Transaction Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                >
                  {TRANSACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Quantity Change <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(+ add / − remove)</span>
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="e.g. 10 or -3"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', WebkitTextFillColor: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Reason</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Restocked from supplier"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', WebkitTextFillColor: 'var(--text-primary)' }}
                />
              </div>

              <button
                onClick={handleAdjust}
                disabled={adjusting}
                style={{ padding: '11px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '14px', borderRadius: 'var(--radius-md)', border: 'none', cursor: adjusting ? 'not-allowed' : 'pointer', opacity: adjusting ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {adjusting && <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                {adjusting ? 'Saving…' : 'Apply Adjustment'}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(8,20,40,0.4)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Transaction History</h3>
          </div>
          {transactions.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No transactions yet.</div>
          ) : (
            <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
              {transactions.map((t, i) => (
                <div key={t.id} style={{ padding: '14px 20px', borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `${TYPE_COLORS[t.transactionType] ?? '#60a5fa'}18`,
                    border: `1px solid ${TYPE_COLORS[t.transactionType] ?? '#60a5fa'}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: '700',
                    color: TYPE_COLORS[t.transactionType] ?? '#60a5fa',
                  }}>
                    {t.quantityChange > 0 ? '+' : ''}{t.quantityChange}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{t.transactionType}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.quantityBefore} → {t.quantityAfter}</span>
                    </div>
                    {t.reason && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{t.reason}</div>}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {fmtDate(t.createdAt)}{t.performedByName ? ` · ${t.performedByName}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1.4fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
