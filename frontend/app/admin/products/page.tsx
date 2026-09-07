'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Button, StatusBadge, LoadingSpinner, Pagination, Select, EmptyState, Modal } from '@/components/ui';
import { formatCurrency } from '@/utils';
import { Plus, Search, Edit2, Trash2, Package, BarChart2, Eye } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/utils';
import { ProductAdmin } from '@/types';

const STOCK_FILTERS = [
  { value: '', label: 'All Stock' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
];

const stockBadge = (s: string) => ({
  IN_STOCK:     { label: 'In Stock',     cls: 'text-green-400 bg-green-400/10' },
  LOW_STOCK:    { label: 'Low Stock',    cls: 'text-yellow-400 bg-yellow-400/10' },
  OUT_OF_STOCK: { label: 'Out of Stock', cls: 'text-red-400 bg-red-400/10' },
}[s] ?? { label: s, cls: 'text-[#888] bg-[#888]/10' });

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(0);
  const [deactivateTarget, setDeactivateTarget] = useState<ProductAdmin | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', { search, stockStatus, page }],
    queryFn: () => adminService.listProducts({ search, stockStatus, page, size: 20 }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => adminService.deactivateProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deactivated');
      setDeactivateTarget(null);
    },
    onError: () => toast.error('Could not deactivate product'),
  });

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(0);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl text-white">Products</h1>
          <p className="text-[#888] text-sm">{data?.totalElements ?? 0} total products</p>
        </div>
        <Link href="/admin/products/new">
          <Button variant="gold" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search — forced inline styles to guarantee text visibility */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#888' }} />
          <input
            type="text"
            placeholder="Search products, brands, SKUs..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              paddingLeft: '2.5rem',
              paddingRight: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #1E1E1E',
              backgroundColor: '#161616',
              color: '#FAFAFA',
              WebkitTextFillColor: '#FAFAFA',
              caretColor: '#B8933A',
              fontSize: '0.875rem',
              outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = '#B8933A'; }}
            onBlur={e => { e.target.style.borderColor = '#1E1E1E'; }}
          />
        </div>
        <Select
          options={STOCK_FILTERS}
          value={stockStatus}
          onChange={(e) => { setStockStatus(e.target.value); setPage(0); }}
          className="w-44"
          aria-label="Filter by stock status"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.content.length ? (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title={search || stockStatus ? 'No products match your filters' : 'No products yet'}
          description={search || stockStatus
            ? 'Try adjusting your search or filters.'
            : 'Add your first timepiece to get started.'}
          action={
            !search && !stockStatus ? (
              <Link href="/admin/products/new">
                <Button variant="gold" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Add First Product
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1E1E1E' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ borderBottom: '1px solid #1E1E1E', background: 'rgba(255,255,255,0.02)' }}>
                  <tr className="text-[#888] text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-medium">Product</th>
                    <th className="text-left px-5 py-3 font-medium">SKU</th>
                    <th className="text-right px-5 py-3 font-medium">Cost</th>
                    <th className="text-right px-5 py-3 font-medium">Price</th>
                    <th className="text-right px-5 py-3 font-medium">Stock</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((p: ProductAdmin) => {
                    const badge = stockBadge(p.stockStatus);
                    const stockQty = (p as any).stockQuantity ?? 0;
                    const threshold = (p as any).lowStockThreshold ?? 5;
                    return (
                      <tr
                        key={p.id}
                        className={cn('hover:bg-white/2 transition-colors', !(p as any).active && 'opacity-50')}
                        style={{ borderTop: '1px solid #1E1E1E' }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {p.primaryImageUrl && (
                              <img
                                src={p.primaryImageUrl}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            )}
                            <div>
                              <p className="font-medium text-white leading-tight">{p.name}</p>
                              {p.brand && <p className="text-xs text-[#888]">{p.brand}</p>}
                              {!(p as any).active && (
                                <span className="text-xs text-red-400">(Inactive)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[#888] font-mono text-xs">{p.sku}</td>
                        <td className="px-5 py-4 text-right text-[#888]">
                          {formatCurrency((p as any).purchaseCost ?? 0)}
                        </td>
                        <td className="px-5 py-4 text-right text-white font-medium">
                          {formatCurrency(p.effectivePrice)}
                          {p.discountAmount > 0 && (
                            <p className="text-xs text-[#888] line-through">{formatCurrency(p.sellingPrice)}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={cn('font-bold text-base',
                            stockQty === 0 ? 'text-red-400' :
                            stockQty <= threshold ? 'text-yellow-400' : 'text-white')}>
                            {stockQty}
                          </span>
                          <p className="text-xs text-[#888]">min {threshold}</p>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge label={badge.label} colorClass={badge.cls} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View on store */}
                            <Link href={`/products/${p.id}`} target="_blank">
                              <button className="p-1.5 rounded-lg hover:bg-white/10 text-[#888] hover:text-white transition-colors" title="View on store">
                                <Eye className="w-4 h-4" />
                              </button>
                            </Link>
                            {/* Inventory */}
                            <Link href={`/admin/inventory/${p.id}`}>
                              <button className="p-1.5 rounded-lg hover:bg-white/10 text-[#888] hover:text-white transition-colors" title="Manage stock">
                                <BarChart2 className="w-4 h-4" />
                              </button>
                            </Link>
                            {/* Edit */}
                            <Link href={`/admin/products/${p.id}/edit`}>
                              <button className="p-1.5 rounded-lg hover:bg-white/10 text-[#888] hover:text-white transition-colors" title="Edit product">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </Link>
                            {/* Deactivate */}
                            {(p as any).active && (
                              <button
                                onClick={() => setDeactivateTarget(p)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#888] hover:text-red-400 transition-colors"
                                title="Deactivate"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Deactivate confirm modal */}
      <Modal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate Product"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[#888] text-sm">
            Deactivating <strong className="text-white">"{deactivateTarget?.name}"</strong> will hide it from customers.
            You can re-enable it anytime via Edit.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeactivateTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deactivateMutation.isPending}
              onClick={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
            >
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
