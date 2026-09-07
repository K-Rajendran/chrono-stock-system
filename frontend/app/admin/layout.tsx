'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import {
  LayoutDashboard, Package, BarChart3, FileText, ShoppingCart,
  Settings, LogOut, Menu, X, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authService } from '@/services';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: BarChart3 },
  { href: '/admin/bills', label: 'Bills', icon: FileText },
  { href: '/admin/purchase-requests', label: 'Requests', icon: ShoppingCart },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'ADMIN') { router.push('/'); return; }
  }, [isAuthenticated, user, router]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    toast.success('Signed out');
    router.push('/');
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-brand-black-border">
        <Link href="/" className="font-serif text-xl tracking-[0.15em] text-brand-white">
          SOUL<span className="gold-text mx-1">×</span>TIME
        </Link>
        <p className="text-xs text-brand-gray mt-1 tracking-wider">Admin Console</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150',
              isActive(href, exact)
                ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/25'
                : 'text-brand-white/60 hover:text-brand-white hover:bg-white/5'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-brand-black-border space-y-1">
        <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-brand-white/50 hover:text-brand-white hover:bg-white/5 transition-all">
          <Settings className="w-4 h-4" /> View Store
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-brand-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all text-left"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-brand-black overflow-hidden" data-admin="true">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-brand-black-border bg-brand-black-soft flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-brand-black-soft border-r border-brand-black-border lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-brand-black-border bg-brand-black-soft flex items-center justify-between px-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="text-xs font-medium text-brand-white">{user?.fullName}</p>
              <p className="text-xs text-brand-gold tracking-wider">Administrator</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold font-medium text-sm">
              {user?.fullName?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
