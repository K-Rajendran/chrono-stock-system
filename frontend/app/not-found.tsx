import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '80px', marginBottom: '24px', lineHeight: 1 }}>⌚</div>
      <p style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--blue-bright)', marginBottom: '12px' }}>
        404
      </p>
      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        fontWeight: '700',
        color: 'var(--text-primary)',
        marginBottom: '16px',
      }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '380px', lineHeight: '1.7', marginBottom: '36px' }}>
        This moment in time doesn't seem to exist. Let's get you back on track.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={{
          padding: '13px 28px',
          background: 'var(--gold-gradient)',
          color: '#000',
          fontWeight: '700',
          fontSize: '14px',
          borderRadius: '40px',
          textDecoration: 'none',
          boxShadow: 'var(--shadow-gold)',
        }}>
          Back to Home
        </Link>
        <Link href="/products" style={{
          padding: '13px 28px',
          background: 'transparent',
          border: '1px solid var(--border-active)',
          color: 'var(--text-primary)',
          fontSize: '14px',
          borderRadius: '40px',
          textDecoration: 'none',
        }}>
          Browse Collection
        </Link>
      </div>
    </div>
  );
}
