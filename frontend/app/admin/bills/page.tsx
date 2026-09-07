'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Button, StatusBadge, LoadingSpinner, Pagination, Select, EmptyState, Modal } from '@/components/ui';
import { formatCurrency, formatDateTime, paymentStatusLabel, paymentStatusColor, billStatusLabel, billStatusColor } from '@/utils';
import { Plus, Search, Eye, MessageCircle, XCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { BillResponse } from '@/types';

const PAYMENT_FILTERS = [
  { value: '', label: 'All Payments' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const BILL_STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PAID', label: 'Paid' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminBillsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [billStatus, setBillStatus] = useState('');
  const [page, setPage] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<BillResponse | null>(null);
  const [waResult, setWaResult] = useState<{ link: string; message: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bills', { search, paymentStatus, billStatus, page }],
    queryFn: () => adminService.listBills({ search, paymentStatus, billStatus, page, size: 20 }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => adminService.cancelBill(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bills'] });
      toast.success('Bill cancelled — stock returned to inventory');
      setCancelTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not cancel bill'),
  });

  const whatsappMutation = useMutation({
    mutationFn: (id: number) => adminService.sendBillWhatsApp(id),
    onSuccess: (data) => {
      setWaResult({ link: data.whatsappLink, message: data.message });
      qc.invalidateQueries({ queryKey: ['admin-bills'] });
    },
    onError: () => toast.error('Could not generate WhatsApp message'),
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
          <h1 className="font-serif text-2xl text-white">Bills</h1>
          <p className="text-[#888] text-sm">{data?.totalElements ?? 0} total bills</p>
        </div>
        <Link href="/admin/bills/new">
          <Button variant="gold" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> New Bill
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#888' }} />
          <input
            type="text"
            placeholder="Search bill number, customer name..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%', height: '40px',
              paddingLeft: '2.5rem', paddingRight: '1rem',
              borderRadius: '0.5rem', border: '1px solid #1E1E1E',
              backgroundColor: '#161616', color: '#FAFAFA',
              WebkitTextFillColor: '#FAFAFA', caretColor: '#B8933A',
              fontSize: '0.875rem', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = '#B8933A'; }}
            onBlur={e => { e.target.style.borderColor = '#1E1E1E'; }}
          />
        </div>
        <Select options={PAYMENT_FILTERS} value={paymentStatus}
          onChange={(e) => { setPaymentStatus(e.target.value); setPage(0); }} className="w-36" />
        <Select options={BILL_STATUS_FILTERS} value={billStatus}
          onChange={(e) => { setBillStatus(e.target.value); setPage(0); }} className="w-36" />
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.content.length ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title={search || paymentStatus || billStatus ? 'No bills match your filters' : 'No bills yet'}
          description={search || paymentStatus || billStatus
            ? 'Try adjusting your search or filters.'
            : 'Create your first bill from a purchase request.'}
          action={
            !search && !paymentStatus && !billStatus ? (
              <Link href="/admin/bills/new">
                <Button variant="gold" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Create First Bill
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
                    <th className="text-left px-5 py-3 font-medium">Bill #</th>
                    <th className="text-left px-5 py-3 font-medium">Customer</th>
                    <th className="text-right px-5 py-3 font-medium">Total</th>
                    <th className="text-left px-5 py-3 font-medium">Payment</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((bill: BillResponse) => (
                    <tr key={bill.id}
                      className="hover:bg-white/2 transition-colors"
                      style={{ borderTop: '1px solid #1E1E1E' }}>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-white font-medium">{bill.billNumber}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">{bill.customerName}</p>
                        <p className="text-xs text-[#888]">{bill.customerPhone}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-serif text-white">{formatCurrency(bill.finalTotal)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge label={paymentStatusLabel(bill.paymentStatus)} colorClass={paymentStatusColor(bill.paymentStatus)} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge label={billStatusLabel(bill.billStatus)} colorClass={billStatusColor(bill.billStatus)} />
                      </td>
                      <td className="px-5 py-4 text-[#888] text-xs whitespace-nowrap">
                        {formatDateTime(bill.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/bills/${bill.id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-[#888] hover:text-white transition-colors" title="View bill">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          {bill.billStatus !== 'CANCELLED' && (
                            <>
                              <button
                                onClick={() => whatsappMutation.mutate(bill.id)}
                                disabled={whatsappMutation.isPending}
                                className="p-1.5 rounded-lg hover:bg-green-500/10 text-[#888] hover:text-green-400 transition-colors disabled:opacity-50"
                                title="Send WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setCancelTarget(bill)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#888] hover:text-red-400 transition-colors"
                                title="Cancel bill"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Cancel confirm */}
      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancel Bill" size="sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-red-400 font-medium mb-1">This action cannot be undone.</p>
            <p className="text-white/70">
              Cancelling <strong>{cancelTarget?.billNumber}</strong> will return all stock to inventory.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setCancelTarget(null)}>Go Back</Button>
            <Button variant="danger" loading={cancelMutation.isPending}
              onClick={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}>
              Cancel Bill &amp; Return Stock
            </Button>
          </div>
        </div>
      </Modal>

      {/* WhatsApp link modal */}
      <Modal open={!!waResult} onClose={() => setWaResult(null)} title="WhatsApp Message Ready" size="lg">
        {waResult && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 overflow-auto max-h-64" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
              <pre className="text-white text-sm whitespace-pre-wrap font-sans leading-relaxed">{waResult.message}</pre>
            </div>
            <p className="text-[#888] text-xs">Click below to open WhatsApp with this pre-filled message.</p>
            <div className="flex gap-3">
              <Button variant="gold" fullWidth className="gap-2"
                onClick={() => { window.open(waResult.link, '_blank'); setWaResult(null); }}>
                <MessageCircle className="w-4 h-4" /> Open in WhatsApp
              </Button>
              <Button variant="ghost" onClick={() => setWaResult(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
