'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Footer() {
  const year = new Date().getFullYear();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const sync = () => setSignedIn(Boolean(localStorage.getItem('sxt_token')));
    sync(); window.addEventListener('auth-updated', sync); return () => window.removeEventListener('auth-updated', sync);
  }, []);

  return (
    <footer
      style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        marginTop: 'auto',
      }}
    >
      {/* Main footer */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '64px 24px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '48px',
        }}
      >
        {/* Brand */}
        <div className="footer-explore">
          <div style={{ marginBottom: '16px' }}>
            <img
              src="/afino-logo.svg"
              alt="AFINO"
              style={{
                width: '104px',
                height: '104px',
                filter: 'invert(1) sepia(1) saturate(2) hue-rotate(185deg) brightness(1.2)',
                marginBottom: '8px',
              }}
            />
            {/* <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: '600',
                letterSpacing: '0.1em',
                background: 'var(--gold-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              AFINO
            </div> */}
          </div>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '13px',
              lineHeight: '1.7',
              maxWidth: '220px',
              fontStyle: 'italic',
              fontFamily: 'var(--font-display)',
            }}
          >
            Where time finds its soul. Curating exceptional timepieces for the discerning collector.
          </p>
        </div>

        {/* Navigation */}
        <div className="footer-account">
          <h4
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '20px',
            }}
          >
            Explore
          </h4>
          {[
            { href: '/', label: 'Home' },
            { href: '/products', label: 'Collection' },
            { href: '/about', label: 'About' },
            { href: '/contact', label: 'Contact' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'block',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                marginBottom: '12px',
                transition: 'color var(--transition)',
              }}
              className="transition-colors duration-200 hover:text-[var(--blue-bright)]"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Account */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '20px',
            }}
          >
            Account
          </h4>
          {[
            { href: '/account', label: 'My Account' },
            { href: '/bills', label: 'My Bills' },
            { href: '/cart', label: 'Cart' },
            ...(!signedIn ? [{ href: '/login', label: 'Sign In' }, { href: '/register', label: 'Register' }] : []),
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'block',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                marginBottom: '12px',
                transition: 'color var(--transition)',
              }}
              className="transition-colors duration-200 hover:text-[var(--blue-bright)]"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '20px',
            }}
          >
            Get in Touch
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '📧', label: 'contact@soulxtime.com' },
              { icon: '📱', label: 'WhatsApp Available' },
              { icon: '🕐', label: 'Mon–Sat, 10am–7pm' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '14px' }}>{icon}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          © {year} AFINO. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy Policy', 'Terms of Service'].map((label) => (
            <span
              key={label}
              style={{ color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 640px) { .footer-explore { grid-column: 1; } .footer-account { grid-column: 2; } }`}</style>
    </footer>
  );
}
