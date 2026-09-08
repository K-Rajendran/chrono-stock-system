'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { User, Package, FileText, ChevronRight, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { purchaseRequestService, billService, authService } from '@/services';
import { LoadingSpinner, EmptyState, Pagination } from '@/components/ui';
import { formatCurrency, formatDate, prStatusLabel, prStatusColor, paymentStatusLabel, paymentStatusColor, billStatusLabel, billStatusColor } from '@/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'requests' | 'bills';

const TABS = [
  { id: 'profile'  as Tab, label: 'Profile',           icon: User },
  { id: 'requests' as Tab, label: 'Purchase Requests',  icon: Package },
  { id: 'bills'    as Tab, label: 'My Bills',           icon: FileText },
];

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [prPage, setPrPage] = useState(0);
  const [billPage, setBillPage] = useState(0);

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated, router]);

  const { data: requests, isLoading: prLoading } = useQuery({
    queryKey: ['my-requests', prPage], queryFn: () => purchaseRequestService.getMyRequests(prPage, 8), enabled: isAuthenticated && tab === 'requests',
  });
  const { data: bills, isLoading: billLoading } = useQuery({
    queryKey: ['my-bills', billPage], queryFn: () => billService.getMyBills(billPage, 8), enabled: isAuthenticated && tab === 'bills',
  });

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout(); toast.success('Signed out'); router.push('/');
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ background: '#080808', minHeight: '100vh', paddingTop: '68px' }}>
      <div className="container-wide" style={{ paddingTop: '48px', paddingBottom: '80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#B8933A', fontWeight: 600, marginBottom: '10px' }}>My Account</p>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,3.5vw,40px)', color: '#F5F5F0', fontWeight: 400 }}>
            Welcome, {user?.fullName.split(' ')[0]}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '32px', flexDirection: 'column' }} className="lg:flex-row">

          {/* Sidebar */}
          <aside style={{ width: '100%', flexShrink: 0 }} className="lg:w-56">
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                  borderRadius: '12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  border: 'none', textAlign: 'left', width: '100%', transition: 'all 0.2s',
                  background: tab === id ? 'rgba(184,147,58,0.1)' : 'transparent',
                  color: tab === id ? '#B8933A' : 'rgba(245,245,240,0.5)',
                  ...(tab === id ? { borderLeft: '2px solid #B8933A', borderRadius: '0 12px 12px 0' } : {}),
                }}>
                  <Icon size={15} />{label}
                </button>
              ))}
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                borderRadius: '12px', fontSize: '13px', cursor: 'pointer',
                border: 'none', textAlign: 'left', width: '100%', background: 'transparent',
                color: 'rgba(245,245,240,0.35)', marginTop: '8px', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.07)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,245,240,0.35)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <LogOut size={15} />Sign Out
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Profile */}
            {tab === 'profile' && (
              <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '28px', maxWidth: '520px' }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', color: '#F5F5F0', fontWeight: 400, marginBottom: '24px' }}>Profile Information</h2>
                {[
                  { label: 'Full Name', value: user?.fullName },
                  { label: 'Email',     value: user?.email },
                  { label: 'Role',      value: user?.role === 'ADMIN' ? 'Administrator' : 'Customer' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '4px' }}>{label}</p>
                    <p style={{ fontSize: '15px', color: '#F5F5F0' }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Requests */}
            {tab === 'requests' && (
              <div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', color: '#F5F5F0', fontWeight: 400, marginBottom: '24px' }}>Purchase Requests</h2>
                {prLoading ? <LoadingSpinner /> : !requests?.content.length ? (
                  <EmptyState icon={<Package size={44} />} title="No purchase requests yet"
                    description="Add items to your cart and submit a purchase request."
                    action={<Link href="/products" style={{ color: '#B8933A', fontSize: '14px', textDecoration: 'underline' }}>Browse Collection</Link>}
                  />
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {requests.content.map(req => (
                        <Link key={req.id} href={`/purchase-requests/${req.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(184,147,58,0.35)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '15px', color: '#F5F5F0' }}>{req.referenceId}</span>
                                  <span className={`badge ${prStatusColor(req.status)}`}>{prStatusLabel(req.status)}</span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#5A5A55' }}>{formatDate(req.createdAt)} · {req.items.length} item{req.items.length !== 1 ? 's' : ''}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', background: 'linear-gradient(135deg,#C4A24A,#E8C96A 45%,#9A7A2A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                  {formatCurrency(req.totalAmount)}
                                </span>
                                <ChevronRight size={16} style={{ color: '#5A5A55' }} />
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

            {/* Bills */}
            {tab === 'bills' && (
              <div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', color: '#F5F5F0', fontWeight: 400, marginBottom: '24px' }}>My Bills</h2>
                {billLoading ? <LoadingSpinner /> : !bills?.content.length ? (
                  <EmptyState icon={<FileText size={44} />} title="No bills yet"
                    description="Bills will appear here once your purchase requests have been processed." />
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {bills.content.map(bill => (
                        <Link key={bill.id} href={`/bills/${bill.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(184,147,58,0.35)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '15px', color: '#F5F5F0' }}>{bill.billNumber}</span>
                                  <span className={`badge ${paymentStatusColor(bill.paymentStatus)}`}>{paymentStatusLabel(bill.paymentStatus)}</span>
                                  <span className={`badge ${billStatusColor(bill.billStatus)}`}>{billStatusLabel(bill.billStatus)}</span>
                                </div>
                                <p style={{ fontSize: '12px', color: '#5A5A55' }}>{formatDate(bill.createdAt)} · {bill.paymentMethod}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '17px', background: 'linear-gradient(135deg,#C4A24A,#E8C96A 45%,#9A7A2A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                  {formatCurrency(bill.finalTotal)}
                                </span>
                                <ChevronRight size={16} style={{ color: '#5A5A55' }} />
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
    </div>
  );
}
