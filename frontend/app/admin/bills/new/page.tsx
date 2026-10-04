'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product { id: string; name: string; sellingPrice: number; effectivePrice: number; stockQuantity: number; discountValue: number; discountType: string; primaryImageUrl?: string; }

interface BillItemDraft {
  productId: string;
  productNameSnapshot: string;
  sellingPriceSnapshot: number;

  // Manual/admin discount
  discountSnapshot: number;
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED';

  quantity: number;
  lineTotal: number;
  lineDiscount: number;
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const calcLineValues = (
  price: number,
  discount: number,
  discountType: string,
  qty: number
) => {
  let unitPrice = price;
  let unitDiscount = 0;

  if (discountType === 'PERCENTAGE') {
    const percentage = Math.min(100, Math.max(0, discount));
    unitDiscount = price * (percentage / 100);
    unitPrice = price - unitDiscount;
  } else if (discountType === 'FIXED') {
    unitDiscount = Math.min(price, Math.max(0, discount));
    unitPrice = price - unitDiscount;
  }

  unitPrice = Math.max(0, unitPrice);

  return {
    lineDiscount: unitDiscount * qty,
    lineTotal: unitPrice * qty,
  };
};

export default function AdminNewBillPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<BillItemDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('sxt_token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products?page=0&size=200&active=true`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => setProducts(d.content ?? d ?? [])).catch(() => {});
  }, []);

  const addProduct = (p: Product) => {
    const exists = items.find(i => i.productId === p.id);

    if (exists) {
      const quantity = exists.quantity + 1;

      const { lineDiscount, lineTotal } = calcLineValues(
        exists.sellingPriceSnapshot,
        exists.discountSnapshot,
        exists.discountType,
        quantity
      );

      setItems(prev =>
        prev.map(i =>
          i.productId === p.id
            ? {
                ...i,
                quantity,
                lineDiscount,
                lineTotal,
              }
            : i
        )
      );
    } else {
      const discountType =
        p.discountType === 'PERCENTAGE' || p.discountType === 'FIXED_AMOUNT'
          ? p.discountType === 'FIXED_AMOUNT'
            ? 'FIXED'
            : 'PERCENTAGE'
          : 'NONE';

      const discount = Number(p.discountValue ?? 0);

      const { lineDiscount, lineTotal } = calcLineValues(
        p.sellingPrice,
        discount,
        discountType,
        1
      );

      setItems(prev => [
        ...prev,
        {
          productId: p.id,
          productNameSnapshot: p.name,
          sellingPriceSnapshot: p.sellingPrice,
          discountSnapshot: discount,
          discountType,
          quantity: 1,
          lineDiscount,
          lineTotal,
        },
      ]);
    }
    setProductSearch('');
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.productId !== productId));
      return;
    }

    setItems(prev =>
      prev.map(i => {
        if (i.productId !== productId) return i;

        const { lineDiscount, lineTotal } = calcLineValues(
          i.sellingPriceSnapshot,
          i.discountSnapshot,
          i.discountType,
          qty
        );

        return {
          ...i,
          quantity: qty,
          lineDiscount,
          lineTotal,
        };
      })
    );
  };

  const updateDiscount = (
    productId: string,
    discount: number,
    discountType?: BillItemDraft['discountType']
  ) => {
    setItems(prev =>
      prev.map(item => {
        if (item.productId !== productId) return item;

        const nextDiscount = Math.max(0, Number(discount) || 0);
        const nextType = discountType ?? item.discountType;

        const { lineDiscount, lineTotal } = calcLineValues(
          item.sellingPriceSnapshot,
          nextDiscount,
          nextType,
          item.quantity
        );

        return {
          ...item,
          discountSnapshot: nextDiscount,
          discountType: nextType,
          lineDiscount,
          lineTotal,
        };
      })
    );
  };

  const subtotal = items.reduce(
    (s, i) => s + i.sellingPriceSnapshot * i.quantity,
    0
  );

  const totalDiscount = items.reduce(
    (s, i) => s + i.lineDiscount,
    0
  );

  const finalTotal = items.reduce(
    (s, i) => s + i.lineTotal,
    0
  );

  const filteredProducts = products.filter(p =>
    p.stockQuantity > 0 &&
    productSearch.length >= 2 &&
    (p.name.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const handleSubmit = async () => {
    if (!customerName.trim()) { setError('Customer name is required.'); return; }
    if (!customerPhone.trim()) { setError('Customer phone is required.'); return; }
    if (items.length === 0) { setError('Add at least one item.'); return; }

    setSubmitting(true); setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customerName, customerPhone, paymentMethod, transactionRef, notes,
          items: items.map(item => ({
            productId: Number(item.productId),
            quantity: item.quantity,
            discountValue:
              item.discountType === 'NONE'
                ? 0
                : item.discountSnapshot,
            discountType:
              item.discountType === 'FIXED'
                ? 'FIXED_AMOUNT'
                : item.discountType === 'PERCENTAGE'
                  ? 'PERCENTAGE'
                  : null,
          }))
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Failed to create bill');
      }
      const bill = await res.json();
      router.push(`/admin/bills/${bill.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred.');
    } finally { setSubmitting(false); }
  };

  const INPUT = { width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', WebkitTextFillColor: 'var(--text-primary)' } as React.CSSProperties;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <Link href="/admin/bills" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '4px', display: 'inline-block' }}>← Bills</Link>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: '700', color: 'var(--text-primary)' }}>Create Bill</h1>
        </div>
      </div>

      {error && <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '14px', marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Customer */}
        <Section title="Customer Details">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={LBL}>Customer Name *</label>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full name" className="quantity-input" style={INPUT} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-active)'; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }} />
            </div>
            <div>
              <label style={LBL}>Phone *</label>
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+91 98765 43210" className="quantity-input" style={INPUT} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-active)'; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }} />
            </div>
          </div>
        </Section>

        {/* Products */}
        <Section title="Items">
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <label style={LBL}>Add Product</label>
            <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Type product name to search…" className="quantity-input" style={INPUT} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-active)'; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }} />
            {filteredProducts.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', marginTop: '4px', boxShadow: 'var(--shadow-lg)' }}>
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => addProduct(p)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between', width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: '13px', transition: 'background var(--transition)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(61,143,212,0.08)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{p.primaryImageUrl ? <img src={p.primaryImageUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} /> : null}{p.name}</span>
                    <span style={{ color: 'var(--gold)', fontWeight: '600' }}>{fmt(p.effectivePrice)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(8,20,40,0.3)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: '14px' }}>
              Search and select products above
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Product', 'Price', 'Qty', 'Discount', 'Total', ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: h === '' || h === 'Product' ? 'left' : 'right', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr
                      key={item.productId}
                      style={{
                        borderBottom:
                          i < items.length - 1
                            ? '1px solid var(--border)'
                            : 'none',
                      }}
                    >
                      <td style={{
                        padding: '12px',
                        color: 'var(--text-primary)',
                        fontWeight: '500'
                      }}>
                        {item.productNameSnapshot}
                      </td>

                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        color: 'var(--text-secondary)'
                      }}>
                        {fmt(item.sellingPriceSnapshot)}
                      </td>

                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          <button
                            onClick={() =>
                              updateQty(item.productId, item.quantity - 1)
                            }
                            style={{
                              width: '28px',
                              height: '28px',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontSize: '16px'
                            }}
                          >
                            −
                          </button>

                          <span style={{
                            width: '32px',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--text-primary)'
                          }}>
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQty(item.productId, item.quantity + 1)
                            }
                            style={{
                              width: '28px',
                              height: '28px',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontSize: '16px'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* DISCOUNT */}
                      <td style={{ padding: '12px', textAlign: 'right' }}>
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
                                : item.sellingPriceSnapshot
                            }
                            step="0.01"
                            value={item.discountSnapshot}
                            onChange={e =>
                              updateDiscount(
                                item.productId,
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
                              updateDiscount(
                                item.productId,
                                item.discountSnapshot,
                                e.target.value as BillItemDraft['discountType']
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
                            <option value="NONE">None</option>
                            <option value="PERCENTAGE">%</option>
                            <option value="FIXED">₹</option>
                          </select>
                        </div>

                        {item.lineDiscount > 0 && (
                          <div style={{
                            marginTop: '4px',
                            fontSize: '11px',
                            color: '#34d399'
                          }}>
                            −{fmt(item.lineDiscount)}
                          </div>
                        )}
                      </td>

                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: '700',
                        color: 'var(--text-primary)'
                      }}>
                        {fmt(item.lineTotal)}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() =>
                            setItems(prev =>
                              prev.filter(i => i.productId !== item.productId)
                            )
                          }
                          style={{
                            padding: '4px 8px',
                            background: 'none',
                            border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#f87171',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)',
                  marginTop: '8px',
                }}
              >
                <div
                  style={{
                    minWidth: '240px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Subtotal
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {fmt(subtotal)}
                    </span>
                  </div>

                  {totalDiscount > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Discount
                      </span>
                      <span style={{ color: '#34d399' }}>
                        −{fmt(totalDiscount)}
                      </span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border)',
                    fontSize: '20px',
                    fontWeight: '700',
                  }}>
                    <span style={{ color: 'var(--text-primary)' }}>
                      Total
                    </span>

                    <span style={{
                      background: 'var(--gold-gradient)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      {fmt(finalTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Payment */}
        <Section title="Payment">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={LBL}>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                style={{ ...INPUT, cursor: 'pointer' }}>
                {['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Transaction Reference</label>
              <input value={transactionRef} onChange={e => setTransactionRef(e.target.value)} placeholder="Optional" className="quantity-input" style={INPUT} onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-active)'; }} onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }} />
            </div>
          </div>
          <div>
            <label style={LBL}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes…" className="quantity-input"
              style={{ ...INPUT, resize: 'vertical' }} onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border-active)'; }} onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'; }} />
          </div>
        </Section>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ padding: '13px 28px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '14px', borderRadius: 'var(--radius-md)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-gold)' }}>
            {submitting && <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
            {submitting ? 'Creating…' : 'Create Bill'}
          </button>
          <button onClick={() => router.back()} style={{ padding: '13px 24px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const LBL = { display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' } as React.CSSProperties;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(8,20,40,0.4)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
    </div>
  );
}
