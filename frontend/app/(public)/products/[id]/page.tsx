'use client';

import { useState } from 'react';
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { productService, cartService } from '@/services';
import { ProductCard } from '@/components/ui/ProductCard';
import { PriceDisplay, QuantitySelector, LoadingSpinner, Button } from '@/components/ui';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import { cn, stockStatusLabel } from '@/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Props { params: { id: string } }

export default function ProductDetailPage({ params }: Props) {
  const id = Number(params.id);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { incrementCount } = useCartStore();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });

  const { data: related } = useQuery({
    queryKey: ['related', id, product?.categoryId],
    queryFn: () => productService.getRelated(id, product?.categoryId ?? undefined),
    enabled: !!product?.categoryId,
  });

  if (isLoading) return (
    <div className="container-wide py-20"><LoadingSpinner size="lg" /></div>
  );

  if (!product) return notFound();

  const images = product.imageUrls?.length
    ? product.imageUrls
    : product.primaryImageUrl ? [product.primaryImageUrl] : [];

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add to cart');
      router.push('/login');
      return;
    }
    if (product.stockStatus === 'OUT_OF_STOCK') return;

    setAdding(true);
    try {
      await cartService.addItem(product.id, qty);
      for (let i = 0; i < qty; i++) incrementCount();
      toast.success(`${product.name} added to cart`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  const stockIcon = {
    IN_STOCK: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    LOW_STOCK: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
    OUT_OF_STOCK: <XCircle className="w-4 h-4 text-red-400" />,
  }[product.stockStatus];

  const stockColor = {
    IN_STOCK: 'text-green-400',
    LOW_STOCK: 'text-yellow-400',
    OUT_OF_STOCK: 'text-red-400',
  }[product.stockStatus];

  const specs = [
    { label: 'Movement', value: product.movement },
    { label: 'Case Material', value: product.caseMaterial },
    { label: 'Strap Material', value: product.strapMaterial },
    { label: 'Case Diameter', value: product.caseDiameterMm ? `${product.caseDiameterMm}mm` : null },
    { label: 'Dial Color', value: product.dialColor },
    { label: 'Water Resistance', value: product.waterResistance },
    { label: 'Glass', value: product.glassType },
    { label: 'Style', value: product.genderStyle },
    { label: 'Warranty', value: product.warrantyMonths ? `${product.warrantyMonths} months` : null },
    { label: 'SKU', value: product.sku },
  ].filter((s) => s.value);

  return (
    <div className="container-wide py-8">
      {/* Breadcrumb */}
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Collection
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
        {/* Left — Image Gallery */}
        <div className="space-y-4">
          <motion.div
            key={activeImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-brand-black-card to-brand-black-border"
          >
            {images[activeImage] ? (
              <Image
                src={images[activeImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-brand-gray/30 text-6xl font-serif">ST</span>
              </div>
            )}

            {/* Discount badge */}
            {product.discountAmount > 0 && (
              <div className="absolute top-4 left-4 bg-brand-gold text-black text-sm font-bold px-3 py-1 rounded-full">
                -{Math.round((product.discountAmount / product.sellingPrice) * 100)}% OFF
              </div>
            )}
          </motion.div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all',
                    i === activeImage ? 'border-brand-gold' : 'border-brand-black-border hover:border-brand-gold/40'
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} width={80} height={80} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — Info */}
        <div className="space-y-6">
          {product.brand && (
            <p className="text-brand-gold text-xs tracking-[0.4em] uppercase font-medium">{product.brand}</p>
          )}

          <div>
            <h1 className="font-serif text-3xl lg:text-4xl text-brand-white mb-2">{product.name}</h1>
            {product.categoryName && (
              <span className="inline-block text-xs text-brand-gray border border-brand-black-border rounded-full px-3 py-1">
                {product.categoryName}
              </span>
            )}
          </div>

          <div className="brand-divider !mx-0 !w-full" />

          {/* Price */}
          <PriceDisplay
            effectivePrice={product.effectivePrice}
            sellingPrice={product.sellingPrice}
            discountAmount={product.discountAmount}
            size="lg"
          />

          {/* Stock */}
          <div className={cn('flex items-center gap-2 text-sm font-medium', stockColor)}>
            {stockIcon}
            <span>{stockStatusLabel(product.stockStatus)}</span>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-brand-white/70 text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Add to cart */}
          {product.stockStatus !== 'OUT_OF_STOCK' && (
            <div className="flex items-center gap-4 flex-wrap">
              <QuantitySelector value={qty} min={1} max={99} onChange={setQty} />
              <Button
                variant="gold"
                size="lg"
                onClick={handleAddToCart}
                loading={adding}
                className="flex-1 min-w-[180px]"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </Button>
            </div>
          )}

          {product.stockStatus === 'OUT_OF_STOCK' && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              This timepiece is currently out of stock. Contact us to join the waitlist.
            </div>
          )}

          {/* Specifications */}
          {specs.length > 0 && (
            <div>
              <h3 className="font-serif text-lg text-brand-white mb-4">Specifications</h3>
              <div className="grid grid-cols-1 gap-2">
                {specs.map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-3 py-2.5 border-b border-brand-black-border last:border-0">
                    <span className="text-xs text-brand-gray uppercase tracking-wider font-medium w-32 flex-shrink-0 pt-0.5">{label}</span>
                    <span className="text-sm text-brand-white/80">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Watches */}
      {related && related.length > 0 && (
        <div className="mt-20">
          <div className="mb-10">
            <p className="text-brand-gold text-xs tracking-[0.4em] uppercase mb-2">You May Also Like</p>
            <h2 className="font-serif text-2xl text-brand-white">Related Timepieces</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
