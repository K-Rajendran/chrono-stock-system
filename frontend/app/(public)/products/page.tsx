'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { productService } from '@/services';
import { ProductCard } from '@/components/ui/ProductCard';
import { SkeletonCard, Pagination, Select, EmptyState } from '@/components/ui';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SORT_OPTIONS = [
  { value: 'createdAt,desc',    label: 'Newest First' },
  { value: 'sellingPrice,asc',  label: 'Price: Low → High' },
  { value: 'sellingPrice,desc', label: 'Price: High → Low' },
  { value: 'name,asc',          label: 'Name: A–Z' },
];

const STOCK_OPTIONS = [
  { value: '',          label: 'All Availability' },
  { value: 'IN_STOCK',  label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
];

const INLINE_INPUT: React.CSSProperties = {
  backgroundColor: '#141414', color: '#F5F5F0',
  WebkitTextFillColor: '#F5F5F0', caretColor: '#B8933A',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
  fontSize: '14px', outline: 'none', width: '100%',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') ?? '');

  const gp = (k: string, fb = '') => searchParams.get(k) ?? fb;
  const search      = gp('search');
  const categoryId  = gp('categoryId') ? Number(gp('categoryId')) : undefined;
  const minPrice    = gp('minPrice')   ? Number(gp('minPrice'))   : undefined;
  const maxPrice    = gp('maxPrice')   ? Number(gp('maxPrice'))   : undefined;
  const stockStatus = gp('stockStatus');
  const page        = Number(gp('page', '0'));
  const sortRaw     = gp('sort', 'createdAt,desc');
  const [sortBy, sortDir] = sortRaw.split(',');

  const upd = useCallback((key: string, value: string | undefined) => {
    const p = new URLSearchParams(searchParams.toString());
    value ? p.set(key, value) : p.delete(key);
    p.set('page', '0');
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: productService.getCategories });
  const { data, isLoading } = useQuery({
    queryKey: ['products', { search, categoryId, minPrice, maxPrice, stockStatus, page, sortBy, sortDir }],
    queryFn: () => productService.list({ search, categoryId, minPrice, maxPrice, stockStatus, page, size: 12, sortBy, sortDir }),
    staleTime: 30_000, placeholderData: (p: any) => p,
  });

  const hasFilters = !!(search || categoryId || minPrice || maxPrice || stockStatus);
  const clearAll = () => { setLocalSearch(''); router.replace(pathname, { scroll: false }); };

  return (
    <div style={{ background: '#080808', minHeight: '100vh', paddingTop: '68px' }}>
      <div className="container-wide" style={{ paddingTop: '48px', paddingBottom: '80px' }}>

        {/* Page header */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#B8933A', fontWeight: 600, marginBottom: '10px' }}>Collection</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,3.5vw,42px)', color: '#F5F5F0', fontWeight: 400 }}>All Timepieces</h1>
            {data && <p style={{ fontSize: '13px', color: '#5A5A55' }}>{data.totalElements} piece{data.totalElements !== 1 ? 's' : ''}</p>}
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#5A5A55', pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Search watches, brands…"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && upd('search', localSearch)}
              onBlur={() => upd('search', localSearch)}
              style={{ ...INLINE_INPUT, height: '42px', paddingLeft: '40px', paddingRight: '14px' }}
              onFocus={e => { e.target.style.borderColor = '#B8933A'; e.target.style.boxShadow = '0 0 0 3px rgba(184,147,58,0.1)'; }}
            />
          </div>

          {/* Sort */}
          <div style={{ position: 'relative', minWidth: '190px' }}>
            <select value={sortRaw} onChange={e => upd('sort', e.target.value)}
              style={{ ...INLINE_INPUT, height: '42px', padding: '0 32px 0 14px', appearance: 'none', cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = '#B8933A'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#1A1A1A' }}>{o.label}</option>)}
            </select>
            <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#5A5A55', pointerEvents: 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
          </div>

          {/* Filter toggle */}
          <button onClick={() => setFiltersOpen(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: '7px', height: '42px', padding: '0 16px',
            borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            border: filtersOpen || hasFilters ? '1px solid rgba(184,147,58,0.5)' : '1px solid rgba(255,255,255,0.08)',
            background: filtersOpen || hasFilters ? 'rgba(184,147,58,0.07)' : '#141414',
            color: filtersOpen || hasFilters ? '#B8933A' : 'rgba(245,245,240,0.6)',
            transition: 'all 0.2s',
          }}>
            <SlidersHorizontal size={14} /> Filters
            {hasFilters && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B8933A', flexShrink: 0 }} />}
          </button>

          {hasFilters && (
            <button onClick={clearAll} style={{
              display: 'flex', alignItems: 'center', gap: '5px', height: '42px', padding: '0 14px',
              borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
              border: '1px solid rgba(239,68,68,0.25)', background: '#141414', color: '#f87171', transition: 'all 0.2s',
            }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden', marginBottom: '28px' }}>
              <div style={{ padding: '20px', borderRadius: '14px', background: '#141414', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '16px' }}>
                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '6px' }}>Category</label>
                  <div style={{ position: 'relative' }}>
                    <select value={categoryId?.toString() ?? ''} onChange={e => upd('categoryId', e.target.value)}
                      style={{ ...INLINE_INPUT, height: '40px', padding: '0 30px 0 12px', appearance: 'none', cursor: 'pointer' }}>
                      <option value="" style={{ background: '#1A1A1A' }}>All Categories</option>
                      {categories?.map(c => <option key={c.id} value={c.id} style={{ background: '#1A1A1A' }}>{c.name}</option>)}
                    </select>
                    <svg style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: '#5A5A55', pointerEvents: 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
                {/* Min Price */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '6px' }}>Min Price (₹)</label>
                  <input type="number" min={0} defaultValue={minPrice} placeholder="0" onBlur={e => upd('minPrice', e.target.value)}
                    style={{ ...INLINE_INPUT, height: '40px', padding: '0 12px' }} />
                </div>
                {/* Max Price */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '6px' }}>Max Price (₹)</label>
                  <input type="number" min={0} defaultValue={maxPrice} placeholder="Any" onBlur={e => upd('maxPrice', e.target.value)}
                    style={{ ...INLINE_INPUT, height: '40px', padding: '0 12px' }} />
                </div>
                {/* Availability */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '6px' }}>Availability</label>
                  <div style={{ position: 'relative' }}>
                    <select value={stockStatus} onChange={e => upd('stockStatus', e.target.value)}
                      style={{ ...INLINE_INPUT, height: '40px', padding: '0 30px 0 12px', appearance: 'none', cursor: 'pointer' }}>
                      {STOCK_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#1A1A1A' }}>{o.label}</option>)}
                    </select>
                    <svg style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '13px', height: '13px', color: '#5A5A55', pointerEvents: 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '20px' }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !data?.content.length ? (
          <EmptyState icon={<span style={{ fontSize: '56px' }}>⌚</span>}
            title="No timepieces found"
            description="Try adjusting your search or filters."
            action={<button onClick={clearAll} style={{ color: '#B8933A', fontSize: '14px', textDecoration: 'underline', cursor: 'pointer' }}>Clear filters</button>}
          />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '20px' }}>
              {data.content.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
            <Pagination page={data.number} totalPages={data.totalPages} onPageChange={p => upd('page', p.toString())} />
          </>
        )}
      </div>
    </div>
  );
}
