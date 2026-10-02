'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  sellingPrice: number;
  effectivePrice: number;
  discountValue: number;
  discountType: string;
  discountAmount: number;
  stockStatus: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  specifications?: Record<string, string>;
  sku: string;
  featured: boolean;
  isNew: boolean;
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setProduct)
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    try {
      const existing = JSON.parse(localStorage.getItem('sxt_cart') ?? '[]');
      const idx = existing.findIndex((i: { id: string }) => i.id === product.id);
      const quantity = Math.max(1, Number(qty) || 1);
      if (idx >= 0) existing[idx].quantity = (Number(existing[idx].quantity) || 0) + quantity;
      else existing.push({ id: product.id, name: product.name, price: product.effectivePrice, image: product.primaryImageUrl, quantity });
      localStorage.setItem('sxt_cart', JSON.stringify(existing));
      window.dispatchEvent(new Event('cart-updated'));
      setAddedToCart(true);
      showToast(`${product.name} added to cart`);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch { showToast('Could not add to cart.'); }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => router.push('/cart'), 300);
  };

  const images = product ? [product.primaryImageUrl, ...(product.imageUrls ?? [])].filter(Boolean) as string[] : [];

  if (loading) return <LoadingSpinner message="Loading product…" />;
  if (error || !product) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px' }}>
      <div style={{ fontSize: '48px' }}>⌚</div>
      <p style={{ color: '#f87171' }}>{error ?? 'Product not found.'}</p>
      <Link href="/products" style={{ padding: '10px 20px', background: 'rgba(61,143,212,0.1)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-md)', color: 'var(--blue-bright)', textDecoration: 'none' }}>← Back to Collection</Link>
    </div>
  );

  const hasDiscount = product.discountValue > 0 && product.effectivePrice < product.sellingPrice;
  const outOfStock = product.stockStatus === 'OUT_OF_STOCK';

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', zIndex: 9999, boxShadow: 'var(--shadow-lg)' }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 24px 80px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '32px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link href="/products" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Collection</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-secondary)' }}>{product.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' }}>
          {/* Gallery */}
          <div>
            <div style={{ aspectRatio: '1', background: 'linear-gradient(135deg, #4e342e 0%, #6d4c41 50%, #3e2723 100%)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '16px', position: 'relative' }}>
              {images.length > 0 ? (
                <img src={images[selectedImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }} />
              ) : (
                <div style={{ fontSize: '100px', opacity: 0.5 }}>⌚</div>
              )}
              {hasDiscount && (
                <div style={{ position: 'absolute', top: '16px', left: '16px', padding: '6px 12px', background: 'rgba(239,68,68,0.9)', color: 'white', fontSize: '12px', fontWeight: '700', borderRadius: '12px' }}>
                  -{product.discountType === 'PERCENTAGE' ? `${product.discountValue}%` : fmt(product.discountValue)} OFF
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    style={{ width: '72px', height: '72px', border: `2px solid ${selectedImage === i ? 'var(--blue-accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', overflow: 'hidden', cursor: 'pointer', padding: '4px', transition: 'border-color var(--transition)' }}>
                    <img src={img} alt={`View ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>{product.brand} · {product.category}</div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '16px' }}>{product.name}</h1>
              {product.isNew && <span style={{ padding: '4px 10px', background: 'var(--gold-gradient)', color: '#000', fontSize: '11px', fontWeight: '700', borderRadius: '12px', marginRight: '8px' }}>NEW</span>}
              {product.stockStatus === 'LOW_STOCK' && <span style={{ padding: '4px 10px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: '11px', fontWeight: '600', borderRadius: '12px' }}>Low Stock</span>}
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: '700', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {fmt(product.effectivePrice)}
              </span>
              {hasDiscount && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '16px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{fmt(product.sellingPrice)}</span>
                  <span style={{ fontSize: '13px', color: '#34d399', fontWeight: '500' }}>You save {fmt(product.discountAmount)}</span>
                </div>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7' }}>{product.description}</p>

            {/* Quantity + Actions */}
            {!outOfStock && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quantity</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <button onClick={() => setQty(q => Math.max(1, (Number(q) || 1) - 1))}
                      style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px', transition: 'background var(--transition)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(61,143,212,0.08)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      −
                    </button>
                    <span style={{ width: '48px', textAlign: 'center', fontWeight: '600', color: 'var(--text-primary)', fontSize: '16px' }}>{qty}</span>
                    <button onClick={() => setQty(q => Math.min(99, (Number(q) || 1) + 1))}
                      style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px', transition: 'background var(--transition)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(61,143,212,0.08)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Available to request</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={handleAddToCart}
                    style={{ flex: 1, minWidth: '160px', padding: '14px', background: addedToCart ? 'rgba(52,211,153,0.15)' : 'rgba(61,143,212,0.12)', border: `1px solid ${addedToCart ? 'rgba(52,211,153,0.4)' : 'var(--border-active)'}`, borderRadius: 'var(--radius-md)', color: addedToCart ? '#34d399' : 'var(--blue-bright)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all var(--transition)' }}>
                    {addedToCart ? '✓ Added to Cart' : 'Add to Cart'}
                  </button>
                  <button onClick={handleBuyNow}
                    style={{ flex: 1, minWidth: '160px', padding: '14px', background: 'var(--gold-gradient)', border: 'none', borderRadius: 'var(--radius-md)', color: '#000', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: 'var(--shadow-gold)', transition: 'transform var(--transition)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                    Buy Now
                  </button>
                </div>
              </div>
            )}

            {outOfStock && (
              <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: '#f87171', textAlign: 'center', fontWeight: '500' }}>
                Currently Out of Stock
              </div>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Specifications</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} style={{ padding: '10px 14px', background: 'rgba(8,20,40,0.5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{key}</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SKU */}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              SKU: <span style={{ fontFamily: 'monospace' }}>{product.sku}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
