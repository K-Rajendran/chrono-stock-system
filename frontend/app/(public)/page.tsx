'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Category { id: number; name: string; description: string; imageUrl: string | null; }
interface Product { id: number; name: string; brand: string; description: string; effectivePrice: number; primaryImageUrl: string | null; categoryName: string | null; }
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

// ── Animated ambient ring ──────────────────────────────────────────
function AmbientRing({ size = 300, color = 'var(--blue-accent)', delay = '0s', opacity = 0.08 }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `1px solid ${color}`,
        opacity,
        animation: `pulse-ring 4s ease-in-out infinite ${delay}`,
        pointerEvents: 'none',
      }}
    />
  );
}

// ── Category card ──────────────────────────────────────────────────
function CategoryCard({ category }: { category: Category }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/products?categoryId=${category.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px',
        background: hovered ? 'rgba(13, 32, 64, 0.9)' : 'rgba(8, 20, 40, 0.6)',
        border: `1px solid ${hovered ? 'rgba(61,143,212,0.4)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all var(--transition)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        backdropFilter: 'blur(10px)',
        boxShadow: hovered ? '0 8px 32px rgba(61,143,212,0.12)' : 'none',
        textDecoration: 'none',
      }}
    >
      <div style={{ width: 76, height: 76, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(61,143,212,.24), rgba(201,168,76,.18))', marginBottom: '12px', border: '1px solid var(--border)' }}>
        {category.imageUrl && <img src={category.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '15px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '4px',
        }}
      >
        {category.name}
      </span>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', minHeight: '18px' }}>{category.description || 'Explore collection'}</span>
      <span
        style={{
        marginTop: '10px',
          fontSize: '12px',
          color: hovered ? 'var(--blue-bright)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'color var(--transition)',
          fontWeight: '500',
        }}
      >
        Shop Now →
      </span>
    </Link>
  );
}

// ── Feature badge ──────────────────────────────────────────────────
function FeatureBadge({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        background: 'rgba(8, 20, 40, 0.5)',
        border: '1px solid var(--border)',
        borderRadius: '40px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>
      </div>
    </div>
  );
}

// ── Product card ──────────────────────────────────────────────────
function FeaturedProductCard({ product, tag }: { product: Product; tag?: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(13, 32, 64, 0.9)' : 'rgba(8, 20, 40, 0.7)',
        border: `1px solid ${hovered ? 'rgba(61,143,212,0.35)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'all var(--transition)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(61,143,212,0.08)' : 'var(--shadow-sm)',
      }}
    >
      {/* Image placeholder */}
      <div
        style={{
          height: '240px',
          background: 'linear-gradient(135deg, #0d1f3c 0%, #152a4e 50%, #0a1628 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {product.primaryImageUrl && <img src={product.primaryImageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        {tag && (
          <span
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '4px 10px',
              background: 'var(--gold-gradient)',
              color: '#000',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.08em',
              borderRadius: '12px',
            }}
          >
            {tag}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '20px' }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: '700',
            background: 'var(--gold-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {money(product.effectivePrice)}
        </div>
      </div>
    </div>
  );
}

