'use client';
import { useState } from 'react';
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { productService, cartService } from '@/services';
import { ProductCard } from '@/components/ui/ProductCard';
import { LoadingSpinner, QuantitySelector } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Props { params: { id: string } }

export default function ProductDetailPage({ params }: Props) {
  const id = Number(params.id);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { incrementCount } = useCartStore();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);

  const { data: product, isLoading } = useQuery({ queryKey: ['product', id], queryFn: () => productService.getById(id), enabled: !!id });
  const { data: related } = useQuery({ queryKey: ['related', id, product?.categoryId], queryFn: () => productService.getRelated(id, product?.categoryId ?? undefined), enabled: !!product?.categoryId });

  if (isLoading) return <div style={{ background: '#080808', minHeight: '100vh', paddingTop: '68px' }}><LoadingSpinner size="lg" /></div>;
  if (!product) return notFound();

  const images = product.imageUrls?.length ? product.imageUrls : product.primaryImageUrl ? [product.primaryImageUrl] : [];
  const outOfStock = product.stockStatus === 'OUT_OF_STOCK';
  const hasDiscount = (product.discountAmount ?? 0) > 0;

  const handleAdd = async () => {
    if (!isAuthenticated) { toast.error('Please sign in to add to cart'); router.push('/login'); return; }
    if (outOfStock) return;
    setAdding(true);
    try {
      await cartService.addItem(product.id, qty);
      for (let i = 0; i < qty; i++) incrementCount();
      toast.success(`${product.name} added to cart`);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Could not add to cart'); }
    finally { setAdding(false); }
  };

  const specs = [
    { label: 'Movement',       value: product.movement },
    { label: 'Case Material',  value: product.caseMaterial },
    { label: 'Strap',          value: product.strapMaterial },
    { label: 'Diameter',       value: product.caseDiameterMm ? `${product.caseDiameterMm}mm` : null },
    { label: 'Dial',           value: product.dialColor },
    { label: 'Water Resist.',  value: product.waterResistance },
    { label: 'Glass',          value: product.glassType },
    { label: 'Style',          value: product.genderStyle },
    { label: 'Warranty',       value: product.warrantyMonths ? `${product.warrantyMonths} months` : null },
    { label: 'SKU',            value: product.sku },
  ].filter(s => s.value);

  const stockInfo = {
    IN_STOCK:     { icon: <CheckCircle2 size={15} />, color: '#22c55e', label: 'In Stock' },
    LOW_STOCK:    { icon: <AlertTriangle size={15} />, color: '#eab308', label: 'Low Stock — Order Soon' },
    OUT_OF_STOCK: { icon: <XCircle size={15} />, color: '#ef4444', label: 'Out of Stock' },
  }[product.stockStatus];

  return (
    <div style={{ background: '#080808', minHeight: '100vh', paddingTop: '68px' }}>
      <div className="container-wide" style={{ paddingTop: '36px', paddingBottom: '80px' }}>

        {/* Breadcrumb */}
        <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#5A5A55', textDecoration: 'none', marginBottom: '36px', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#A0A09A'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#5A5A55'}>
          <ArrowLeft size={14} /> Back to Collection
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '48px' }} className="lg:grid-cols-2">

          {/* ── Gallery ── */}
          <div>
            <motion.div key={activeImg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
              position: 'relative', aspectRatio: '1', borderRadius: '20px', overflow: 'hidden',
              background: 'linear-gradient(145deg,#1a1a1a,#111)', marginBottom: '12px',
            }}>
              {images[activeImg] ? (
                <Image src={images[activeImg]} alt={product.name} fill className="object-cover" priority sizes="(max-width:1024px) 100vw,50vw" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '48px', color: 'rgba(255,255,255,0.05)' }}>ST</span>
                </div>
              )}
              {hasDiscount && (
                <div style={{ position: 'absolute', top: '16px', left: '16px', background: '#B8933A', color: '#000', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px' }}>
                  −{Math.round((product.discountAmount / product.sellingPrice) * 100)}% OFF
                </div>
              )}
            </motion.div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} style={{
                    flexShrink: 0, width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden',
                    border: i === activeImg ? '2px solid #B8933A' : '2px solid rgba(255,255,255,0.07)',
                    cursor: 'pointer', padding: 0, transition: 'border-color 0.2s',
                  }}>
                    <Image src={img} alt="" width={72} height={72} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {product.brand && (
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8933A' }}>{product.brand}</p>
            )}
            <div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,4vw,42px)', color: '#F5F5F0', fontWeight: 400, marginBottom: '10px', lineHeight: 1.15 }}>{product.name}</h1>
              {product.categoryName && (
                <span style={{ display: 'inline-block', fontSize: '11px', color: '#5A5A55', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '100px', padding: '4px 12px' }}>
                  {product.categoryName}
                </span>
              )}
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

            {/* Price */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '34px', fontWeight: 600, background: 'linear-gradient(135deg,#C4A24A,#E8C96A 45%,#9A7A2A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                ₹{product.effectivePrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && <>
                <span style={{ fontSize: '18px', color: '#5A5A55', textDecoration: 'line-through' }}>₹{product.sellingPrice.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: '14px', color: '#22c55e' }}>−₹{product.discountAmount.toLocaleString('en-IN')}</span>
              </>}
            </div>

            {/* Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: stockInfo.color, fontSize: '13px', fontWeight: 500 }}>
              {stockInfo.icon}{stockInfo.label}
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ fontSize: '14px', color: 'rgba(245,245,240,0.55)', lineHeight: 1.8 }}>{product.description}</p>
            )}

            {/* Add to cart */}
            {!outOfStock && (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <QuantitySelector value={qty} min={1} max={99} onChange={setQty} />
                <Button variant="gold" size="lg" onClick={handleAdd} loading={adding} style={{ flex: 1, minWidth: '180px', gap: '8px' }}>
                  <ShoppingBag size={16} /> Add to Cart
                </Button>
              </div>
            )}
            {outOfStock && (
              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', fontSize: '13px', color: '#f87171' }}>
                This timepiece is currently out of stock.
              </div>
            )}

            {/* Specs */}
            {specs.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', color: '#F5F5F0', fontWeight: 400, marginBottom: '16px' }}>Specifications</h3>
                <div>
                  {specs.map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', gap: '16px', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A5A55', width: '110px', flexShrink: 0, paddingTop: '1px' }}>{label}</span>
                      <span style={{ fontSize: '13px', color: 'rgba(245,245,240,0.7)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related && related.length > 0 && (
          <div style={{ marginTop: '80px' }}>
            <div style={{ marginBottom: '36px' }}>
              <p style={{ fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#B8933A', fontWeight: 600, marginBottom: '10px' }}>You May Also Like</p>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', color: '#F5F5F0', fontWeight: 400 }}>Related Timepieces</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '20px' }}>
              {related.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
