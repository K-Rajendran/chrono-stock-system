'use client';

import Link from 'next/link';

const COLLECTIONS = [
  { id: 'luxury', name: 'Luxury Collection', desc: 'The pinnacle of horology — hand-assembled precision for the discerning collector.', emoji: '👑' },
  { id: 'sport', name: 'Sport Collection', desc: 'Built for performance. Engineered for adventure. Styled for life.', emoji: '🏆' },
  { id: 'classic', name: 'Classic Collection', desc: 'Timeless designs that transcend trends. A companion for generations.', emoji: '⌚' },
  { id: 'minimalist', name: 'Minimalist Collection', desc: 'Where simplicity is the ultimate sophistication.', emoji: '◯' },
  { id: 'limited', name: 'Limited Editions', desc: 'Exclusive pieces crafted in small numbers for those who seek the extraordinary.', emoji: '✦' },
];

export default function CollectionsPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 24px 80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--blue-bright)', marginBottom: '12px' }}>
          Curated For You
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '16px',
        }}>
          Our Collections
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.7' }}>
          Each collection tells a unique story. Find the timepiece that speaks to yours.
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '24px',
      }}>
        {COLLECTIONS.map((col) => (
          <Link
            key={col.id}
            href={`/products?category=${col.id}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '36px 32px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              textDecoration: 'none',
              transition: 'all var(--transition)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = 'rgba(61,143,212,0.4)';
              el.style.transform = 'translateY(-4px)';
              el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = 'var(--border)';
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = 'none';
            }}
          >
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: '120px', height: '120px',
              background: 'radial-gradient(circle at top right, rgba(61,143,212,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <span style={{ fontSize: '40px', marginBottom: '20px' }}>{col.emoji}</span>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '12px',
            }}>
              {col.name}
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              lineHeight: '1.7',
              flex: 1,
            }}>
              {col.desc}
            </p>
            <div style={{
              marginTop: '24px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--blue-bright)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              Explore Collection →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
