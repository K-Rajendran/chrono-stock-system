'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Bill {
  id: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  finalTotal: number;
  paymentStatus: string;
  billStatus: string;
  createdAt: string;
  items: unknown[];
}

interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; }

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const BILL_STATUSES = ['', 'PENDING', 'PAID', 'PARTIAL', 'CANCELLED'];

export default function AdminBillsPage() {
  const [page, setPage] = useState<Page<Bill> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      const params = new URLSearchParams({ page: String(currentPage), size: '10', sort: 'createdAt,desc' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('paymentStatus', statusFilter);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bills?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setPage(await res.json());
    } catch { setError('Failed to load bills.'); }
    finally { setLoading(false); }
  }, [currentPage, search, statusFilter]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: '700', color: 'var(--text-primary)' }}>Bills</h1>
        <Link href="/admin/bills/new"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--gold-gradient)', color: '#000', fontWeight: '700', fontSize: '13px', borderRadius: 'var(--radius-md)', textDecoration: 'none', boxShadow: 'var(--shadow-gold)' }}>
          + Create Bill
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by bill #, customer…"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(0); }}
          style={{ flex: '1 1 220px', padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', WebkitTextFillColor: 'var(--text-primary)' }}
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(0); }}
          style={{ padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
        >
          {BILL_STATUSES.map(s => <option key={s} value={s}>{s || 'All Payment Statuses'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? <LoadingSpinner message="Loading bills…" /> : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#f87171' }}>{error}</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(8,20,40,0.5)' }}>
                    {['Bill #', 'Customer', 'Total', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: h === 'Total' ? 'right' : 'left', fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(page?.content ?? []).length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No bills found.</td></tr>
                  ) : (page?.content ?? []).map((bill, i) => (
                    <tr key={bill.id} style={{ borderBottom: i < (page!.content.length - 1) ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px' }}>#{bill.billNumber}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{bill.customerName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{bill.customerPhone}</div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--gold)' }}>{fmt(bill.finalTotal)}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={bill.paymentStatus} size="sm" /></td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={bill.billStatus} size="sm" /></td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>{fmtDate(bill.createdAt)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link href={`/admin/bills/${bill.id}`}
                          style={{ padding: '5px 12px', fontSize: '12px', background: 'rgba(61,143,212,0.1)', border: '1px solid rgba(61,143,212,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--blue-bright)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {page && page.totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{page.totalElements} bill{page.totalElements !== 1 ? 's' : ''}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}
                    style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--text-secondary)', cursor: currentPage === 0 ? 'default' : 'pointer', opacity: currentPage === 0 ? 0.4 : 1 }}>←</button>
                  <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{currentPage + 1} / {page.totalPages}</span>
                  <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= page.totalPages - 1}
                    style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--text-secondary)', cursor: currentPage >= page.totalPages - 1 ? 'default' : 'pointer', opacity: currentPage >= page.totalPages - 1 ? 0.4 : 1 }}>→</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
