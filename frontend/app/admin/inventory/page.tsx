'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Button, StatusBadge, LoadingSpinner, Modal, Select, Input, EmptyState, Pagination } from '@/components/ui';
import { formatDateTime } from '@/utils';
import { AlertTriangle, Package, BarChart2, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

const stockBadge = (s: string) => ({
  IN_STOCK:     { label: 'In Stock',     cls: 'text-green-400 bg-green-400/10' },
  LOW_STOCK:    { label: 'Low Stock',    cls: 'text-yellow-400 bg-yellow-400/10' },
  OUT_OF_STOCK: { label: 'Out of Stock', cls: 'text-red-400 bg-red-400/10' },
}[s] ?? { label: s, cls: 'text-[#888] bg-[#888]/10' });

export default function AdminInventoryPage() {
  const qc = useQueryClient();

  const { data: lowStock, isLoading: lowLoading, refetch: refetchLow } = useQuery({
    queryKey: ['low-stock'],
    queryFn: adminService.getLowStock,
    staleTime: 60_000,
  });

  const { data: outOfStock, isLoading: outLoading, refetch: refetchOut } = useQuery({
    queryKey: ['out-of-stock'],
    queryFn: adminService.getOutOfStock,
    staleTime: 60_000,
  });

  const refetchAll = () => { refetchLow(); refetchOut(); };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-white">Inventory</h1>
          <p className="text-[#888] text-sm">Monitor stock levels and adjust quantities</p>
        </div>
        <Button variant="glass" size="sm" onClick={refetchAll} className="gap-2">
          <BarChart2 className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Low Stock',    value: lowStock?.length ?? '—', color: 'text-yellow-400' },
          { label: 'Out of Stock', value: outOfStock?.length ?? '—', color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
            <p className={cn('font-serif text-3xl font-bold', color)}>{value}</p>
            <p className="text-xs text-[#888] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Low Stock Table */}
      <ProductTable
        title="Low Stock Alerts"
        icon={<AlertTriangle className="w-4 h-4 text-yellow-400" />}
        products={lowStock ?? []}
        isLoading={lowLoading}
        emptyMessage="All stock levels are healthy."
      />

      {/* Out of Stock Table */}
      <ProductTable
        title="Out of Stock"
        icon={<Package className="w-4 h-4 text-red-400" />}
        products={outOfStock ?? []}
        isLoading={outLoading}
        emptyMessage="No out-of-stock products."
      />
    </div>
  );
}

function ProductTable({
  title, icon, products, isLoading, emptyMessage,
}: {
  title: string; icon: React.ReactNode;
  products: any[]; isLoading: boolean; emptyMessage: string;
}) {
  return (
    <div>
      <h2 className="text-xs text-[#888] uppercase tracking-wider font-medium flex items-center gap-2 mb-4">
        {icon} {title} ({products.length})
      </h2>

      {isLoading ? <LoadingSpinner /> : !products.length ? (
        <div className="rounded-xl p-6 text-center text-sm text-[#888]"
          style={{ border: '1px solid #1E1E1E', background: 'rgba(255,255,255,0.01)' }}>
          {emptyMessage}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1E1E1E' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ borderBottom: '1px solid #1E1E1E', background: 'rgba(255,255,255,0.02)' }}>
                <tr className="text-[#888] text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Product</th>
                  <th className="text-left px-5 py-3 font-medium">SKU</th>
                  <th className="text-right px-5 py-3 font-medium">Stock</th>
                  <th className="text-right px-5 py-3 font-medium">Threshold</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => {
                  const badge = stockBadge(p.stockStatus);
                  return (
                    <tr key={p.id} className="hover:bg-white/2 transition-colors"
                      style={{ borderTop: '1px solid #1E1E1E' }}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{p.name}</p>
                        {p.brand && <p className="text-xs text-[#888]">{p.brand}</p>}
                      </td>
                      <td className="px-5 py-4 text-[#888] font-mono text-xs">{p.sku}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={cn('font-bold text-base',
                          p.stockQuantity === 0 ? 'text-red-400' :
                          p.stockQuantity <= p.lowStockThreshold ? 'text-yellow-400' : 'text-white')}>
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-[#888]">{p.lowStockThreshold}</td>
                      <td className="px-5 py-4">
                        <StatusBadge label={badge.label} colorClass={badge.cls} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Link to per-product inventory detail page */}
                          <Link href={`/admin/inventory/${p.id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-[#888] hover:text-white transition-colors"
                              title="View history & adjust">
                              <BarChart2 className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/admin/inventory/${p.id}`}>
                            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              style={{ background: 'rgba(184,147,58,0.1)', color: '#B8933A' }}
                              title="Adjust stock">
                              Restock <ArrowRight className="w-3 h-3" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
