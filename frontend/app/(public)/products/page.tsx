'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { productService } from '@/services';
import { ProductCard } from '@/components/ui/ProductCard';
import { SkeletonCard, Pagination, Select, EmptyState } from '@/components/ui';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';

const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Newest First' },
  { value: 'sellingPrice,asc', label: 'Price: Low to High' },
  { value: 'sellingPrice,desc', label: 'Price: High to Low' },
  { value: 'name,asc', label: 'Name: A–Z' },
];

const STOCK_OPTIONS = [
  { value: '', label: 'All Availability' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') ?? '');

  const getParam = (key: string, fallback = '') => searchParams.get(key) ?? fallback;

  const search      = getParam('search');
  const categoryId  = getParam('categoryId') ? Number(getParam('categoryId')) : undefined;
  const minPrice    = getParam('minPrice') ? Number(getParam('minPrice')) : undefined;
  const maxPrice    = getParam('maxPrice') ? Number(getParam('maxPrice')) : undefined;
  const stockStatus = getParam('stockStatus');
  const page        = Number(getParam('page', '0'));
  const sortRaw     = getParam('sort', 'createdAt,desc');
  const [sortBy, sortDir] = sortRaw.split(',');

  const updateParam = useCallback((key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '0');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', { search, categoryId, minPrice, maxPrice, stockStatus, page, sortBy, sortDir }],
    queryFn: () => productService.list({ search, categoryId, minPrice, maxPrice, stockStatus, page, size: 12, sortBy, sortDir }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const hasActiveFilters = !!(search || categoryId || minPrice || maxPrice || stockStatus);

  const clearFilters = () => {
    setLocalSearch('');
    router.replace(pathname, { scroll: false });
  };

  const handleSearchSubmit = (val: string) => {
    updateParam('search', val);
  };

  return (
    <div className="container-wide py-10">
      {/* Page header */}
      <div className="mb-10">
        <p className="text-[#B8933A] text-xs tracking-[0.4em] uppercase mb-2">Collection</p>
        <h1 className="font-serif text-3xl lg:text-4xl text-white">All Timepieces</h1>
        {data && (
          <p className="text-[#888] text-sm mt-2">{data.totalElements} watch{data.totalElements !== 1 ? 'es' : ''} found</p>
        )}
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search input — forced inline styles */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#888' }} />
          <input
            type="text"
            placeholder="Search watches, brands..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit(localSearch); }}
            onBlur={() => handleSearchSubmit(localSearch)}
            style={{
              width: '100%', height: '44px',
              paddingLeft: '2.75rem', paddingRight: '1rem',
              borderRadius: '0.5rem', border: '1px solid #1E1E1E',
              backgroundColor: '#161616', color: '#FAFAFA',
              WebkitTextFillColor: '#FAFAFA', caretColor: '#B8933A',
              fontSize: '0.875rem', outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#B8933A'; }}
          />
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <Select
            options={SORT_OPTIONS}
            value={sortRaw}
            onChange={e => updateParam('sort', e.target.value)}
            className="w-52"
            aria-label="Sort products"
          />
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={cn(
              'flex items-center gap-2 h-11 px-4 rounded-lg border text-sm font-medium transition-all',
              filtersOpen || hasActiveFilters
                ? 'border-[#B8933A] text-[#B8933A]'
                : 'border-[#1E1E1E] text-white/70 hover:border-[#B8933A]/50'
            )}
            style={{
              backgroundColor: filtersOpen || hasActiveFilters ? 'rgba(184,147,58,0.08)' : '#161616',
            }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: '#B8933A' }} />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 h-11 px-3 rounded-lg border text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: '#161616' }}
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden mb-8"
          >
            <div className="rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
              {/* Category filter */}
              <Select
                label="Category"
                value={categoryId?.toString() ?? ''}
                onChange={e => updateParam('categoryId', e.target.value)}
                options={categories?.map(c => ({ value: c.id, label: c.name })) ?? []}
                placeholder="All Categories"
              />

              {/* Price range */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/70 tracking-wider uppercase">Min Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  defaultValue={minPrice}
                  onBlur={e => updateParam('minPrice', e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%', height: '44px', padding: '0 1rem',
                    borderRadius: '0.5rem', border: '1px solid #1E1E1E',
                    backgroundColor: '#161616', color: '#FAFAFA',
                    WebkitTextFillColor: '#FAFAFA', caretColor: '#B8933A',
                    fontSize: '0.875rem', outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#B8933A'; }}
                  onBlurCapture={e => { e.target.style.borderColor = '#1E1E1E'; }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/70 tracking-wider uppercase">Max Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  defaultValue={maxPrice}
                  onBlur={e => updateParam('maxPrice', e.target.value)}
                  placeholder="Any"
                  style={{
                    width: '100%', height: '44px', padding: '0 1rem',
                    borderRadius: '0.5rem', border: '1px solid #1E1E1E',
                    backgroundColor: '#161616', color: '#FAFAFA',
                    WebkitTextFillColor: '#FAFAFA', caretColor: '#B8933A',
                    fontSize: '0.875rem', outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#B8933A'; }}
                  onBlurCapture={e => { e.target.style.borderColor = '#1E1E1E'; }}
                />
              </div>

              {/* Stock status */}
              <Select
                label="Availability"
                value={stockStatus}
                onChange={e => updateParam('stockStatus', e.target.value)}
                options={STOCK_OPTIONS}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !data?.content.length ? (
        <EmptyState
          icon={<span className="text-6xl">⌚</span>}
          title="No watches found"
          description="Try adjusting your search or filters to find what you're looking for."
          action={
            <button onClick={clearFilters} className="text-[#B8933A] text-sm hover:underline">
              Clear all filters
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.content.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          <Pagination
            page={data.number}
            totalPages={data.totalPages}
            onPageChange={p => updateParam('page', p.toString())}
          />
        </>
      )}
    </div>
  );
}
