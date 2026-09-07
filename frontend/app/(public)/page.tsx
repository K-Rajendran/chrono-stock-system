'use client';

import { useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { productService } from '@/services';
import { ProductCard } from '@/components/ui/ProductCard';
import { SkeletonCard } from '@/components/ui';
import dynamic from 'next/dynamic';

// Lazy-load the 3D hero to avoid blocking initial render
const WatchHero3D = dynamic(() => import('@/components/3d/WatchHero3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-40 h-40 rounded-full border border-brand-gold/20 animate-pulse-gold" />
    </div>
  ),
});

const features = [
  { icon: '⌚', title: 'Swiss Movements', desc: 'Every timepiece powered by certified Swiss movements.' },
  { icon: '💎', title: 'Handcrafted', desc: 'Individually assembled by master watchmakers.' },
  { icon: '🔒', title: 'Authenticated', desc: 'Each piece comes with a certificate of authenticity.' },
  { icon: '🚚', title: 'Insured Delivery', desc: 'White-glove delivery with full insurance.' },
];

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const { data: featured, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: productService.getFeatured,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  return (
    <div className="overflow-x-hidden">
      {/* ═══════════════════════════════════════════
          HERO — Cinematic full-viewport
         ═══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, #1a1200 0%, #0A0A0A 65%)' }}
      >
        {/* Ambient rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full border border-brand-gold/5 animate-spin-slow" />
          <div className="absolute w-[450px] h-[450px] rounded-full border border-brand-gold/8" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-brand-gold/12" />
        </div>

        {/* 3D Watch Canvas — right side on desktop, center on mobile */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-24"
        >
          <div className="w-[380px] h-[380px] lg:w-[540px] lg:h-[540px] opacity-80 lg:opacity-100">
            <Suspense fallback={null}>
              <WatchHero3D />
            </Suspense>
          </div>
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 container-wide grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-xl"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-brand-gold text-xs tracking-[0.4em] uppercase font-medium mb-6"
            >
              Premium Timepieces
            </motion.p>

            <h1 className="font-serif text-5xl lg:text-7xl leading-[1.05] text-brand-white mb-6">
              Where Time{' '}
              <span className="block gold-text italic font-display">Finds Its Soul</span>
            </h1>

            <p className="text-brand-white/60 text-lg leading-relaxed mb-10 max-w-sm">
              Each watch in our collection is a statement — handcrafted for those who
              understand that time is not just measured, it is lived.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 h-13 px-8 bg-brand-gold text-black font-medium rounded-xl hover:bg-brand-gold-light transition-all duration-200 shadow-gold hover:shadow-gold hover:scale-[1.02]"
              >
                Explore Collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/products?categoryId=5"
                className="inline-flex items-center gap-2 h-13 px-8 border border-brand-gold/40 text-brand-white rounded-xl hover:bg-brand-gold/10 hover:border-brand-gold transition-all duration-200"
              >
                Limited Editions
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-brand-white/30"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          BRAND STATEMENT
         ═══════════════════════════════════════════ */}
      <section className="section-padding border-y border-brand-black-border bg-brand-black-soft">
        <div className="container-narrow text-center max-w-3xl mx-auto px-4">
          <div className="brand-divider mb-8" />
          <p className="font-display text-2xl lg:text-4xl text-brand-white/80 leading-relaxed italic">
            "A watch is not an accessory. It is a philosophy. A discipline. A daily reminder
            that time, once passed, cannot be reclaimed."
          </p>
          <div className="brand-divider mt-8" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CATEGORIES
         ═══════════════════════════════════════════ */}
      {categories && categories.length > 0 && (
        <section className="section-padding">
          <div className="container-wide">
            <div className="text-center mb-14">
              <p className="text-brand-gold text-xs tracking-[0.4em] uppercase mb-3">Browse By</p>
              <h2 className="font-serif text-3xl lg:text-4xl text-brand-white">Our Collections</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href={`/products?categoryId=${cat.id}`}
                    className="group glass-card rounded-2xl p-6 flex flex-col items-center text-center hover:border-brand-gold/30 hover:bg-brand-gold/5 transition-all duration-300 block"
                  >
                    <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center mb-3 group-hover:bg-brand-gold/20 transition-colors">
                      <span className="text-brand-gold text-xl">⌚</span>
                    </div>
                    <h3 className="font-serif text-brand-white text-sm font-medium group-hover:gold-text transition-all duration-200">
                      {cat.name}
                    </h3>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          FEATURED WATCHES
         ═══════════════════════════════════════════ */}
      <section className="section-padding bg-brand-black-soft">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
            <div>
              <p className="text-brand-gold text-xs tracking-[0.4em] uppercase mb-3">New Arrivals</p>
              <h2 className="font-serif text-3xl lg:text-4xl text-brand-white">Featured Timepieces</h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm text-brand-gold hover:text-brand-gold-light transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : featured?.slice(0, 4).map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURES / TRUST SECTION
         ═══════════════════════════════════════════ */}
      <section className="section-padding border-t border-brand-black-border">
        <div className="container-wide">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-serif text-brand-white text-lg mb-2">{f.title}</h3>
                <p className="text-brand-gray text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA BANNER
         ═══════════════════════════════════════════ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1200 0%, #0A0A0A 50%, #1a0800 100%)' }}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-brand-gold animate-pulse-gold" />
        </div>
        <div className="container-wide relative z-10 text-center">
          <h2 className="font-serif text-4xl lg:text-5xl text-brand-white mb-6">
            Your Perfect Watch{' '}
            <span className="gold-text italic font-display">Awaits</span>
          </h2>
          <p className="text-brand-white/60 text-lg max-w-xl mx-auto mb-10">
            Every collection tells a different story. Find the timepiece that speaks yours.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-3 h-14 px-10 bg-brand-gold text-black font-medium text-lg rounded-xl hover:bg-brand-gold-light transition-all duration-200 shadow-gold hover:scale-[1.02]"
          >
            Shop Collection <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
