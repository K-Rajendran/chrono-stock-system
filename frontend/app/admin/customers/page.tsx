'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  totalBills: number;
  totalSpend: number;
  lastOrderAt?: string;
}

interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; }

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminCustomersPage() {
  const [page, setPage] = useState<Page<Customer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      const params = new URLSearchParams({ page: String(currentPage), size: '15', sort: 'createdAt,desc' });
      if (search) params.set('search', search);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setPage(await res.json());
    } catch {
      setError('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => { setCurrentPage(0); }, [search]);
  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.4rem, 3vw, 2rem)',
          fontWeight: '700',
          color: 'var(--text-primary)',
        }}>
          Customers
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Registered customer accounts and their purchase history.
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', maxWidth: '380px' }}>
          <svg
            width="15" height="15" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 38px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              WebkitTextFillColor: 'var(--text-primary)',
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-active)'; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
        </div>
      </div>

      {/* Table card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <LoadingSpinner message="Loading customers…" />
        ) : error ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#f87171' }}>
            {error}
            <br />
            <button
              onClick={fetchCustomers}
              style={{ marginTop: '12px', padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(8,20,40,0.5)' }}>
                    {['Customer', 'Contact', 'Member Since', 'Total Orders', 'Total Spend', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '12px 16px',
                        textAlign: h === 'Total Orders' || h === 'Total Spend' ? 'right' : 'left',
                        fontSize: '11px',
                        fontWeight: '600',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(page?.content ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>👤</div>
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    (page?.content ?? []).map((customer, i) => (
                      <tr
                        key={customer.id}
                        style={{
                          borderBottom: i < (page!.content.length - 1) ? '1px solid var(--border)' : 'none',
                          transition: 'background var(--transition)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(61,143,212,0.03)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        {/* Avatar + name */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'var(--gold-gradient)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '700',
                              color: '#000',
                              flexShrink: 0,
                            }}>
                              {customer.name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                              {customer.name}
                            </span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '2px' }}>
                            {customer.email}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                            {customer.phone}
                          </div>
                        </td>

                        {/* Member since */}
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {fmtDate(customer.createdAt)}
                        </td>

                        {/* Total bills */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            background: customer.totalBills > 0 ? 'rgba(61,143,212,0.1)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${customer.totalBills > 0 ? 'rgba(61,143,212,0.25)' : 'var(--border)'}`,
                            borderRadius: '50%',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: customer.totalBills > 0 ? 'var(--blue-bright)' : 'var(--text-muted)',
                          }}>
                            {customer.totalBills}
                          </span>
                        </td>

                        {/* Total spend */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          {customer.totalSpend > 0 ? (
                            <span style={{
                              fontWeight: '700',
                              fontSize: '14px',
                              background: 'var(--gold-gradient)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                            }}>
                              {fmt(customer.totalSpend)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Link
                              href={`/admin/purchase-requests?customer=${customer.id}`}
                              style={{
                                padding: '5px 12px',
                                fontSize: '12px',
                                background: 'rgba(61,143,212,0.08)',
                                border: '1px solid rgba(61,143,212,0.25)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--blue-bright)',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                transition: 'all var(--transition)',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(61,143,212,0.15)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(61,143,212,0.08)'; }}
                            >
                              Requests
                            </Link>
                            <Link
                              href={`/admin/bills?customer=${customer.id}`}
                              style={{
                                padding: '5px 12px',
                                fontSize: '12px',
                                background: 'rgba(201,168,76,0.08)',
                                border: '1px solid rgba(201,168,76,0.25)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--gold)',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                transition: 'all var(--transition)',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.15)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)'; }}
                            >
                              Bills
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {page && page.totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {page.totalElements} customer{page.totalElements !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 0}
                    style={{
                      padding: '6px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'none',
                      color: 'var(--text-secondary)',
                      cursor: currentPage === 0 ? 'default' : 'pointer',
                      opacity: currentPage === 0 ? 0.4 : 1,
                      fontSize: '13px',
                    }}
                  >
                    ← Prev
                  </button>
                  <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {currentPage + 1} / {page.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= page.totalPages - 1}
                    style={{
                      padding: '6px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'none',
                      color: 'var(--text-secondary)',
                      cursor: currentPage >= page.totalPages - 1 ? 'default' : 'pointer',
                      opacity: currentPage >= page.totalPages - 1 ? 0.4 : 1,
                      fontSize: '13px',
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
