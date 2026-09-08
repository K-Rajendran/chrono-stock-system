'use client';

import { Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { productService } from '@/services';
import { ProductCard } from '@/components/ui/ProductCard';
import { SkeletonCard } from '@/components/ui';
import dynamic from 'next/dynamic';

const WatchHero3D = dynamic(() => import('@/components/3d/WatchHero3D'), {
  ssr: false,
  loading: () => (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'160px', height:'160px', borderRadius:'50%', border:'1px solid rgba(184,147,58,0.15)', animation:'pulse-ring 2s ease-out infinite' }} />
    </div>
  ),
});

const FEATURES = [
  { icon: '⌚', title: 'Swiss Movements', desc: 'Certified Swiss calibres in every timepiece.' },
  { icon: '✦', title: 'Hand-Assembled', desc: 'Each watch individually crafted and inspected.' },
  { icon: '◇', title: 'Authenticated', desc: 'Certificate of authenticity with every piece.' },
  { icon: '◎', title: 'Insured Delivery', desc: 'White-glove delivery, fully insured.' },
];

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const contentY   = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const contentOp  = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const canvasY    = useTransform(scrollYProgress, [0, 1], [0, 60]);

  const { data: featured, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: productService.getFeatured,
    staleTime: 5 * 60_000,
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  return (
    <div style={{ background: '#080808', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════
          HERO
          ══════════════════════════════════════ */}
      <section ref={heroRef} style={{
        position: 'relative', height: '100vh', minHeight: '700px',
        display: 'flex', alignItems: 'center', overflow: 'hidden',
        background: 'radial-gradient(ellipse 80% 70% at 65% 40%, rgba(20,14,2,0.9) 0%, #080808 70%)',
      }}>
        {/* Ambient rings */}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', overflow:'hidden' }}>
          {[520, 380, 260].map((s, i) => (
            <div key={s} style={{
              position:'absolute', width:`${s}px`, height:`${s}px`,
              borderRadius:'50%', border:'1px solid rgba(184,147,58,0.06)',
              animation: i === 0 ? 'spin-slow 18s linear infinite' : 'none',
            }} />
          ))}
        </div>

        {/* 3D canvas */}
        <motion.div style={{ y: canvasY, position:'absolute', right:'5%', top:'50%', transform:'translateY(-50%)', width:'500px', height:'500px', opacity:0.9 }} className="hidden lg:block">
          <Suspense fallback={null}><WatchHero3D /></Suspense>
        </motion.div>

        {/* Hero text */}
        <div className="container-wide" style={{ position:'relative', zIndex:2 }}>
          <motion.div style={{ y: contentY, opacity: contentOp }} className="max-w-xl">
            <motion.p initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.7 }}
              style={{ fontSize:'10px', letterSpacing:'0.4em', textTransform:'uppercase', color:'#B8933A', fontWeight:600, marginBottom:'24px' }}>
              Premium Timepieces
            </motion.p>

            <motion.h1 initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35, duration:0.8, ease:[0,0,0.2,1] }}
              style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(40px,6vw,72px)', lineHeight:1.08, color:'#F5F5F0', marginBottom:'28px', fontWeight:400 }}>
              Where Time<br />
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontWeight:300,
                background:'linear-gradient(135deg,#C4A24A 0%,#E8C96A 45%,#9A7A2A 100%)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              }}>Finds Its Soul</span>
            </motion.h1>

            <motion.p initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5, duration:0.7 }}
              style={{ fontSize:'15px', color:'rgba(245,245,240,0.5)', lineHeight:1.8, maxWidth:'400px', marginBottom:'44px' }}>
              Each watch in our collection is a philosophy — handcrafted for those who
              understand that time is not merely measured, it is lived.
            </motion.p>

            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.65, duration:0.7 }}
              style={{ display:'flex', flexWrap:'wrap', gap:'14px', alignItems:'center' }}>
              <Link
                href="/products"
                className="inline-flex h-[50px] items-center gap-[10px] rounded-[12px] px-8
                          bg-gradient-to-br from-[#C4A24A] via-[#E8C96A] to-[#9A7A2A]
                          text-[13px] font-semibold tracking-[0.08em] text-black
                          no-underline shadow-[0_0_24px_rgba(184,147,58,0.3)]
                          transition-all duration-300
                          hover:-translate-y-[1px]
                          hover:opacity-90
                          hover:shadow-[0_4px_30px_rgba(184,147,58,0.45)]"
              >
                Explore Collection <ArrowRight size={15} />
              </Link>
              <Link
                href="/products?categoryId=5"
                className="inline-flex h-[50px] items-center rounded-[12px] px-7
                          border border-[rgba(184,147,58,0.3)]
                          text-[13px] text-[rgba(245,245,240,0.65)]
                          no-underline transition-all duration-300
                          hover:border-[rgba(184,147,58,0.7)]
                          hover:bg-[rgba(184,147,58,0.06)]
                          hover:text-[#F5F5F0]"
              >
                Limited Editions
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{ position:'absolute', bottom:'36px', left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.2)' }}>
          <span style={{ fontSize:'9px', letterSpacing:'0.25em', textTransform:'uppercase' }}>Scroll</span>
          <ChevronDown size={14} />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          QUOTE
          ══════════════════════════════════════ */}
      <section style={{ padding:'72px 0', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'#0A0A0A' }}>
        <div className="container-narrow" style={{ textAlign:'center', maxWidth:'680px', margin:'0 auto', padding:'0 24px' }}>
          <span className="divider-gold" style={{ margin:'0 auto 28px' }} />
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(20px,3vw,32px)', color:'rgba(245,245,240,0.65)', lineHeight:1.65, fontStyle:'italic', fontWeight:300 }}>
            "A watch is not an accessory. It is a philosophy. A discipline. A daily reminder
            that time, once passed, cannot be reclaimed."
          </p>
          <span className="divider-gold" style={{ margin:'28px auto 0' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════
          CATEGORIES
          ══════════════════════════════════════ */}
      {categories && categories.length > 0 && (
        <section className="section" style={{ background:'#080808' }}>
          <div className="container-wide">
            <div style={{ textAlign:'center', marginBottom:'52px' }}>
              <p style={{ fontSize:'10px', letterSpacing:'0.4em', textTransform:'uppercase', color:'#B8933A', fontWeight:600, marginBottom:'12px' }}>Browse By Style</p>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(28px,3.5vw,42px)', color:'#F5F5F0', fontWeight:400 }}>Our Collections</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'14px' }}>
              {categories.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.07 }} viewport={{ once:true }}>
                    <Link
                      href={`/products?categoryId=${cat.id}`}
                      className="block rounded-2xl p-7 text-center
                                border border-[rgba(255,255,255,0.07)]
                                bg-[#141414] no-underline
                                transition-all duration-300
                                hover:-translate-y-[3px]
                                hover:border-[rgba(184,147,58,0.4)]
                                hover:bg-[rgba(184,147,58,0.05)]"
                    >
                    <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'rgba(184,147,58,0.1)', border:'1px solid rgba(184,147,58,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:'20px' }}>⌚</div>
                    <p style={{ fontFamily:"'Playfair Display',serif", fontSize:'13px', color:'rgba(245,245,240,0.8)', fontWeight:400 }}>{cat.name}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          FEATURED
          ══════════════════════════════════════ */}
      <section className="section" style={{ background:'#0A0A0A', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div className="container-wide">
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-end', justifyContent:'space-between', gap:'16px', marginBottom:'52px' }}>
            <div>
              <p style={{ fontSize:'10px', letterSpacing:'0.4em', textTransform:'uppercase', color:'#B8933A', fontWeight:600, marginBottom:'12px' }}>New Arrivals</p>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(28px,3.5vw,42px)', color:'#F5F5F0', fontWeight:400 }}>Featured Timepieces</h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2
                        text-[13px] text-[#B8933A]
                        no-underline transition-all duration-200
                        hover:gap-3"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'20px' }}>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : featured?.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
          ══════════════════════════════════════ */}
      <section style={{ padding:'72px 0', background:'#080808', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div className="container-wide">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'40px' }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once:true }}
                style={{ textAlign:'center' }}>
                <div style={{ fontSize:'26px', marginBottom:'16px' }}>{f.icon}</div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'16px', color:'#F5F5F0', fontWeight:400, marginBottom:'8px' }}>{f.title}</h3>
                <p style={{ fontSize:'13px', color:'#5A5A55', lineHeight:1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
          ══════════════════════════════════════ */}
      <section style={{
        padding:'96px 0', position:'relative', overflow:'hidden',
        background:'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(20,12,0,0.95) 0%, #080808 70%)',
        borderTop:'1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
          <div style={{ width:'400px', height:'400px', borderRadius:'50%', border:'1px solid rgba(184,147,58,0.08)', animation:'pulse-ring 3s ease-out infinite' }} />
        </div>
        <div className="container-wide" style={{ position:'relative', zIndex:1, textAlign:'center' }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.7 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(32px,4vw,54px)', color:'#F5F5F0', fontWeight:400, lineHeight:1.15, marginBottom:'20px' }}>
              Your Perfect Watch{' '}
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontWeight:300,
                background:'linear-gradient(135deg,#C4A24A,#E8C96A 45%,#9A7A2A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              }}>Awaits</span>
            </h2>
            <p style={{ fontSize:'15px', color:'rgba(245,245,240,0.4)', maxWidth:'480px', margin:'0 auto 44px', lineHeight:1.75 }}>
              Every collection tells a different story. Discover the timepiece that speaks yours.
            </p>
            <Link
              href="/products"
              className="inline-flex h-[54px] items-center gap-3 rounded-[14px] px-10
                        bg-gradient-to-br from-[#C4A24A] via-[#E8C96A] to-[#9A7A2A]
                        text-[13px] font-semibold tracking-[0.08em] text-black
                        no-underline
                        shadow-[0_0_32px_rgba(184,147,58,0.35)]
                        transition-all duration-300
                        hover:-translate-y-[2px]
                        hover:shadow-[0_6px_40px_rgba(184,147,58,0.5)]
                        hover:opacity-90"
            >
              Shop Collection <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
