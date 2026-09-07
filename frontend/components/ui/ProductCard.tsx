'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Eye } from 'lucide-react';
import { ProductPublic } from '@/types';
import { PriceDisplay, StatusBadge } from '@/components/ui';
import { cn } from '@/utils';
import { stockStatusLabel } from '@/utils';
import { useAuthStore } from '@/lib/store/authStore';
import { cartService } from '@/services';
import { useCartStore } from '@/lib/store/cartStore';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface ProductCardProps {
  product: ProductPublic;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { isAuthenticated } = useAuthStore();
  const { incrementCount } = useCartStore();
  const [adding, setAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isOutOfStock = product.stockStatus === 'OUT_OF_STOCK';
  const hasDiscount = product.discountAmount > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      return;
    }
    if (isOutOfStock) return;

    setAdding(true);
    try {
      await cartService.addItem(product.id, 1);
      incrementCount();
      toast.success(`${product.name} added to cart`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="group"
    >
      <Link href={`/products/${product.id}`} className="block">
        <div className="glass-card rounded-2xl overflow-hidden hover:border-brand-gold/30 transition-all duration-300 hover:shadow-gold-sm">
          {/* Image */}
          <div className="relative aspect-square bg-gradient-to-br from-brand-black-card to-brand-black-border overflow-hidden">
            {product.primaryImageUrl ? (
              <Image
                src={product.primaryImageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-brand-gray/30 text-4xl font-serif">ST</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {hasDiscount && (
                <span className="bg-brand-gold text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  -{Math.round((product.discountAmount / product.sellingPrice) * 100)}%
                </span>
              )}
              {isOutOfStock && (
                <span className="bg-black/80 text-brand-gray/70 text-xs px-2 py-0.5 rounded-full border border-brand-black-border">
                  Out of Stock
                </span>
              )}
              {product.stockStatus === 'LOW_STOCK' && (
                <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">
                  Low Stock
                </span>
              )}
            </div>

            {/* Quick actions overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || adding}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200',
                  isOutOfStock
                    ? 'bg-brand-black-border cursor-not-allowed'
                    : 'bg-brand-gold text-black hover:bg-brand-gold-light hover:scale-110 shadow-gold'
                )}
                aria-label="Add to cart"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
              <Link
                href={`/products/${product.id}`}
                className="w-11 h-11 rounded-full glass-card flex items-center justify-center hover:border-brand-gold/50 hover:scale-110 transition-all duration-200"
                aria-label="View product"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="w-4 h-4 text-brand-white" />
              </Link>
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            {product.brand && (
              <p className="text-xs text-brand-gold tracking-widest uppercase mb-1 font-medium">
                {product.brand}
              </p>
            )}
            <h3 className="font-serif text-base text-brand-white mb-1 line-clamp-1 group-hover:gold-text transition-all duration-200">
              {product.name}
            </h3>
            {product.categoryName && (
              <p className="text-xs text-brand-gray mb-3">{product.categoryName}</p>
            )}
            <PriceDisplay
              effectivePrice={product.effectivePrice}
              sellingPrice={product.sellingPrice}
              discountAmount={product.discountAmount}
              size="sm"
            />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
