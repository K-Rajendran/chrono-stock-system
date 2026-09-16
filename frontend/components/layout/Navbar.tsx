'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: '⌂' },
  { href: '/products', label: 'Shop' },
  { href: '/products?new=true', label: 'New Arrivals' },
  { href: '/products', label: 'Collections' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

interface CartItem { id: string; quantity: number; }

function safeParseUser(str: string | null): { name: string; role: string } | null {
  if (!str) return null;
  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string' && parsed.name.trim()) {
      return { name: parsed.name.trim(), role: parsed.role || 'CUSTOMER' };
    }
    return null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Only read localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);

    // Load user safely
    const parsed = safeParseUser(localStorage.getItem('sxt_user'));
    setUser(parsed);

    // Load cart
    try {
      const cart = JSON.parse(localStorage.getItem('sxt_cart') || '[]') as CartItem[];
      setCartCount(cart.reduce((s, i) => s + (i.quantity || 0), 0));
    } catch {}

    const handleCartUpdate = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('sxt_cart') || '[]') as CartItem[];
        setCartCount(cart.reduce((s, i) => s + (i.quantity || 0), 0));
      } catch {}
    };

    // Listen for auth changes (e.g. login redirected back)
    const handleStorageChange = () => {
      const u = safeParseUser(localStorage.getItem('sxt_user'));
      setUser(u);
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-updated', handleStorageChange);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-updated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const redirectIfExpired = () => {
      const token = localStorage.getItem('sxt_token');
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp * 1000 <= Date.now()) {
          localStorage.removeItem('sxt_token'); localStorage.removeItem('sxt_user');
          window.location.assign('/login');
        }
      } catch { /* the API remains the authority for malformed tokens */ }
    };
    redirectIfExpired(); const timer = window.setInterval(redirectIfExpired, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('sxt_user');
    localStorage.removeItem('sxt_token');
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    const base = href.split('?')[0];
    return pathname.startsWith(base);
  };

  // Safe first letter
  const userInitial = user?.name?.[0]?.toUpperCase() ?? '?';
  const userFirstName = user?.name?.split(' ')[0] ?? '';

  return (
    <>
      <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '125px',
        transition: 'all 0.35s ease',
        background: scrolled
          ? 'rgba(215, 220, 228, 0)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(61,143,212,0.1)'
          : '1px solid transparent',
        boxShadow: scrolled
          ? '0 2px 24px rgba(202, 163, 34, 0.55)'
          : 'none',
      }}
    >
      {/* =========================================================
          BRAND
          ========================================================= */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: '700',
              letterSpacing: '0.22em',
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            AFINO
          </span>
        </Link>
      </div>

      {/* =========================================================
          DESKTOP PILL NAV
          Centered directly underneath AFINO
          ========================================================= */}
      <div
        className="desktop-nav"
        style={{
          position: 'absolute',

          // This controls the vertical position below AFINO
          top: '63px',

          // Exact horizontal centering
          left: '50%',
          transform: 'translateX(-50%)',

          display: 'flex',
          alignItems: 'center',

          background: 'rgba(255,255,255,0.96)',
          borderRadius: '50px',
          padding: '4px 6px',
          gap: '2px',

          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',

          // Prevent the pill from wrapping
          whiteSpace: 'nowrap',

          // Make sure it stays above page content
          zIndex: 5,
        }}
      >
        {/* =======================================================
            HOME ICON
            ======================================================= */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50px',

            background: isActive('/')
              ? '#282967'
              : 'transparent',

            color: isActive('/')
              ? '#fff'
              : '#333',

            textDecoration: 'none',
            fontSize: '16px',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
        >
          🏠
        </Link>

        {/* =======================================================
            NAVIGATION LINKS
            ======================================================= */}
        {[
          {
            href: '/products',
            label: 'Collection',
          },
          {
            href: '/products?new=1',
            label: 'New Arrivals',
          },
          {
            href: '/about',
            label: 'About',
          },
          {
            href: '/contact',
            label: 'Contact',
          },
        ].map((link) => {
          const active = isActive(link.href);

          return (
            <Link
              key={link.label}
              href={link.href}
              style={{
                padding: '8px 16px',
                borderRadius: '50px',

                background: active
                  ? '#293d69'
                  : 'transparent',

                color: active
                  ? '#fff'
                  : '#222',

                fontSize: '14px',
                fontWeight: active ? '600' : '500',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (
                    e.currentTarget as HTMLElement
                  ).style.background =
                    'rgba(0,0,0,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (
                    e.currentTarget as HTMLElement
                  ).style.background =
                    'transparent';
                }
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* =========================================================
          RIGHT SIDE ICONS
          ========================================================= */}
      <div
        style={{
          position: 'absolute',
          right: '38px',
          top: '63px',

          display: 'flex',
          alignItems: 'center',
          gap: '6px',

          zIndex: 10,
        }}
      >
        {/* =======================================================
            CART
            ======================================================= */}
        <Link
          href="/cart"
          style={{
            position: 'relative',
            width: '42px',
            height: '42px',

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            color: 'rgba(255,255,255,0.85)',
            borderRadius: '50%',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            (
              e.currentTarget as HTMLElement
            ).style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            (
              e.currentTarget as HTMLElement
            ).style.color =
              'rgba(255,255,255,0.85)';
          }}
        >
          <svg
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line
              x1="3"
              y1="6"
              x2="21"
              y2="6"
            />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>

          {mounted && cartCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',

                background: '#6dbf5a',
                color: '#fff',

                fontSize: '11px',
                fontWeight: '700',

                width: '18px',
                height: '18px',
                borderRadius: '50%',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                lineHeight: 1,
              }}
            >
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>

        {/* =======================================================
            USER / AUTH
            ======================================================= */}
        {mounted && user ? (
          <div
            ref={userMenuRef}
            style={{
              position: 'relative',
            }}
          >
            <button
              onClick={() =>
                setUserMenuOpen(!userMenuOpen)
              }
              style={{
                width: '42px',
                height: '42px',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                background: 'var(--gold-gradient)',
                border: 'none',
                borderRadius: '50%',

                cursor: 'pointer',

                fontSize: '15px',
                fontWeight: '700',
                color: '#000',

                flexShrink: 0,
              }}
            >
              {userInitial}
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,

                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',

                  overflow: 'hidden',
                  minWidth: '190px',

                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 200,
                }}
              >
                {/* User info */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom:
                      '1px solid var(--border)',
                    background:
                      'rgba(8,20,40,0.5)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color:
                        'var(--text-primary)',
                    }}
                  >
                    {userFirstName}
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '1px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {user.role}
                  </div>
                </div>

                {/* Admin dashboard */}
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin/dashboard"
                    style={{
                      display: 'block',
                      padding: '11px 16px',
                      fontSize: '13px',
                      color: 'var(--gold)',
                      borderBottom:
                        '1px solid var(--border)',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLElement
                      ).style.background =
                        'rgba(201,168,76,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLElement
                      ).style.background =
                        'transparent';
                    }}
                  >
                    ⚡ Admin Dashboard
                  </Link>
                )}

                {/* My account */}
                <Link
                  href="/account"
                  style={{
                    display: 'block',
                    padding: '11px 16px',
                    fontSize: '13px',
                    color:
                      'var(--text-secondary)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLElement
                    ).style.background =
                      'rgba(61,143,212,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLElement
                    ).style.background =
                      'transparent';
                  }}
                >
                  My Account
                </Link>

                {/* My bills */}
                <Link
                  href="/bills"
                  style={{
                    display: 'block',
                    padding: '11px 16px',
                    fontSize: '13px',
                    color:
                      'var(--text-secondary)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLElement
                    ).style.background =
                      'rgba(61,143,212,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLElement
                    ).style.background =
                      'transparent';
                  }}
                >
                  My Bills
                </Link>

                {/* Sign out */}
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',

                    padding: '11px 16px',
                    fontSize: '13px',

                    color: '#f87171',

                    borderTop:
                      '1px solid var(--border)',
                    borderRight: 'none',
                    borderBottom: 'none',
                    borderLeft: 'none',

                    cursor: 'pointer',
                    background: 'none',
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLElement
                    ).style.background =
                      'rgba(248,113,113,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLElement
                    ).style.background =
                      'transparent';
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Not logged in */
          <Link
            href="/login"
            style={{
              width: '42px',
              height: '42px',

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              color: 'rgba(255,255,255,0.75)',
              borderRadius: '50%',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              (
                e.currentTarget as HTMLElement
              ).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (
                e.currentTarget as HTMLElement
              ).style.color =
                'rgba(255,255,255,0.75)';
            }}
          >
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle
                cx="12"
                cy="7"
                r="4"
              />
            </svg>
          </Link>
        )}

        {/* =======================================================
            MOBILE HAMBURGER
            ======================================================= */}
        <button
          onClick={() =>
            setMobileOpen(!mobileOpen)
          }
          className="mobile-menu-btn"
          aria-label="Toggle menu"
          style={{
            display: 'none',

            width: '40px',
            height: '40px',

            alignItems: 'center',
            justifyContent: 'center',

            color: 'rgba(255,255,255,0.85)',

            border:
              '1px solid rgba(255,255,255,0.2)',
            borderRadius: 'var(--radius-sm)',

            background: 'transparent',

            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          {mobileOpen ? (
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line
                x1="18"
                y1="6"
                x2="6"
                y2="18"
              />
              <line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line
                x1="3"
                y1="12"
                x2="21"
                y2="12"
              />
              <line
                x1="3"
                y1="6"
                x2="21"
                y2="6"
              />
              <line
                x1="3"
                y1="18"
                x2="21"
                y2="18"
              />
            </svg>
          )}
        </button>
      </div>
    </nav>

    {/* =========================================================
        MOBILE OVERLAY
        ========================================================= */}
    {mobileOpen && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,

          background: 'rgba(4,8,15,0.97)',
          backdropFilter: 'blur(20px)',

          zIndex: 999,

          padding: '80px 24px 32px',

          display: 'flex',
          flexDirection: 'column',
          gap: '4px',

          overflowY: 'auto',
        }}
      >
        {/* Mobile logo */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <span
            style={{
              fontFamily:
                'var(--font-display)',
              fontSize: '20px',
              fontWeight: '700',
              letterSpacing: '0.2em',
              color: 'var(--text-primary)',
            }}
          >
            AFINO
          </span>
        </div>

        {/* Mobile navigation */}
        {[
          {
            href: '/',
            label: 'Home',
          },
          {
            href: '/products',
            label: 'Shop',
          },
          {
            href: '/products?new=1',
            label: 'New Arrivals',
          },
          {
            href: '/collections',
            label: 'Collections',
          },
          {
            href: '/about',
            label: 'About',
          },
          {
            href: '/contact',
            label: 'Contact',
          },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            style={{
              padding: '15px 20px',
              fontSize: '18px',
              fontFamily:
                'var(--font-heading)',
              fontWeight: '500',

              color: isActive(link.href)
                ? 'var(--blue-bright)'
                : 'var(--text-secondary)',

              borderBottom:
                '1px solid var(--border)',

              transition: 'color 0.2s',
              textDecoration: 'none',
            }}
          >
            {link.label}
          </Link>
        ))}

        {/* Mobile actions */}
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Cart */}
          <Link
            href="/cart"
            style={{
              flex: 1,
              padding: '14px',
              textAlign: 'center',

              border:
                '1px solid var(--border)',
              borderRadius:
                'var(--radius-md)',

              color: 'var(--text-secondary)',
              fontSize: '14px',

              minWidth: '120px',
              textDecoration: 'none',
            }}
          >
            🛒 Cart{' '}
            {mounted &&
              cartCount > 0 &&
              `(${cartCount})`}
          </Link>

          {/* Auth */}
          {mounted && user ? (
            <button
              onClick={handleLogout}
              style={{
                flex: 1,
                padding: '14px',
                textAlign: 'center',

                border:
                  '1px solid rgba(248,113,113,0.3)',
                borderRadius:
                  'var(--radius-md)',

                color: '#f87171',
                fontSize: '14px',

                background: 'none',
                cursor: 'pointer',

                minWidth: '120px',
              }}
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              style={{
                flex: 1,
                padding: '14px',
                textAlign: 'center',

                background:
                  'rgba(61,143,212,0.15)',

                border:
                  '1px solid var(--border-active)',

                borderRadius:
                  'var(--radius-md)',

                color: 'var(--text-primary)',
                fontSize: '14px',

                minWidth: '120px',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    )}

    {/* =========================================================
        RESPONSIVE CSS
        ========================================================= */}
    <style>{`
      @media (max-width: 768px) {
        .desktop-nav {
          display: none !important;
        }

        .mobile-menu-btn {
          display: flex !important;
        }
      }

      @media (max-width: 480px) {
        nav {
          height: 75px !important;
        }
      }
    `}</style>
    </>
  );
}
