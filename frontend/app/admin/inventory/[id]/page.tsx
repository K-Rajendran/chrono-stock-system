'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { adminService } from '@/services';
import { Button, Input, Select, LoadingSpinner, Pagination, StatusBadge } from '@/components/ui';
import { ArrowLeft, Plus, Minus, RefreshCw, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { formatDateTime } from '@/utils';
import { cn } from '@/utils';

interface Props { params: { id: string } }

const TXN_TYPES = [
  { value: 'PURCHASE',     label: '+ Purchase (Add Stock)' },
  { value: 'RETURN',       label: '+ Return (Add Stock)' },
  { value: 'ADJUSTMENT',   label: '+ Adjustment (Add Stock)' },
  { value: 'CANCELLATION', label: '+ Cancellation Return' },
];

export default function InventoryDetailPage({ params }: Props) {
  const id = Number(params.id);
  const router = useRouter();
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [txnType, setTxnType] = useState('PURCHASE');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');

  const { data: product, isLoading: prodLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminService.getProduct(id),
    enabled: !!id,
  });

  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ['inventory-history', id, page],
    queryFn: () => adminService.getInventoryHistory(id, page, 20),
    enabled: !!id,
    staleTime: 30_000,
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      adminService.adjustStock(id, {
        type: txnType,
        quantity: Number(quantity),
        reason: reason.trim() || `Manual ${txnType.toLowerCase()}`,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-product', id] });
      qc.invalidateQueries({ queryKey: ['inventory-history', id] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      qc.invalidateQueries({ queryKey: ['out-of-stock'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Stock adjusted successfully');
      setQuantity('1');
      setReason('');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Could not adjust stock'),
  });

  const handleAdjust = () => {
    const qty = Number(quantity);
    if (!qty || qty < 1) { toast.error('Enter a valid quantity (min 1)'); return; }
    adjustMutation.mutate();
  };

  const stockColor = (status: string) => {
    if (status === 'IN_STOCK') return 'text-green-400 bg-green-400/10';
    if (status === 'LOW_STOCK') return 'text-yellow-400 bg-yellow-400/10';
    return 'text-red-400 bg-red-400/10';
  };

  if (prodLoading) return <LoadingSpinner size="lg" />;
  if (!product) return (
    <div className="text-center py-20">
      <p className="text-[#888]">Product not found.</p>
      <Link href="/admin/inventory"><Button variant="ghost" className="mt-4">← Back to Inventory</Button></Link>
    </div>
  );

  const p = product as any;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/inventory">
          <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#888]" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl text-white truncate">{p.name}</h1>
          <p className="text-[#888] text-xs font-mono">{p.sku}</p>
        </div>
        <StatusBadge
          label={p.stockStatus === 'IN_STOCK' ? 'In Stock' : p.stockStatus === 'LOW_STOCK' ? 'Low Stock' : 'Out of Stock'}
          colorClass={stockColor(p.stockStatus)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stock info + adjustment */}
        <div className="lg:col-span-1 space-y-4">
          {/* Current stock card */}
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
            <p className="text-xs text-[#888] uppercase tracking-widest mb-2">Current Stock</p>
            <p className={cn('font-serif text-6xl font-bold mb-1',
              p.stockQuantity === 0 ? 'text-red-400' :
              p.stockQuantity <= p.lowStockThreshold ? 'text-yellow-400' : 'text-[#B8933A]'
            )}>
              {p.stockQuantity}
            </p>
            <p className="text-xs text-[#888]">Low stock threshold: {p.lowStockThreshold} units</p>

            {p.primaryImageUrl && (
              <img
                src={p.primaryImageUrl}
                alt={p.name}
                className="w-20 h-20 object-cover rounded-xl mx-auto mt-4 opacity-60"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Selling Price', value: `₹${Number(p.sellingPrice).toLocaleString('en-IN')}` },
              { label: 'Purchase Cost', value: `₹${Number(p.purchaseCost).toLocaleString('en-IN')}` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
                <p className="text-[10px] text-[#888] uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm font-medium text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Adjust stock form */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(184,147,58,0.04)', border: '1px solid rgba(184,147,58,0.2)' }}>
            <h2 className="font-serif text-lg text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#B8933A]" />
              Adjust Stock
            </h2>

            <Select
              label="Transaction Type"
              options={TXN_TYPES}
              value={txnType}
              onChange={(e) => setTxnType(e.target.value)}
            />

            <Input
              label="Quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
            />

            <Input
              label="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. New stock received"
            />

            {quantity && Number(quantity) > 0 && (
              <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1E1E1E' }}>
                <p className="text-[#888]">
                  After adjustment:{' '}
                  <span className="text-white font-medium">
                    {p.stockQuantity + Number(quantity)} units
                  </span>
                </p>
              </div>
            )}

            <Button
              variant="gold"
              fullWidth
              onClick={handleAdjust}
              loading={adjustMutation.isPending}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Apply Adjustment
            </Button>
          </div>
        </div>

        {/* Right: Transaction history */}
        <div className="lg:col-span-2">
          <h2 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#B8933A]" />
            Transaction History
          </h2>

          {histLoading ? (
            <LoadingSpinner />
          ) : !history?.content.length ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
              <BarChart2 className="w-10 h-10 text-[#333] mx-auto mb-3" />
              <p className="text-[#888] text-sm">No inventory transactions recorded yet.</p>
              <p className="text-[#555] text-xs mt-1">Adjustments will appear here once applied.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1E1E1E' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ borderBottom: '1px solid #1E1E1E', background: 'rgba(255,255,255,0.02)' }}>
                      <tr className="text-[#888] text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3 font-medium">Type</th>
                        <th className="text-right px-4 py-3 font-medium">Change</th>
                        <th className="text-right px-4 py-3 font-medium">Before</th>
                        <th className="text-right px-4 py-3 font-medium">After</th>
                        <th className="text-left px-4 py-3 font-medium">Reason</th>
                        <th className="text-left px-4 py-3 font-medium">By</th>
                        <th className="text-left px-4 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.content.map((tx: any) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-white/2 transition-colors"
                          style={{ borderTop: '1px solid #1E1E1E' }}
                        >
                          <td className="px-4 py-3">
                            <span className={cn(
                              'text-xs font-medium px-2 py-0.5 rounded-full',
                              tx.quantityChange > 0
                                ? 'text-green-400 bg-green-400/10'
                                : 'text-red-400 bg-red-400/10'
                            )}>
                              {tx.transactionType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium">
                            <span className={tx.quantityChange > 0 ? 'text-green-400' : 'text-red-400'}>
                              {tx.quantityChange > 0 ? '+' : ''}{tx.quantityChange}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-[#888]">{tx.quantityBefore}</td>
                          <td className="px-4 py-3 text-right text-white font-medium">{tx.quantityAfter}</td>
                          <td className="px-4 py-3 text-[#888] text-xs max-w-[140px] truncate">{tx.reason || '—'}</td>
                          <td className="px-4 py-3 text-[#888] text-xs">{tx.performedByName}</td>
                          <td className="px-4 py-3 text-[#888] text-xs whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination
                page={page}
                totalPages={history.totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
