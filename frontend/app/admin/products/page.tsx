'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  sellingPrice: number;
  purchaseCost: number;
  stockQuantity: number;
  stockStatus: string;
  discountValue: number;
  discountType: string;
  active: boolean;
  lowStockThreshold: number;
}

interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; }

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function AdminProductsPage() {
  const [page, setPage] = useState<Page<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      const params = new URLSearchParams({ page: String(currentPage), size: '10', sort: 'createdAt,desc' });
      if (search) params.set('search', search);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setPage(await res.json());
    } catch { setError('Failed to load products.'); }
    finally { setLoading(false); }
  }, [currentPage, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleToggleActive = async (product: Product) => {
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${product.id}/${product.active ? 'deactivate' : 'activate'}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      showToast(`Product ${product.active ? 'deactivated' : 'activated'}.`);
      fetchProducts();
    } catch { showToast('Action failed.'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      showToast('Product Deleted.');
      fetchProducts();
    } catch { showToast('Delete failed.'); }
    finally { setDeleting(null); }
  };

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', zIndex: 9999, boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: '700', color: 'var(--text-primary)' }}>Products</h1>
        <Link href="/admin/products/new"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '13px', borderRadius: 'var(--radius-md)', textDecoration: 'none', boxShadow: 'var(--shadow-gold)' }}>
          + Add Product
        </Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search products by name, brand, SKU…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
          style={{
            width: '100%', maxWidth: '420px',
            padding: '10px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
            WebkitTextFillColor: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? <LoadingSpinner message="Loading products…" /> : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#f87171' }}>{error}<br /><button onClick={fetchProducts} style={{ marginTop: '12px', padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Retry</button></div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(8,20,40,0.5)' }}>
                    {['Product', 'SKU', 'Stock', 'Selling Price', 'Cost', 'Status', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Actions' || h === 'Stock' || h === 'Selling Price' || h === 'Cost' ? 'right' : 'left', fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(page?.content ?? []).length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No products found.</td></tr>
                  ) : (
                    (page?.content ?? []).map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: i < (page!.content.length - 1) ? '1px solid var(--border)' : 'none', opacity: p.active ? 1 : 0.55 }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{p.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.brand} · {p.category}</div>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px' }}>{p.sku}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{ fontWeight: '700', fontSize: '15px', color: p.stockStatus === 'OUT_OF_STOCK' ? '#f87171' : p.stockStatus === 'LOW_STOCK' ? '#fbbf24' : 'var(--text-primary)' }}>
                            {p.stockQuantity}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: 'var(--gold)' }}>{fmt(p.sellingPrice)}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(p.purchaseCost)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={p.stockStatus} size="sm" />
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                            <Link href={`/admin/products/${p.id}/edit`}
                              style={{ padding: '5px 12px', fontSize: '12px', background: 'rgba(61,143,212,0.1)', border: '1px solid rgba(61,143,212,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--blue-bright)', textDecoration: 'none' }}>
                              Edit
                            </Link>
                            <Link href={`/admin/inventory/${p.id}`}
                              style={{ padding: '5px 12px', fontSize: '12px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--gold)', textDecoration: 'none' }}>
                              Stock
                            </Link>
                            {/* <button onClick={() => handleToggleActive(p)}
                              style={{ padding: '5px 12px', fontSize: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                              {p.active ? 'Hide' : 'Show'}
                            </button> */}
                            <button onClick={() => handleDelete(p.id, p.name)} disabled={deleting === p.id}
                              style={{ padding: '5px 10px', fontSize: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', color: '#f87171', cursor: 'pointer' }}>
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {page && page.totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {page.totalElements} product{page.totalElements !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}
                    style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', color: currentPage === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: currentPage === 0 ? 'default' : 'pointer' }}>
                    ←
                  </button>
                  <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {currentPage + 1} / {page.totalPages}
                  </span>
                  <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= page.totalPages - 1}
                    style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', color: currentPage >= page.totalPages - 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: currentPage >= page.totalPages - 1 ? 'default' : 'pointer' }}>
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
