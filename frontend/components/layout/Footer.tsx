import Link from 'next/link';

const LINKS = {
  collections: [
    { label: 'Luxury', href: '/products?categoryId=1' },
    { label: 'Sport', href: '/products?categoryId=2' },
    { label: 'Classic', href: '/products?categoryId=3' },
    { label: 'Smart', href: '/products?categoryId=4' },
    { label: 'Limited Edition', href: '/products?categoryId=5' },
  ],
  account: [
    { label: 'My Account', href: '/account' },
    { label: 'My Orders', href: '/account' },
    { label: 'My Bills', href: '/account' },
    { label: 'Cart', href: '/cart' },
    { label: 'Sign In', href: '/login' },
  ],
};

export function Footer() {
  return (
    <footer style={{ background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="container-wide" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '48px', marginBottom: '56px' }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 2' }} className="sm:col-span-2">
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', letterSpacing: '0.15em', color: '#F5F5F0' }}>
                SOUL
                <span style={{ background: 'linear-gradient(135deg,#C4A24A,#E8C96A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 6px' }}>×</span>
                TIME
              </span>
            </div>
            <span className="divider-gold" style={{ marginLeft: 0, marginBottom: '16px' }} />
            <p style={{ fontSize: '13px', color: '#5A5A55', lineHeight: 1.75, maxWidth: '260px', marginTop: '12px' }}>
              Handcrafted timepieces for those who understand that a watch is more than an instrument — it is an expression of self.
            </p>
            <p style={{ fontSize: '12px', fontFamily: "'Cormorant Garamond',serif", color: '#3A3A35', marginTop: '20px', fontStyle: 'italic', letterSpacing: '0.08em' }}>
              Where Time Finds Its Soul
            </p>
          </div>

          {/* Collections */}
          <div>
            <h4 style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B8933A', marginBottom: '18px' }}>
              Collections
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {LINKS.collections.map(l => (
                <li key={l.href}>
                  <Link href={l.href} style={{ fontSize: '13px', color: '#5A5A55', textDecoration: 'none', transition: 'color 0.2s' }}
                    className="transition-colors duration-200 hover:text-[#A0A09A]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B8933A', marginBottom: '18px' }}>
              Account
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {LINKS.account.map(l => (
                <li key={l.href + l.label}>
                  <Link href={l.href} style={{ fontSize: '13px', color: '#5A5A55', textDecoration: 'none', transition: 'color 0.2s' }}
                    className="transition-colors duration-200 hover:text-[#A0A09A]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: '#3A3A35' }}>
            © {new Date().getFullYear()} SOUL x TIME. All rights reserved.
          </p>
          <p style={{ fontSize: '12px', fontFamily: "'Cormorant Garamond',serif", color: '#2A2A25', fontStyle: 'italic' }}>
            Where Time Finds Its Soul
          </p>
        </div>
      </div>
    </footer>
  );
}
