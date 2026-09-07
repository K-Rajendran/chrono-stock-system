'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Button, StatusBadge, LoadingSpinner, Pagination, Select, EmptyState } from '@/components/ui';
import { formatCurrency, formatDateTime, prStatusLabel, prStatusColor } from '@/utils';
import { Eye, FileText, ShoppingCart, Search } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PurchaseRequestResponse } from '@/types';

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'BILL_GENERATED', label: 'Bill Generated' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function AdminPurchaseRequestsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-requests', { search, status, page }],
    queryFn: () => adminService.listPurchaseRequests({ search, status, page, size: 20 }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: number; newStatus: string }) =>
      adminService.updateRequestStatus(id, newStatus),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-requests'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Could not update status'),
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
          <h1 className="font-serif text-2xl text-white">Purchase Requests</h1>
          <p className="text-[#888] text-sm">{data?.totalElements ?? 0} total requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#888' }} />
          <input
            type="text"
            placeholder="Search reference ID, customer name..."
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
        <Select
          options={STATUS_FILTERS}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="w-44"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !data?.content.length ? (
        <EmptyState
          icon={<ShoppingCart className="w-12 h-12" />}
          title={search || status ? 'No requests match your filters' : 'No purchase requests yet'}
          description={search || status
            ? 'Try adjusting your search or status filter.'
            : 'Customer purchase requests will appear here once submitted.'}
        />
      ) : (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1E1E1E' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ borderBottom: '1px solid #1E1E1E', background: 'rgba(255,255,255,0.02)' }}>
                  <tr className="text-[#888] text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-medium">Reference</th>
                    <th className="text-left px-5 py-3 font-medium">Customer</th>
                    <th className="text-right px-5 py-3 font-medium">Amount</th>
                    <th className="text-right px-5 py-3 font-medium">Items</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((pr: PurchaseRequestResponse) => (
                    <tr key={pr.id}
                      className="hover:bg-white/2 transition-colors"
                      style={{ borderTop: '1px solid #1E1E1E' }}>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-white">{pr.referenceId}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">{pr.customerName}</p>
                        <p className="text-xs text-[#888]">{pr.customerPhone}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-serif text-white">{formatCurrency(pr.totalAmount)}</span>
                      </td>
                      <td className="px-5 py-4 text-right text-[#888]">{pr.items.length}</td>
                      <td className="px-5 py-4">
                        <StatusBadge label={prStatusLabel(pr.status)} colorClass={prStatusColor(pr.status)} />
                      </td>
                      <td className="px-5 py-4 text-[#888] text-xs whitespace-nowrap">
                        {formatDateTime(pr.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View detail */}
                          <Link href={`/admin/purchase-requests/${pr.id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-[#888] hover:text-white transition-colors" title="View request">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          {/* Quick: mark as Under Review */}
                          {pr.status === 'REQUESTED' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: pr.id, newStatus: 'UNDER_REVIEW' })}
                              disabled={updateStatusMutation.isPending}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}
                              title="Mark as Under Review"
                            >
                              Review
                            </button>
                          )}
                          {/* Generate bill quick link */}
                          {!pr.billId && !['CANCELLED', 'COMPLETED'].includes(pr.status) && (
                            <Link href={`/admin/bills/new?requestId=${pr.id}`}>
                              <button
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                style={{ background: 'rgba(184,147,58,0.1)', color: '#B8933A' }}
                                title="Generate bill"
                              >
                                <FileText className="w-3 h-3" /> Bill
                              </button>
                            </Link>
                          )}
                          {/* Link to existing bill */}
                          {pr.billId && (
                            <Link href={`/admin/bills/${pr.billId}`}>
                              <button
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                                style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}
                                title="View bill"
                              >
                                <FileText className="w-3 h-3" /> View Bill
                              </button>
                            </Link>
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
    </div>
  );
}
