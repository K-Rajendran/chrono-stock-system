'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { authenticatedFetch } from '@/lib/auth';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem('sxt_cart') ?? '[]'));
    } catch { setItems([]); }
  }, []);

  const updateQty = (id: string, delta: number) => {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i);
      localStorage.setItem('sxt_cart', JSON.stringify(next));
      window.dispatchEvent(new Event('cart-updated'));
      return next;
    });
  };

  const remove = (id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      localStorage.setItem('sxt_cart', JSON.stringify(next));
      window.dispatchEvent(new Event('cart-updated'));
      return next;
    });
  };

  const clear = () => {
    setItems([]);
    localStorage.removeItem('sxt_cart');
    window.dispatchEvent(new Event('cart-updated'));
  };

  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);

  const handlePurchaseRequest = async () => {
    const userStr = localStorage.getItem('sxt_user');
    const token = localStorage.getItem('sxt_token');
    if (!userStr || !token) { router.push('/login'); return; }

    setSubmitting(true);
    try {
      const user = JSON.parse(userStr);
      await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const itemResponses = await Promise.all(items.map(i => authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: Number(i.id), quantity: Number(i.quantity) || 1 }),
      })));
      if (itemResponses.some(response => !response.ok)) throw new Error('Could not prepare your cart.');
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/purchase-requests/from-cart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Could not submit request.');
      }

      const data = await res.json();

      const whatsappRes = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/purchase-requests/${data.id}/send-whatsapp`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const whatsapp = whatsappRes.ok ? await whatsappRes.json() : null;

      // Clear cart
      clear();
      showToast('Purchase request submitted!');

      // Open WhatsApp (if configured) or redirect
      if (whatsapp?.whatsappLink) window.open(whatsapp.whatsappLink, '_blank');

      setTimeout(() => router.push(`/purchase-requests/${data.id}`), 800);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Submission failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '120px 24px 80px' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', zIndex: 9999, boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Your Cart</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛒</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '8px' }}>Your cart is empty</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>Discover our curated collection of luxury timepieces.</p>
          <Link href="/products" style={{ display: 'inline-block', padding: '13px 28px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            Browse Collection →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '32px' }}>⌚</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <Link href={`/products/${item.id}`} style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', textDecoration: 'none', display: 'block', marginBottom: '4px' }}>{item.name}</Link>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--gold)' }}>{fmt(item.price)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>−</button>
                      <span style={{ width: '36px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>+</button>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', minWidth: '80px', textAlign: 'right' }}>{fmt(item.price * item.quantity)}</div>
                    <button onClick={() => remove(item.id)} style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', color: '#f87171', cursor: 'pointer', fontSize: '14px' }}>×</button>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={clear} style={{ alignSelf: 'flex-start', padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
              Clear Cart
            </button>
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Order Summary</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name} × {item.quantity}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700' }}>
                <span style={{ color: 'var(--text-primary)' }}>Total</span>
                <span style={{ background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{fmt(subtotal)}</span>
              </div>
            </div>

            <button onClick={handlePurchaseRequest} disabled={submitting}
              style={{ width: '100%', padding: '14px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '15px', borderRadius: 'var(--radius-md)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'var(--shadow-gold)', marginBottom: '12px' }}>
              {submitting && <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
              {submitting ? 'Submitting…' : '📱 Request via WhatsApp'}
            </button>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5' }}>
              Your request will be sent to us via WhatsApp. We'll confirm and send you a bill.
            </p>

            <Link href="/products" style={{ display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              ← Continue Shopping
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 340px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
