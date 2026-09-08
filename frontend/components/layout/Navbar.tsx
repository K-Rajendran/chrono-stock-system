'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import { ShoppingBag, User, Menu, X, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/services';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { href: '/products', label: 'Collection' },
  { href: '/products?categoryId=1', label: 'Luxury' },
  { href: '/products?categoryId=2', label: 'Sport' },
  { href: '/products?categoryId=3', label: 'Classic' },
  { href: '/products?categoryId=5', label: 'Limited' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isHome = pathname === '/';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Close menus on route change
  useEffect(() => { setMenuOpen(false); setUserMenuOpen(false); }, [pathname]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    toast.success('Signed out');
    router.push('/');
  };

  const navBg = scrolled || !isHome
    ? 'rgba(8,8,8,0.96)'
    : 'transparent';
  const navBorder = scrolled || !isHome
    ? '1px solid rgba(255,255,255,0.07)'
    : '1px solid transparent';

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        background: navBg,
        backdropFilter: scrolled || !isHome ? 'blur(20px) saturate(160%)' : 'none',
        borderBottom: navBorder,
        transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
      }}>
        <div className="container-wide" style={{ display: 'flex', alignItems: 'center', height: '68px' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', marginRight: 'auto' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', letterSpacing: '0.15em', color: '#F5F5F0', fontWeight: 400 }}>
              SOUL
              <span style={{ background: 'linear-gradient(135deg,#C4A24A,#E8C96A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 6px' }}>×</span>
              TIME
            </span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px', marginRight: '32px' }} className="hidden lg:flex">
            {NAV_LINKS.map(link => {
              const active = pathname === link.href || (link.href !== '/products' && pathname.startsWith(link.href.split('?')[0]));
              return (
                <Link key={link.href} href={link.href} style={{
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: active ? '#B8933A' : 'rgba(245,245,240,0.55)',
                  textDecoration: 'none', transition: 'color 0.2s ease',
                  position: 'relative', paddingBottom: '2px',
                }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#F5F5F0'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(245,245,240,0.55)'; }}
                >
                  {link.label}
                  {active && (
                    <span style={{ position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '1px', background: '#B8933A' }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Cart */}
            {isAuthenticated && (
              <Link href="/cart" style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', textDecoration: 'none', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                aria-label="Cart">
                <ShoppingBag style={{ width: '19px', height: '19px', color: 'rgba(245,245,240,0.75)' }} />
                {itemCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '17px', height: '17px', borderRadius: '50%',
                    background: '#B8933A', color: '#000', fontSize: '9px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Desktop: user menu */}
            <div className="hidden lg:block" style={{ position: 'relative' }}>
              {isAuthenticated ? (
                <>
                  <button onClick={() => setUserMenuOpen(v => !v)} style={{
                    display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px',
                    borderRadius: '10px', cursor: 'pointer', border: 'none', background: 'transparent',
                    color: 'rgba(245,245,240,0.7)', fontSize: '13px', transition: 'background 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(184,147,58,0.2)', border: '1px solid rgba(184,147,58,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#B8933A' }}>
                      {user?.fullName?.charAt(0)}
                    </div>
                    <ChevronDown style={{ width: '13px', height: '13px', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setUserMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                            background: '#141414', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '14px', padding: '6px', minWidth: '200px',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.6)', zIndex: 50,
                          }}
                        >
                          <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '4px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 500, color: '#F5F5F0' }}>{user?.fullName}</p>
                            <p style={{ fontSize: '11px', color: '#5A5A55', marginTop: '1px' }}>{user?.email}</p>
                          </div>
                          {user?.role === 'ADMIN' && <DropItem href="/admin" icon={<LayoutDashboard size={14}/>} label="Admin Dashboard" gold />}
                          <DropItem href="/account" icon={<User size={14}/>} label="My Account" />
                          <DropItem href="/cart" icon={<ShoppingBag size={14}/>} label="Cart" />
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '4px', paddingTop: '4px' }}>
                            <button onClick={handleLogout} style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '9px 12px', borderRadius: '9px', cursor: 'pointer', border: 'none', background: 'transparent',
                              color: 'rgba(245,245,240,0.45)', fontSize: '13px', transition: 'all 0.15s', textAlign: 'left',
                            }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(245,245,240,0.45)'; }}
                            >
                              <LogOut size={14} /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Link href="/login" style={{ fontSize: '13px', color: 'rgba(245,245,240,0.55)', textDecoration: 'none', transition: 'color 0.2s', padding: '6px 4px' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F5F5F0'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(245,245,240,0.55)'}>
                    Sign In
                  </Link>
                  <Link href="/register" style={{
                    height: '36px', padding: '0 18px', borderRadius: '10px',
                    background: 'linear-gradient(135deg,#C4A24A,#E8C96A 50%,#9A7A2A)', color: '#000',
                    fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em',
                    display: 'flex', alignItems: 'center', textDecoration: 'none', transition: 'opacity 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.9'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                    Join
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="lg:hidden" onClick={() => setMenuOpen(v => !v)} style={{
              width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '10px', cursor: 'pointer', border: 'none', background: 'transparent', color: 'rgba(245,245,240,0.7)',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              aria-label="Menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 38, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
                width: '300px', background: '#0F0F0F',
                borderLeft: '1px solid rgba(255,255,255,0.07)',
                overflowY: 'auto', paddingTop: '68px',
              }}
            >
              <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {NAV_LINKS.map(link => (
                  <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} style={{
                    padding: '13px 14px', borderRadius: '10px',
                    fontSize: '13px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: pathname === link.href ? '#B8933A' : 'rgba(245,245,240,0.6)',
                    background: pathname === link.href ? 'rgba(184,147,58,0.08)' : 'transparent',
                    textDecoration: 'none', transition: 'all 0.2s', display: 'block',
                  }}>
                    {link.label}
                  </Link>
                ))}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {isAuthenticated ? (
                    <>
                      <div style={{ padding: '10px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '6px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#F5F5F0' }}>{user?.fullName}</p>
                        <p style={{ fontSize: '12px', color: '#5A5A55', marginTop: '2px' }}>{user?.role}</p>
                      </div>
                      {user?.role === 'ADMIN' && (
                        <MobileNavItem href="/admin" label="Admin Dashboard" onClick={() => setMenuOpen(false)} gold />
                      )}
                      <MobileNavItem href="/account" label="My Account" onClick={() => setMenuOpen(false)} />
                      <MobileNavItem href="/cart" label={`Cart${itemCount > 0 ? ` (${itemCount})` : ''}`} onClick={() => setMenuOpen(false)} />
                      <button onClick={handleLogout} style={{
                        padding: '13px 14px', borderRadius: '10px', cursor: 'pointer',
                        border: 'none', background: 'transparent', textAlign: 'left', width: '100%',
                        fontSize: '13px', color: '#f87171', transition: 'background 0.2s',
                      }}>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 0' }}>
                      <Link href="/login" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '13px', color: 'rgba(245,245,240,0.7)', textDecoration: 'none' }}>
                        Sign In
                      </Link>
                      <Link href="/register" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 14px', borderRadius: '10px', background: 'linear-gradient(135deg,#C4A24A,#E8C96A 50%,#9A7A2A)', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#000', textDecoration: 'none' }}>
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DropItem({ href, icon, label, gold }: { href: string; icon: React.ReactNode; label: string; gold?: boolean }) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '9px',
      fontSize: '13px', color: gold ? '#B8933A' : 'rgba(245,245,240,0.65)',
      textDecoration: 'none', transition: 'all 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = gold ? '#D4AF6B' : '#F5F5F0'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = gold ? '#B8933A' : 'rgba(245,245,240,0.65)'; }}
    >
      {icon}{label}
    </Link>
  );
}

function MobileNavItem({ href, label, onClick, gold }: { href: string; label: string; onClick: () => void; gold?: boolean }) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'block', padding: '13px 14px', borderRadius: '10px',
      fontSize: '13px', color: gold ? '#B8933A' : 'rgba(245,245,240,0.6)',
      textDecoration: 'none', transition: 'background 0.2s',
    }}>
      {label}
    </Link>
  );
}
