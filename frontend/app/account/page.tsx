'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { User, Package, FileText, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { purchaseRequestService, billService } from '@/services';
import { StatusBadge, LoadingSpinner, EmptyState, Pagination } from '@/components/ui';
import { formatCurrency, formatDate, prStatusLabel, prStatusColor, paymentStatusLabel, paymentStatusColor, billStatusLabel, billStatusColor } from '@/utils';
import Link from 'next/link';
import { cn } from '@/utils';

type Tab = 'profile' | 'requests' | 'bills';

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [prPage, setPrPage] = useState(0);
  const [billPage, setBillPage] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: requests, isLoading: prLoading } = useQuery({
    queryKey: ['my-requests', prPage],
    queryFn: () => purchaseRequestService.getMyRequests(prPage, 8),
    enabled: isAuthenticated && tab === 'requests',
  });

  const { data: bills, isLoading: billLoading } = useQuery({
    queryKey: ['my-bills', billPage],
    queryFn: () => billService.getMyBills(billPage, 8),
    enabled: isAuthenticated && tab === 'bills',
  });

  if (!isAuthenticated) return null;

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'requests' as Tab, label: 'Purchase Requests', icon: Package },
    { id: 'bills' as Tab, label: 'My Bills', icon: FileText },
  ];

  return (
    <div className="container-wide py-10">
      <div className="mb-10">
        <p className="text-brand-gold text-xs tracking-[0.4em] uppercase mb-2">My Account</p>
        <h1 className="font-serif text-3xl text-brand-white">
          Welcome, {user?.fullName.split(' ')[0]}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left',
                  tab === id
                    ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/30'
                    : 'text-brand-white/70 hover:text-brand-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="glass-card rounded-2xl p-8 max-w-lg">
              <h2 className="font-serif text-xl text-brand-white mb-6">Profile Information</h2>
              <div className="space-y-4">
                {[
                  { label: 'Full Name', value: user?.fullName },
                  { label: 'Email', value: user?.email },
                  { label: 'Account Type', value: user?.role === 'ADMIN' ? 'Administrator' : 'Customer' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1 py-3 border-b border-brand-black-border last:border-0">
                    <span className="text-xs text-brand-gray uppercase tracking-wider">{label}</span>
                    <span className="text-brand-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Requests Tab */}
          {tab === 'requests' && (
            <div>
              <h2 className="font-serif text-xl text-brand-white mb-6">Purchase Requests</h2>
              {prLoading ? (
                <LoadingSpinner />
              ) : !requests?.content.length ? (
                <EmptyState
                  icon={<Package className="w-12 h-12" />}
                  title="No purchase requests yet"
                  description="Add items to your cart and submit a purchase request to get started."
                  action={<Link href="/products" className="text-brand-gold text-sm hover:underline">Browse Collection</Link>}
                />
              ) : (
                <>
                  <div className="space-y-4">
                    {requests.content.map((req) => (
                      <Link key={req.id} href={`/purchase-requests/${req.id}`}>
                        <div className="glass-card rounded-xl p-5 hover:border-brand-gold/30 transition-all cursor-pointer group">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium text-brand-white text-sm">{req.referenceId}</span>
                                <StatusBadge label={prStatusLabel(req.status)} colorClass={prStatusColor(req.status)} />
                              </div>
                              <p className="text-xs text-brand-gray">{formatDate(req.createdAt)}</p>
                              <p className="text-xs text-brand-gray mt-1">
                                {req.items.length} item{req.items.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-serif text-lg gold-text">{formatCurrency(req.totalAmount)}</p>
                              <ChevronRight className="w-4 h-4 text-brand-gray group-hover:text-brand-gold ml-auto mt-1 transition-colors" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Pagination page={prPage} totalPages={requests.totalPages} onPageChange={setPrPage} />
                </>
              )}
            </div>
          )}

          {/* Bills Tab */}
          {tab === 'bills' && (
            <div>
              <h2 className="font-serif text-xl text-brand-white mb-6">My Bills</h2>
              {billLoading ? (
                <LoadingSpinner />
              ) : !bills?.content.length ? (
                <EmptyState
                  icon={<FileText className="w-12 h-12" />}
                  title="No bills yet"
                  description="Bills will appear here once your purchase requests have been processed."
                />
              ) : (
                <>
                  <div className="space-y-4">
                    {bills.content.map((bill) => (
                      <Link key={bill.id} href={`/bills/${bill.id}`}>
                        <div className="glass-card rounded-xl p-5 hover:border-brand-gold/30 transition-all cursor-pointer group">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="font-medium text-brand-white text-sm">{bill.billNumber}</span>
                                <StatusBadge label={paymentStatusLabel(bill.paymentStatus)} colorClass={paymentStatusColor(bill.paymentStatus)} />
                                <StatusBadge label={billStatusLabel(bill.billStatus)} colorClass={billStatusColor(bill.billStatus)} />
                              </div>
                              <p className="text-xs text-brand-gray">{formatDate(bill.createdAt)}</p>
                              <p className="text-xs text-brand-gray mt-1">{bill.paymentMethod}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-serif text-lg gold-text">{formatCurrency(bill.finalTotal)}</p>
                              <ChevronRight className="w-4 h-4 text-brand-gray group-hover:text-brand-gold ml-auto mt-1 transition-colors" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Pagination page={billPage} totalPages={bills.totalPages} onPageChange={setBillPage} />
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
