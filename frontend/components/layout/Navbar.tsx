'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import { ShoppingBag, User, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authService } from '@/services';

const navLinks = [
  { href: '/products', label: 'Collection' },
  { href: '/products?categoryId=1', label: 'Luxury' },
  { href: '/products?categoryId=2', label: 'Sport' },
  { href: '/products?categoryId=5', label: 'Limited' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    logout();
    toast.success('Signed out successfully');
    router.push('/');
    setMenuOpen(false);
  };

  const isHomePage = pathname === '/';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-500',
        scrolled || !isHomePage
          ? 'bg-brand-black/95 backdrop-blur-md border-b border-brand-black-border shadow-deep'
          : 'bg-transparent'
      )}
    >
      <div className="container-wide">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setMenuOpen(false)}>
            <span className="font-serif text-xl lg:text-2xl tracking-[0.15em] text-brand-white group-hover:gold-text transition-all duration-300">
              SOUL<span className="gold-text mx-1">×</span>TIME
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm tracking-widest uppercase font-medium transition-colors duration-200',
                  pathname === link.href
                    ? 'text-brand-gold'
                    : 'text-brand-white/60 hover:text-brand-white'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 lg:gap-3">
            {/* Cart */}
            {isAuthenticated && (
              <Link
                href="/cart"
                className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Shopping cart"
              >
                <ShoppingBag className="w-5 h-5 text-brand-white/80" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand-gold text-black text-xs font-bold flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Account / Auth */}
            {isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-2">
                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="p-2.5 rounded-xl hover:bg-white/5 text-brand-gold transition-colors"
                    aria-label="Admin dashboard"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                )}
                <Link
                  href="/account"
                  className="p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                  aria-label="My account"
                >
                  <User className="w-5 h-5 text-brand-white/80" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-5 h-5 text-brand-white/60" />
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm text-brand-white/70 hover:text-brand-white transition-colors tracking-wide"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="h-9 px-5 rounded-lg bg-brand-gold text-black text-sm font-medium hover:bg-brand-gold-light transition-colors tracking-wide"
                >
                  Join
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden border-t border-brand-black-border bg-brand-black-soft overflow-hidden"
          >
            <div className="container-wide py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'block py-3 px-4 rounded-xl text-sm tracking-widest uppercase font-medium transition-colors',
                    pathname === link.href
                      ? 'text-brand-gold bg-brand-gold/10'
                      : 'text-brand-white/70 hover:text-brand-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-4 border-t border-brand-black-border mt-2">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <Link href="/account" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm text-brand-white/70 hover:text-brand-white hover:bg-white/5 transition-colors">
                      <User className="w-4 h-4" /> My Account
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm text-brand-gold hover:bg-brand-gold/10 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 w-full py-3 px-4 rounded-xl text-sm text-brand-white/60 hover:text-brand-white hover:bg-white/5 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3 px-4">
                    <Link href="/login" onClick={() => setMenuOpen(false)}
                      className="flex-1 py-2.5 text-center rounded-lg border border-brand-black-border text-sm text-brand-white/70 hover:text-brand-white hover:border-brand-gold/50 transition-colors">
                      Sign In
                    </Link>
                    <Link href="/register" onClick={() => setMenuOpen(false)}
                      className="flex-1 py-2.5 text-center rounded-lg bg-brand-gold text-black text-sm font-medium hover:bg-brand-gold-light transition-colors">
                      Join
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
