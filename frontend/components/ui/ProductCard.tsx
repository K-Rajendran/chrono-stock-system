'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Eye } from 'lucide-react';
import { ProductPublic } from '@/types';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import { cartService } from '@/services';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface Props {
  product: ProductPublic;
  index?: number;
}

export function ProductCard({ product: p, index = 0 }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { incrementCount } = useCartStore();
  const [adding, setAdding] = useState(false);

  const outOfStock = p.stockStatus === 'OUT_OF_STOCK';

  const hasDiscount = (p.discountAmount ?? 0) > 0;

  const discPct =
    hasDiscount && p.sellingPrice > 0
      ? Math.round((p.discountAmount / p.sellingPrice) * 100)
      : 0;

  const handleAdd = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Sign in to add to cart');
      return;
    }

    if (outOfStock || adding) return;

    setAdding(true);

    try {
      await cartService.addItem(p.id, 1);
      incrementCount();
      toast.success(`${p.name} added to cart`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Could not add to cart'
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.45,
        ease: [0, 0, 0.2, 1],
      }}
      className="product-card"
    >
      <div className="product-card-shell">
        {/* Product image / main link */}
        <Link
          href={`/products/${p.id}`}
          className="product-card-main-link group block"
          aria-label={`View ${p.name}`}
        >
          <div
            style={{
              position: 'relative',
              aspectRatio: '1',
              background:
                'linear-gradient(145deg,#1a1a1a,#111)',
              overflow: 'hidden',
            }}
          >
            {p.primaryImageUrl ? (
              <Image
                src={p.primaryImageUrl}
                alt={p.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw"
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: '32px',
                    color: 'rgba(255,255,255,0.06)',
                  }}
                >
                  ST
                </span>
              </div>
            )}

            {/* Top badges */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                zIndex: 2,
              }}
            >
              {hasDiscount && (
                <span
                  style={{
                    background: '#B8933A',
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '100px',
                    letterSpacing: '0.05em',
                  }}
                >
                  −{discPct}%
                </span>
              )}

              {p.stockStatus === 'LOW_STOCK' && (
                <span
                  style={{
                    background: 'rgba(234,179,8,0.15)',
                    color: '#fbbf24',
                    fontSize: '10px',
                    fontWeight: 500,
                    padding: '3px 8px',
                    borderRadius: '100px',
                    border: '1px solid rgba(234,179,8,0.3)',
                  }}
                >
                  Low Stock
                </span>
              )}

              {outOfStock && (
                <span
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '100px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  Sold Out
                </span>
              )}
            </div>

            {/* Hover action overlay */}
            <div className="product-card-overlay">
              {/* Add to cart */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={outOfStock || adding}
                className={`product-card-action ${
                  outOfStock ? 'is-disabled' : ''
                }`}
                aria-label={
                  outOfStock
                    ? 'Product is out of stock'
                    : 'Add to cart'
                }
              >
                <ShoppingBag
                  style={{
                    width: '18px',
                    height: '18px',
                  }}
                />
              </button>

              {/* View product */}
              <Link
                href={`/products/${p.id}`}
                className="product-card-action product-card-view"
                aria-label="View product"
              >
                <Eye
                  style={{
                    width: '18px',
                    height: '18px',
                    color: '#fff',
                  }}
                />
              </Link>
            </div>
          </div>

          {/* Product information */}
          <div style={{ padding: '16px 18px 18px' }}>
            {p.brand && (
              <p
                style={{
                  fontSize: '10px',
                  color: '#B8933A',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                {p.brand}
              </p>
            )}

            <h3
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: '15px',
                color: '#F5F5F0',
                marginBottom: '3px',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s ease',
              }}
              className="group-hover:text-gold"
            >
              {p.name}
            </h3>

            {p.categoryName && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#5A5A55',
                  marginBottom: '12px',
                }}
              >
                {p.categoryName}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: '17px',
                  fontWeight: 600,
                  background:
                    'linear-gradient(135deg,#C4A24A,#E8C96A 45%,#9A7A2A)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                ₹{p.effectivePrice.toLocaleString('en-IN')}
              </span>

              {hasDiscount && (
                <span
                  style={{
                    fontSize: '12px',
                    color: '#5A5A55',
                    textDecoration: 'line-through',
                  }}
                >
                  ₹{p.sellingPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </motion.article>
  );
}

export default ProductCard;
