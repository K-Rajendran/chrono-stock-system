'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { cartService, purchaseRequestService } from '@/services';
import { Button, QuantitySelector, PriceDisplay, LoadingSpinner, EmptyState } from '@/components/ui';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import { formatCurrency } from '@/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { setItemCount } = useCartStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.get,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (cart) setItemCount(cart.itemCount);
  }, [cart, setItemCount]);

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      cartService.updateItem(productId, quantity),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      setItemCount(data.itemCount);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not update cart'),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => cartService.removeItem(productId),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      setItemCount(data.itemCount);
      toast.success('Item removed');
    },
  });

  const clearMutation = useMutation({
    mutationFn: cartService.clear,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      setItemCount(0);
      toast.success('Cart cleared');
    },
  });

  const requestMutation = useMutation({
    mutationFn: purchaseRequestService.createFromCart,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], { items: [], itemCount: 0, subtotal: 0, totalDiscount: 0, finalAmount: 0 });
      setItemCount(0);
      toast.success('Purchase request created!');
      router.push(`/purchase-requests/${data.id}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not create request'),
  });

  if (!isAuthenticated) return null;
  if (isLoading) return <div className="container-wide py-20"><LoadingSpinner size="lg" /></div>;

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  return (
    <div className="container-wide py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-brand-gold text-xs tracking-[0.4em] uppercase mb-2">Your Selection</p>
          <h1 className="font-serif text-3xl text-brand-white">
            Cart {items.length > 0 && <span className="text-brand-gray text-xl">({items.length})</span>}
          </h1>
        </div>
        {!isEmpty && (
          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      {isEmpty ? (
        <EmptyState
          icon={<ShoppingBag className="w-16 h-16" />}
          title="Your cart is empty"
          description="Discover our collection of handcrafted timepieces and add your favourites."
          action={
            <Link href="/products">
              <Button variant="gold" size="lg">Explore Collection</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-card rounded-2xl p-5 flex gap-5"
                >
                  {/* Image */}
                  <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                    <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-xl overflow-hidden bg-brand-black-border">
                      {item.primaryImageUrl ? (
                        <Image src={item.primaryImageUrl} alt={item.productName}
                          width={112} height={112} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-gray/30 text-2xl font-serif">ST</div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-brand-gold tracking-wider uppercase mb-0.5">{item.brand}</p>
                        <Link href={`/products/${item.productId}`}>
                          <h3 className="font-serif text-brand-white hover:gold-text transition-all">{item.productName}</h3>
                        </Link>
                      </div>
                      <button
                        onClick={() => removeMutation.mutate(item.productId)}
                        disabled={removeMutation.isPending}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-brand-gray hover:text-red-400 transition-colors flex-shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                      <PriceDisplay
                        effectivePrice={item.effectivePrice}
                        sellingPrice={item.sellingPrice}
                        discountAmount={item.discountAmount}
                        size="sm"
                      />
                      <QuantitySelector
                        value={item.quantity}
                        min={1}
                        max={item.stockQuantity}
                        onChange={(v) => updateMutation.mutate({ productId: item.productId, quantity: v })}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-brand-gray">
                        Line total: <span className="text-brand-white font-medium">{formatCurrency(item.lineTotal)}</span>
                      </span>
                      {item.lineDiscount > 0 && (
                        <span className="text-xs text-green-400">-{formatCurrency(item.lineDiscount)} saved</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <Link href="/products" className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-white transition-colors mt-2">
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h2 className="font-serif text-xl text-brand-white mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-gray">Subtotal ({cart?.itemCount} items)</span>
                  <span className="text-brand-white">{formatCurrency(cart?.subtotal ?? 0)}</span>
                </div>
                {(cart?.totalDiscount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-gray">Discount</span>
                    <span className="text-green-400">-{formatCurrency(cart?.totalDiscount ?? 0)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-brand-black-border pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="font-medium text-brand-white">Total</span>
                  <span className="font-serif text-xl gold-text">{formatCurrency(cart?.finalAmount ?? 0)}</span>
                </div>
              </div>

              <Button
                variant="gold"
                size="lg"
                fullWidth
                onClick={() => requestMutation.mutate()}
                loading={requestMutation.isPending}
                className="gap-2"
              >
                Request Purchase <ArrowRight className="w-4 h-4" />
              </Button>

              <p className="text-xs text-brand-gray text-center mt-4 leading-relaxed">
                Your purchase request will be sent to our team via WhatsApp for review and billing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
