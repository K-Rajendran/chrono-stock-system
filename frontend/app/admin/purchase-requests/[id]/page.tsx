'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Button, StatusBadge, LoadingSpinner, Select } from '@/components/ui';
import {
  formatCurrency, formatDateTime,
  prStatusLabel, prStatusColor,
} from '@/utils';
import { ArrowLeft, FileText, MessageCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Props { params: { id: string } }

const STATUS_OPTIONS = [
  { value: 'REQUESTED',      label: 'Requested' },
  { value: 'UNDER_REVIEW',   label: 'Under Review' },
  { value: 'BILL_GENERATED', label: 'Bill Generated' },
  { value: 'SENT',           label: 'Sent' },
  { value: 'PAID',           label: 'Paid' },
  { value: 'PENDING',        label: 'Pending' },
  { value: 'CANCELLED',      label: 'Cancelled' },
  { value: 'COMPLETED',      label: 'Completed' },
];

export default function AdminPurchaseRequestDetailPage({ params }: Props) {
  const id = Number(params.id);
  const router = useRouter();
  const qc = useQueryClient();
  const [newStatus, setNewStatus] = useState('');

  const { data: pr, isLoading } = useQuery({
    queryKey: ['admin-pr', id],
    queryFn: () => adminService.getPurchaseRequest(id),
    enabled: !!id,
    staleTime: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: () => adminService.updateRequestStatus(id, newStatus),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-pr', id] });
      qc.invalidateQueries({ queryKey: ['admin-requests'] });
      toast.success(`Status updated to ${prStatusLabel(data.status)}`);
      setNewStatus('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not update status'),
  });

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (!pr) return (
    <div className="text-center py-20">
      <p className="text-[#888]">Purchase request not found.</p>
      <Link href="/admin/purchase-requests">
        <Button variant="ghost" className="mt-4">← Back</Button>
      </Link>
    </div>
  );

  const isCancelled = pr.status === 'CANCELLED';
  const canGenerateBill = !pr.billId && !isCancelled
    && ['REQUESTED', 'UNDER_REVIEW', 'BILL_GENERATED'].includes(pr.status);

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/admin/purchase-requests">
            <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#888]" />
            </button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl text-white">{pr.referenceId}</h1>
            <p className="text-[#888] text-sm">{formatDateTime(pr.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canGenerateBill && (
            <Link href={`/admin/bills/new?requestId=${id}`}>
              <Button variant="gold" size="sm" className="gap-2">
                <FileText className="w-4 h-4" /> Generate Bill
              </Button>
            </Link>
          )}
          {pr.billId && (
            <Link href={`/admin/bills/${pr.billId}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" /> View Bill
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge label={prStatusLabel(pr.status)} colorClass={prStatusColor(pr.status)} />
        {pr.whatsappSentAt && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            Customer sent WhatsApp at {formatDateTime(pr.whatsappSentAt)}
          </span>
        )}
      </div>

      {/* Customer info */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
        <h2 className="font-serif text-lg text-white mb-4 border-b border-[#1E1E1E] pb-3">Customer Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-[#888] uppercase tracking-wider mb-1">Name</p>
            <p className="text-white font-medium">{pr.customerName}</p>
          </div>
          <div>
            <p className="text-xs text-[#888] uppercase tracking-wider mb-1">Phone</p>
            <p className="text-white">{pr.customerPhone}</p>
          </div>
          <div>
            <p className="text-xs text-[#888] uppercase tracking-wider mb-1">User ID</p>
            <p className="text-white font-mono text-xs">{pr.userId}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
        <h2 className="font-serif text-lg text-white mb-4 border-b border-[#1E1E1E] pb-3">
          Items ({pr.items.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#888] text-xs uppercase tracking-wider">
                <th className="text-left pb-3 font-medium">Product</th>
                <th className="text-right pb-3 font-medium">Unit Price</th>
                <th className="text-right pb-3 font-medium pr-2">Qty</th>
                <th className="text-right pb-3 font-medium">Discount</th>
                <th className="text-right pb-3 font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {pr.items.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="py-3 text-white font-medium">{item.productName}</td>
                  <td className="py-3 text-right text-[#888]">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 text-right text-[#888] pr-2">{item.quantity}</td>
                  <td className="py-3 text-right text-[#888] text-xs">
                    {item.discountValue > 0
                      ? (item.discountType === 'PERCENTAGE' ? `${item.discountValue}%` : formatCurrency(item.discountValue))
                      : '—'}
                  </td>
                  <td className="py-3 text-right text-white font-medium">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-5 pt-4 flex justify-end" style={{ borderTop: '1px solid #1E1E1E' }}>
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-[#888]">
              <span>Subtotal</span>
              <span>{formatCurrency(pr.subtotal)}</span>
            </div>
            {pr.totalDiscount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span>-{formatCurrency(pr.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-serif text-xl text-white pt-2"
              style={{ borderTop: '1px solid #1E1E1E' }}>
              <span>Total</span>
              <span className="gold-text">{formatCurrency(pr.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {pr.notes && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
          <p className="text-xs text-[#888] uppercase tracking-wider mb-1">Customer Notes</p>
          <p className="text-sm text-white/70">{pr.notes}</p>
        </div>
      )}

      {/* Status update */}
      {!isCancelled && (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(184,147,58,0.04)', border: '1px solid rgba(184,147,58,0.2)' }}>
          <h2 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#B8933A]" />
            Update Status
          </h2>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Select
                label="New Status"
                options={STATUS_OPTIONS.filter(s => s.value !== pr.status)}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="Select new status..."
              />
            </div>
            <Button
              variant="gold"
              disabled={!newStatus}
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate()}
              className="flex-shrink-0"
            >
              Update
            </Button>
          </div>
        </div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-red-400 font-medium">This purchase request has been cancelled.</p>
        </div>
      )}
    </div>
  );
}