// ── Main HomePage ──────────────────────────────────────────────────
export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrival, setNewArrival] = useState<Product | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => setVideoError(true));
    }
  }, []);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    Promise.all([
      fetch(`${base}/api/categories`).then(r => r.ok ? r.json() : []),
      fetch(`${base}/api/products/featured`).then(r => r.ok ? r.json() : []),
      fetch(`${base}/api/products?page=0&size=1&sortBy=createdAt&sortDir=desc`).then(r => r.ok ? r.json() : { content: [] }),
    ]).then(([categoryData, featuredData, arrivals]) => {
      setCategories(categoryData);
      setFeatured(featuredData);
      setNewArrival(arrivals.content?.[0] ?? null);
    }).catch(() => undefined);
  }, []);

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.08; }
          50% { transform: scale(1.08); opacity: 0.16; }
        }
        @keyframes float-watch {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-12px) rotate(-1deg); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .hero-badge {
          animation: fade-in-up 0.7s ease both;
        }
        .hero-title {
          animation: fade-in-up 0.7s 0.15s ease both;
        }
        .hero-sub {
          animation: fade-in-up 0.7s 0.3s ease both;
        }
        .hero-cta {
          animation: fade-in-up 0.7s 0.45s ease both;
        }
        .hero-features {
          animation: fade-in-up 0.7s 0.6s ease both;
        }
      `}</style>

      {/* ── HERO SECTION ── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'var(--bg-base)',
        }}
      >
        {/* Video background */}
        {!videoError ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoError(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.25,
              filter: 'saturate(0.6) hue-rotate(200deg)',
            }}
          >
            <source src="/images/products/hero-watch.webm" type="video/webm" />
          </video>
        ) : (
          /* Fallback gradient bg */
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse 80% 80% at 60% 50%, rgba(224, 228, 235, 0) 0%, var(--bg-base) 100%)',
            }}
          />
        )}

        {/* Overlay gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(4,8,15,0.95) 0%, rgba(105, 117, 137, 0) 50%, rgba(241, 241, 242, 0.16) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Ambient rings */}
        <div
          style={{
            position: 'absolute',
            right: '15%',
            top: '50%',
            transform: 'translate(50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AmbientRing size={500} color="var(--blue-accent)" delay="0s" opacity={0.06} />
          <AmbientRing size={350} color="var(--gold)" delay="1.5s" opacity={0.08} />
          <AmbientRing size={200} color="var(--blue-bright)" delay="0.75s" opacity={0.1} />
        </div>

        {/* Decorative watch illustration */}
        {/* <div
          style={{
            position: 'absolute',
            right: '8%',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '420px',
            height: '420px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'float-watch 6s ease-in-out infinite',
            pointerEvents: 'none',
          }}
          className="hero-watch-float"
        >
          <div
            style={{
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #152a4e 0%, #0a1628 60%, #04080f 100%)',
              border: '2px solid rgba(61,143,212,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 60px rgba(61,143,212,0.12), 0 0 120px rgba(61,143,212,0.06)',
              fontSize: '100px',
            }}
          >
            🐒
          </div>
        </div> */}

        {/* Hero content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '120px 24px 80px',
            width: '100%',
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            {/* Eyebrow */}
            <div
              className="hero-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 16px',
                background: 'rgba(61,143,212,0.1)',
                border: '1px solid rgba(61,143,212,0.25)',
                borderRadius: '20px',
                marginBottom: '28px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--blue-bright)',
                  boxShadow: '0 0 8px var(--blue-bright)',
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--blue-bright)',
                }}
              >
                Premium Timepieces
              </span>
            </div>

            {/* Headline */}
            <h1
              className="hero-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                fontWeight: '300',
                lineHeight: 1.05,
                color: 'var(--text-primary)',
                marginBottom: '24px',
                letterSpacing: '-0.01em',
              }}
            >
              Where Time
              <br />
              <span
                style={{
                  background: 'var(--gold-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontStyle: 'italic',
                  fontWeight: '600',
                }}
              >
                Finds Its Soul.
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="hero-sub"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                maxWidth: '460px',
                marginBottom: '44px',
              }}
            >
              Smart. Sleek. Timeless. Discover our curated collection of luxury watches crafted for those who understand that true elegance is measured in moments.
            </p>

            {/* CTAs */}
            <div
              className="hero-cta"
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '60px',
              }}
            >
              <Link
                href="/products"
                style={{
                  padding: '14px 32px',
                  background: 'var(--gold-gradient)',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '14px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  borderRadius: '40px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-gold)',
                  transition: 'transform var(--transition), box-shadow var(--transition)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-2px)';
                  el.style.boxShadow = '0 8px 30px rgba(201,168,76,0.35)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'var(--shadow-gold)';
                }}
              >
                Shop Now →
              </Link>

              {/* <Link
                href="/products"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'color var(--transition)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ▶
                </span>
                Watch Collection
              </Link> */}
            </div>

            {/* Feature badges */}
            <div
              className="hero-features"
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <FeatureBadge icon="✦" label="Premium" sub="Craftsmanship" />
              {/* <FeatureBadge icon="🛡" label="Warranty" sub="1 Year" /> */}
              <FeatureBadge icon="💎" label="Authentic" sub="Certified" />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            opacity: 0.5,
          }}
        >
          <div
            style={{
              width: '24px',
              height: '40px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '6px',
            }}
          >
            <div
              style={{
                width: '3px',
                height: '8px',
                background: 'var(--blue-accent)',
                borderRadius: '2px',
                animation: 'float-watch 1.5s ease-in-out infinite',
              }}
            />
          </div>
          <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scroll</span>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .hero-watch-float { display: none !important; }
          }
        `}</style>
      </section>

      {/* ── SHOP BY CATEGORY ── */}
      <section style={{ padding: '100px 24px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '56px',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--blue-bright)',
                  marginBottom: '10px',
                }}
              >
                Browse by Style
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                }}
              >
                Shop By Category
              </h2>
            </div>
            <Link
              href="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                transition: 'all var(--transition)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = 'var(--text-primary)';
                el.style.borderColor = 'var(--border-active)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = 'var(--text-secondary)';
                el.style.borderColor = 'var(--border)';
              }}
            >
              View All Categories →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px',
            }}
          >
            {categories.map(category => <CategoryCard key={category.id} category={category} />)}
          </div>
        </div>
      </section>

      {/* ── FEATURED WATCHES ── */}
      <section style={{ padding: '100px 24px', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>
              Curated Selection
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '16px',
              }}
            >
              Featured Timepieces
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '480px', margin: '0 auto' }}>
              Handpicked from our exclusive collection — each piece a testament to precision.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            {featured.slice(0, 4).map((product, index) => (
              <Link key={product.id} href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                <FeaturedProductCard product={product} tag={index === 0 ? 'FEATURED' : undefined} />
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link
              href="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 36px',
                background: 'transparent',
                border: '1px solid var(--border-active)',
                borderRadius: '40px',
                color: 'var(--text-primary)',
                fontWeight: '500',
                fontSize: '14px',
                letterSpacing: '0.04em',
                textDecoration: 'none',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(61,143,212,0.1)';
                el.style.borderColor = 'var(--blue-accent)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'transparent';
                el.style.borderColor = 'var(--border-active)';
              }}
            >
              Explore Full Collection →
            </Link>
          </div>
        </div>
      </section>

      {/* ── NEW ARRIVAL SPOTLIGHT ── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(10,22,40,0.8) 0%, rgba(13,32,64,0.9) 100%)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              minHeight: '360px',
            }}
          >
            {/* Left: watch display */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
                background: 'radial-gradient(ellipse at center, rgba(61,143,212,0.08) 0%, transparent 70%)',
                position: 'relative',
                minHeight: '300px',
              }}
            >
               <AmbientRing size={220} color="var(--gold)" delay="0s" opacity={0.12} />
               {newArrival?.primaryImageUrl && <img src={newArrival.primaryImageUrl} alt={newArrival.name} style={{ width: '100%', height: '100%', maxHeight: 320, objectFit: 'contain', zIndex: 1, padding: '20px' }} />}
            </div>

            {/* Right: text */}
            <div style={{ padding: '48px 48px 48px 0' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                  marginBottom: '20px',
                }}
              >
                New Arrival
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  lineHeight: 1.15,
                  marginBottom: '16px',
                }}
              >
                 {newArrival?.name ?? 'Fresh additions.'}{' '}
                <span
                  style={{
                    background: 'var(--gold-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontStyle: 'italic',
                  }}
                >
                 Just arrived.
                </span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', marginBottom: '32px', maxWidth: '340px' }}>
                 {newArrival?.description ?? 'Discover the latest timepieces added to the AFINO collection.'}
              </p>
              <Link
                 href={newArrival ? `/products/${newArrival.id}` : '/products'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 28px',
                  background: 'var(--gold-gradient)',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  borderRadius: '30px',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-gold)',
                  transition: 'transform var(--transition)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                 View New Arrival →
              </Link>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            section > div > div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* ── TRUST SECTION ── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '32px',
              textAlign: 'center',
            }}
          >
            {[
              { icon: '🏅', title: 'Authentic Pieces', desc: 'Every watch verified and certified' },
              { icon: '📦', title: 'Secure Packaging', desc: 'Premium presentation on delivery' },
              { icon: '🔧', title: '1 Year Warranty', desc: 'Service & repair coverage' },
              { icon: '💬', title: 'WhatsApp Support', desc: 'Direct line to our experts' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ padding: '32px 20px' }}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{icon}</div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
