'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface DashboardStats {
  todayRevenue: number;
  periodRevenue: number;
  totalRevenue: number;
  todayGoodsCost: number;
  periodGoodsCost: number;
  totalGoodsCost: number;
  todayProfit: number;
  periodProfit: number;
  totalProfit: number;
  todayBills: number;
  periodBills: number;
  totalBills: number;
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingRequests: number;
  pendingBills: number;
}

interface RecentBill {
  id: string;
  billNumber: string;
  customerName: string;
  finalTotal: number;
  paymentStatus: string;
  billStatus: string;
  createdAt: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const PERIODS = [
  { label: 'Today', value: 'TODAY' },
  { label: 'Yesterday', value: 'YESTERDAY' },
  { label: 'Last 7 days', value: 'LAST_7' },
  { label: 'Last 30 days', value: 'LAST_30' },
  { label: 'This Month', value: 'THIS_MONTH' },
  { label: 'All Time', value: 'ALL' },
];

function MetricCard({
  title, value, sub, icon, accent = 'blue', change,
}: {
  title: string; value: string; sub?: string; icon: string; accent?: 'blue' | 'gold' | 'green' | 'red'; change?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'rgba(61,143,212,0.12)',
    gold: 'rgba(201,168,76,0.12)',
    green: 'rgba(16,185,129,0.12)',
    red: 'rgba(239,68,68,0.12)',
  };
  const borders: Record<string, string> = {
    blue: 'rgba(61,143,212,0.25)',
    gold: 'rgba(201,168,76,0.25)',
    green: 'rgba(16,185,129,0.25)',
    red: 'rgba(239,68,68,0.25)',
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{title}</span>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: colors[accent], border: `1px solid ${borders[accent]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
      </div>
      {change && (
        <div style={{ fontSize: '12px', color: change.startsWith('+') ? '#34d399' : '#f87171', fontWeight: '500' }}>{change}</div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBills, setRecentBills] = useState<RecentBill[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('LAST_7');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, [period]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      const headers = { Authorization: `Bearer ${token}` };
      const base = process.env.NEXT_PUBLIC_API_URL;

      const [statsRes, billsRes, stockRes] = await Promise.all([
        fetch(`${base}/api/admin/dashboard?period=${period}`, { headers }),
        fetch(`${base}/api/admin/bills?page=0&size=5&sort=createdAt,desc`, { headers }),
        fetch(`${base}/api/admin/products/low-stock?page=0&size=5`, { headers }),
      ]);

      if (!statsRes.ok) throw new Error('stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      if (billsRes.ok) {
        const billsData = await billsRes.json();
        setRecentBills(billsData.content ?? billsData ?? []);
      }

      if (stockRes.ok) {
        const stockData = await stockRes.json();
        setLowStock(stockData.content ?? stockData ?? []);
      }
    } catch {
      setError('Could not load dashboard data. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: `1px solid ${period === value ? 'var(--border-active)' : 'var(--border)'}`,
                background: period === value ? 'rgba(61,143,212,0.12)' : 'transparent',
                color: period === value ? 'var(--blue-bright)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: period === value ? '600' : '400',
                cursor: 'pointer',
                transition: 'all var(--transition)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '24px', color: '#f87171', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {error}
          <button onClick={fetchAll} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {loading && <LoadingSpinner message="Loading dashboard…" />}

      {!loading && stats && (
        <>
          {/* Alert banners */}
          {(stats.pendingRequests > 0 || stats.outOfStockCount > 0) && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
              {stats.pendingRequests > 0 && (
                <Link href="/admin/purchase-requests" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'all var(--transition)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.14)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.08)'; }}
                >
                  <span style={{ fontSize: '20px' }}>🔔</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#fbbf24' }}>{stats.pendingRequests} pending request{stats.pendingRequests !== 1 ? 's' : ''}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tap to review</div>
                  </div>
                </Link>
              )}
              {stats.outOfStockCount > 0 && (
                <Link href="/admin/inventory" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'all var(--transition)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.14)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
                >
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#f87171' }}>{stats.outOfStockCount} out of stock</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manage inventory</div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Revenue metrics */}
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '500' }}>Revenue & Profit</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <MetricCard title="Revenue (Period)" value={fmt(stats.periodRevenue)} sub={`Today: ${fmt(stats.todayRevenue)}`} icon="💰" accent="gold" />
            <MetricCard title="Goods Cost" value={fmt(stats.periodGoodsCost)} sub={`Today: ${fmt(stats.todayGoodsCost)}`} icon="📦" accent="blue" />
            <MetricCard title="Gross Profit" value={fmt(stats.periodProfit)} sub={`Today: ${fmt(stats.todayProfit)}`} icon="📈" accent="green" />
            <MetricCard title="Total Revenue" value={fmt(stats.totalRevenue)} sub={`All time`} icon="🏦" accent="gold" />
          </div>

          {/* Billing & Inventory */}
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '500' }}>Bills & Inventory</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <MetricCard title="Bills (Period)" value={String(stats.periodBills)} sub={`Today: ${stats.todayBills}`} icon="🧾" accent="blue" />
            <MetricCard title="Total Bills" value={String(stats.totalBills)} icon="📋" accent="blue" />
            <MetricCard title="Products" value={String(stats.totalProducts)} sub={`${stats.totalStock} units in stock`} icon="⌚" accent="gold" />
            <MetricCard title="Stock Alerts" value={String(stats.lowStockCount + stats.outOfStockCount)} sub={`${stats.lowStockCount} low · ${stats.outOfStockCount} out`} icon="⚠️" accent={stats.outOfStockCount > 0 ? 'red' : 'blue'} />
          </div>

          {/* Bottom panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Recent Bills */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Recent Bills</h3>
                <Link href="/admin/bills" style={{ fontSize: '12px', color: 'var(--blue-bright)', textDecoration: 'none' }}>View all →</Link>
              </div>
              {recentBills.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No bills yet.</div>
              ) : (
                recentBills.map((bill) => (
                  <Link key={bill.id} href={`/admin/bills/${bill.id}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid var(--border)', textDecoration: 'none', transition: 'background var(--transition)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(61,143,212,0.04)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>#{bill.billNumber}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{bill.customerName} · {fmtDate(bill.createdAt)}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gold)' }}>{fmt(bill.finalTotal)}</span>
                      <StatusBadge status={bill.paymentStatus} size="sm" />
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Low Stock */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Stock Alerts</h3>
                <Link href="/admin/inventory" style={{ fontSize: '12px', color: 'var(--blue-bright)', textDecoration: 'none' }}>Manage →</Link>
              </div>
              {lowStock.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                  All products well stocked.
                </div>
              ) : (
                lowStock.map((p) => (
                  <Link key={p.id} href={`/admin/inventory/${p.id}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid var(--border)', textDecoration: 'none', transition: 'background var(--transition)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(61,143,212,0.04)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Threshold: {p.lowStockThreshold}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: p.stockStatus === 'OUT_OF_STOCK' ? '#f87171' : '#fbbf24' }}>{p.stockQuantity}</span>
                      <StatusBadge status={p.stockStatus} size="sm" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
