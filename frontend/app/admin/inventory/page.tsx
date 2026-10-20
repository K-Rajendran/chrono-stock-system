'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { authenticatedFetch } from '@/lib/auth';

interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: string;
}

interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; }

export default function AdminInventoryPage() {
  const [page, setPage] = useState<Page<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      const params = new URLSearchParams({ page: String(currentPage), size: '15', sort: 'name,asc' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('stockStatus', statusFilter);
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setPage(await res.json());
    } catch { setError('Failed to load inventory.'); }
    finally { setLoading(false); }
  }, [currentPage, search, statusFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const STOCK_STATUSES = ['', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: '700', color: 'var(--text-primary)' }}>Inventory</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Monitor and adjust product stock levels.</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search products…" value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(0); }}
          style={{ flex: '1 1 220px', padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', WebkitTextFillColor: 'var(--text-primary)' }} />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(0); }}
          style={{ padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}>
          {STOCK_STATUSES.map(s => <option key={s} value={s}>{s || 'All Stock Status'}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? <LoadingSpinner message="Loading inventory…" /> : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#f87171' }}>{error}</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(8,20,40,0.5)' }}>
                    {['Product', 'SKU', 'Current Stock', 'Threshold', 'Status', 'Manage'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Current Stock' || h === 'Threshold' ? 'right' : 'left', fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(page?.content ?? []).length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No products found.</td></tr>
                  ) : (page?.content ?? []).map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < (page!.content.length - 1) ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.brand}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>{p.sku}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <span style={{ fontWeight: '700', fontSize: '18px', color: p.stockStatus === 'OUT_OF_STOCK' ? '#f87171' : p.stockStatus === 'LOW_STOCK' ? '#fbbf24' : '#34d399' }}>
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '13px' }}>{p.lowStockThreshold}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={p.stockStatus} size="sm" /></td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link href={`/admin/inventory/${p.id}`}
                          style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(61,143,212,0.1)', border: '1px solid rgba(61,143,212,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--blue-bright)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          Adjust →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {page && page.totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{page.totalElements} products</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}
                    style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--text-secondary)', cursor: currentPage === 0 ? 'default' : 'pointer', opacity: currentPage === 0 ? 0.4 : 1 }}>←</button>
                  <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{currentPage + 1} / {page.totalPages}</span>
                  <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= page.totalPages - 1}
                    style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--text-secondary)', cursor: currentPage >= page.totalPages - 1 ? 'default' : 'pointer', opacity: currentPage >= page.totalPages - 1 ? 0.4 : 1 }}>→</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
