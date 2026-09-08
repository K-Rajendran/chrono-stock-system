'use client';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { cartService, purchaseRequestService } from '@/services';
import { LoadingSpinner, EmptyState, QuantitySelector } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { setItemCount } = useCartStore();
  const qc = useQueryClient();

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated, router]);

  const { data: cart, isLoading } = useQuery({ queryKey: ['cart'], queryFn: cartService.get, enabled: isAuthenticated });

  useEffect(() => { if (cart) setItemCount(cart.itemCount); }, [cart, setItemCount]);

  const updateMut = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) => cartService.updateItem(productId, quantity),
    onSuccess: d => { qc.setQueryData(['cart'], d); setItemCount(d.itemCount); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Update failed'),
  });
  const removeMut = useMutation({
    mutationFn: (id: number) => cartService.removeItem(id),
    onSuccess: d => { qc.setQueryData(['cart'], d); setItemCount(d.itemCount); toast.success('Item removed'); },
  });
  const clearMut = useMutation({
    mutationFn: cartService.clear,
    onSuccess: d => { qc.setQueryData(['cart'], d); setItemCount(0); toast.success('Cart cleared'); },
  });
  const requestMut = useMutation({
    mutationFn: purchaseRequestService.createFromCart,
    onSuccess: d => { qc.setQueryData(['cart'], { items:[], itemCount:0, subtotal:0, totalDiscount:0, finalAmount:0 }); setItemCount(0); toast.success('Purchase request created!'); router.push(`/purchase-requests/${d.id}`); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Could not create request'),
  });

  if (!isAuthenticated) return null;
  if (isLoading) return <div style={{ background: '#080808', minHeight: '100vh', paddingTop: '68px' }}><LoadingSpinner size="lg" /></div>;

  const items = cart?.items ?? [];

  return (
    <div style={{ background: '#080808', minHeight: '100vh', paddingTop: '68px' }}>
      <div className="container-wide" style={{ paddingTop: '48px', paddingBottom: '80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#B8933A', fontWeight: 600, marginBottom: '8px' }}>Your Selection</p>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,3.5vw,42px)', color: '#F5F5F0', fontWeight: 400 }}>
              Cart {items.length > 0 && <span style={{ color: '#5A5A55', fontSize: '70%' }}>({items.length})</span>}
            </h1>
          </div>
          {items.length > 0 && (
            <button onClick={() => clearMut.mutate()} disabled={clearMut.isPending} style={{ fontSize: '13px', color: '#5A5A55', cursor: 'pointer', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#5A5A55'}>
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState icon={<ShoppingBag size={52} />} title="Your cart is empty"
            description="Discover our collection of handcrafted timepieces."
            action={<Link href="/products"><Button variant="gold" size="lg">Explore Collection</Button></Link>}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }} className="lg:grid-cols-3">

            {/* Items col */}
            <div style={{ gridColumn: 'span 2' }}>
              <AnimatePresence>
                {items.map(item => (
                  <motion.div key={item.productId} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', gap: '20px', padding: '20px', borderRadius: '16px', background: '#141414', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '12px' }}>
                    {/* Thumb */}
                    <Link href={`/products/${item.productId}`} style={{ flexShrink: 0, width: '88px', height: '88px', borderRadius: '12px', overflow: 'hidden', background: '#1A1A1A', textDecoration: 'none', display: 'block' }}>
                      {item.primaryImageUrl
                        ? <Image src={item.primaryImageUrl} alt={item.productName} width={88} height={88} className="w-full h-full object-cover" />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", color: 'rgba(255,255,255,0.1)', fontSize: '18px' }}>ST</div>}
                    </Link>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ minWidth: 0 }}>
                          {item.brand && <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8933A', marginBottom: '3px' }}>{item.brand}</p>}
                          <Link href={`/products/${item.productId}`} style={{ fontFamily: "'Playfair Display',serif", fontSize: '16px', color: '#F5F5F0', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#B8933A'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#F5F5F0'}>
                            {item.productName}
                          </Link>
                        </div>
                        <button onClick={() => removeMut.mutate(item.productId)} disabled={removeMut.isPending} style={{ padding: '6px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: 'transparent', color: '#5A5A55', flexShrink: 0, transition: 'all 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#5A5A55'; }}>
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '16px', fontWeight: 600, background: 'linear-gradient(135deg,#C4A24A,#E8C96A 45%,#9A7A2A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            ₹{item.effectivePrice.toLocaleString('en-IN')}
                          </span>
                          {item.discountAmount > 0 && <span style={{ fontSize: '13px', color: '#5A5A55', textDecoration: 'line-through' }}>₹{item.sellingPrice.toLocaleString('en-IN')}</span>}
                        </div>
                        <QuantitySelector value={item.quantity} min={1} max={item.stockQuantity}
                          onChange={v => updateMut.mutate({ productId: item.productId, quantity: v })} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#5A5A55' }}>
                          Line total: <span style={{ color: '#A0A09A', fontWeight: 500 }}>₹{item.lineTotal.toLocaleString('en-IN')}</span>
                        </span>
                        {item.lineDiscount > 0 && <span style={{ fontSize: '12px', color: '#22c55e' }}>−₹{item.lineDiscount.toLocaleString('en-IN')} saved</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#5A5A55', textDecoration: 'none', marginTop: '8px', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#A0A09A'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#5A5A55'}>
                <ArrowLeft size={14} /> Continue Shopping
              </Link>
            </div>

            {/* Summary */}
            <div>
              <div style={{ position: 'sticky', top: '88px', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '28px' }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', color: '#F5F5F0', fontWeight: 400, marginBottom: '24px' }}>Order Summary</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#5A5A55' }}>Subtotal ({cart?.itemCount} items)</span>
                    <span style={{ color: '#A0A09A' }}>₹{cart?.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  {(cart?.totalDiscount ?? 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#5A5A55' }}>Discount</span>
                      <span style={{ color: '#22c55e' }}>−₹{cart?.totalDiscount?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '15px', color: '#A0A09A', fontWeight: 500 }}>Total</span>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '24px', fontWeight: 600, background: 'linear-gradient(135deg,#C4A24A,#E8C96A 45%,#9A7A2A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    ₹{cart?.finalAmount?.toLocaleString('en-IN')}
                  </span>
                </div>

                <Button variant="gold" size="lg" fullWidth loading={requestMut.isPending}
                  onClick={() => requestMut.mutate()} style={{ gap: '8px' }}>
                  Request Purchase <ArrowRight size={15} />
                </Button>
                <p style={{ fontSize: '11px', color: '#5A5A55', textAlign: 'center', marginTop: '14px', lineHeight: 1.6 }}>
                  Your request will be sent to our team for review and billing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
