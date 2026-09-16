import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 24px 80px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--blue-bright)', marginBottom: '14px' }}>Our Story</p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px', lineHeight: 1.1 }}>
          Where Time Finds{' '}
          <span style={{ fontStyle: 'italic', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Its Soul</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '17px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.8' }}>
          AFINO was founded with a singular belief: that a watch is not merely a timekeeper, but a companion for life's most meaningful moments.
        </p>
      </div>

      {/* Story sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
        {[
          {
            title: 'Our Beginning',
            text: 'Born from a passion for horology and a deep appreciation for timeless craftsmanship, AFINO emerged as a destination for those who understand that the finest watches deserve to be worn, not locked away. We curate each piece with care, selecting only timepieces that meet our exacting standards of quality, design, and heritage.',
            icon: '⌚',
          },
          {
            title: 'Our Philosophy',
            text: 'We believe luxury should be personal. Every watch in our collection is chosen not just for its technical excellence, but for the story it tells. We work closely with our clients to match them with pieces that resonate with their character, their style, and their life.',
            icon: '✦',
          },
          {
            title: 'Our Promise',
            text: 'Every timepiece that passes through our hands is authenticated, inspected, and verified. We stand behind every sale with our signature service, comprehensive warranty, and the promise that your investment is protected for years to come.',
            icon: '🛡',
          },
        ].map(({ title, text, icon }) => (
          <div key={title} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '60px', alignItems: 'center' }}>
            <div style={{
              aspectRatio: '1',
              background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--ocean-mid) 100%)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
            }}>
              {icon}
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>{title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.8' }}>{text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: '80px', padding: '60px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>Ready to Find Your Timepiece?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px' }}>Explore our curated collection and discover the watch that speaks to you.</p>
        <Link href="/products" style={{ display: 'inline-block', padding: '14px 32px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '14px', borderRadius: '40px', textDecoration: 'none', boxShadow: 'var(--shadow-gold)' }}>
          Browse Collection →
        </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 2fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
