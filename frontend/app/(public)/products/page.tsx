'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Product {
  id: string;
  name: string;
  brand: string;
  categoryName: string | null;
  sellingPrice: number;
  effectivePrice: number;
  discountValue: number;
  discountType: string;
  discountAmount: number;
  stockStatus: string;
  primaryImageUrl?: string;
}

interface Category { id: string; name: string; }
interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; }

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const hasDiscount = product.discountValue > 0 && product.effectivePrice < product.sellingPrice;

  return (
    <Link href={`/products/${product.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column',
        background: hovered ? 'rgba(13, 32, 64, 0.9)' : 'var(--bg-card)',
        border: `1px solid ${hovered ? 'rgba(61,143,212,0.35)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)', overflow: 'hidden', textDecoration: 'none',
        transition: 'all var(--transition)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.35)' : 'var(--shadow-sm)',
      }}>
      {/* Image */}
      <div style={{ height: '220px', background: 'linear-gradient(135deg, #0d1f3c 0%, #0a1628 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {product.primaryImageUrl ? (
          <img src={product.primaryImageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform var(--transition-slow)', transform: hovered ? 'scale(1.05)' : 'scale(1)' }} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '56px', opacity: 0.7 }}>⌚</div>
          </div>
        )}
        {/* Badges */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {hasDiscount && <span style={{ padding: '3px 8px', background: 'rgba(239,68,68,0.9)', color: 'white', fontSize: '10px', fontWeight: '700', borderRadius: '10px' }}>
            -{product.discountType === 'PERCENTAGE' ? `${product.discountValue}%` : fmt(product.discountValue)}
          </span>}
        </div>
      </div>
      {/* Info */}
      <div style={{ padding: '18px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{product.brand} · {product.categoryName ?? 'Collection'}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.3 }}>{product.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', fontWeight: '700', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {fmt(product.effectivePrice)}
          </span>
          {hasDiscount && <span style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{fmt(product.sellingPrice)}</span>}
        </div>
        {product.stockStatus === 'LOW_STOCK' && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#fbbf24', fontWeight: '500' }}>⚠ Low stock</div>
        )}
      </div>
    </Link>
  );
}

// Skeleton card
function SkeletonCard() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ height: '220px', background: 'linear-gradient(90deg, var(--bg-elevated) 25%, rgba(255,255,255,0.02) 50%, var(--bg-elevated) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ height: '12px', background: 'var(--bg-elevated)', borderRadius: '6px', width: '60%' }} />
        <div style={{ height: '16px', background: 'var(--bg-elevated)', borderRadius: '6px' }} />
        <div style={{ height: '20px', background: 'var(--bg-elevated)', borderRadius: '6px', width: '40%' }} />
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [page, setPage] = useState<Page<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [category, setCategory] = useState(searchParams.get('categoryId') ?? '');
  const [sort, setSort] = useState('createdAt,desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`).then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sortBy, sortDir] = sort.split(',');
      const params = new URLSearchParams({ page: String(currentPage), size: '12', sortBy, sortDir });
      if (search) params.set('search', search);
      if (category) params.set('categoryId', category);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?${params}`);
      if (!res.ok) throw new Error();
      setPage(await res.json());
    } catch { setError('Could not load products.'); }
    finally { setLoading(false); }
  }, [currentPage, search, category, sort, minPrice, maxPrice]);

  useEffect(() => { setCurrentPage(0); }, [search, category, sort, minPrice, maxPrice]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const SORTS = [
    { value: 'createdAt,desc', label: 'Newest' },
    { value: 'name,asc', label: 'Name A–Z' },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '120px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--blue-bright)', marginBottom: '8px' }}>Curated Selection</p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '700', color: 'var(--text-primary)' }}>Our Collection</h1>
        {page && <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '14px' }}>{page.totalElements} timepiece{page.totalElements !== 1 ? 's' : ''}</p>}
      </div>

      {/* Search + controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <svg width="16" height="16" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search timepieces…"
            style={{ width: '100%', padding: '10px 16px 10px 40px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', WebkitTextFillColor: 'var(--text-primary)' }} />
        </div>

        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}>
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <button onClick={() => setShowFilters(v => !v)}
          style={{ padding: '10px 16px', background: showFilters ? 'rgba(61,143,212,0.12)' : 'var(--bg-card)', border: `1px solid ${showFilters ? 'var(--border-active)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', color: showFilters ? 'var(--blue-bright)' : 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="4" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="16" y2="18"/></svg>
          Filters
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Min Price (₹)</label>
            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0"
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', WebkitTextFillColor: 'var(--text-primary)' }} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Max Price (₹)</label>
            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Any"
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', WebkitTextFillColor: 'var(--text-primary)' }} />
          </div>
          {(category || minPrice || maxPrice) && (
            <button onClick={() => { setCategory(''); setMinPrice(''); setMaxPrice(''); }}
              style={{ alignSelf: 'flex-end', padding: '8px 14px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#f87171' }}>
          {error} <br />
          <button onClick={fetchProducts} style={{ marginTop: '12px', padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : (page?.content ?? []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⌚</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>No Timepieces Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Try adjusting your filters or search term.</p>
          <button onClick={() => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); }}
            style={{ padding: '10px 24px', background: 'rgba(61,143,212,0.1)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-md)', color: 'var(--blue-bright)', cursor: 'pointer', fontSize: '14px' }}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {page!.content.map(p => <ProductCard key={p.id} product={p} />)}
          </div>

          {/* Pagination */}
          {page!.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}
                style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'none', color: 'var(--text-secondary)', cursor: currentPage === 0 ? 'default' : 'pointer', opacity: currentPage === 0 ? 0.4 : 1 }}>← Prev</button>
              {Array.from({ length: Math.min(5, page!.totalPages) }, (_, i) => {
                const pg = currentPage < 3 ? i : currentPage - 2 + i;
                if (pg >= page!.totalPages) return null;
                return (
                  <button key={pg} onClick={() => setCurrentPage(pg)}
                    style={{ padding: '8px 14px', border: `1px solid ${pg === currentPage ? 'var(--border-active)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', background: pg === currentPage ? 'rgba(61,143,212,0.12)' : 'none', color: pg === currentPage ? 'var(--blue-bright)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: pg === currentPage ? '600' : '400' }}>
                    {pg + 1}
                  </button>
                );
              })}
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= page!.totalPages - 1}
                style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'none', color: 'var(--text-secondary)', cursor: currentPage >= page!.totalPages - 1 ? 'default' : 'pointer', opacity: currentPage >= page!.totalPages - 1 ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
