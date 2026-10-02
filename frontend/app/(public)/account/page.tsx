'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface UserProfile { id: string; fullName: string; email: string; phone: string; role: string; }
interface PurchaseRequest { id: string; referenceId: string; status: string; totalAmount: number; createdAt: string; items: unknown[]; }
interface Bill { id: string; billNumber: string; billStatus: string; paymentStatus: string; finalTotal: number; createdAt: string; }

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

type Tab = 'profile' | 'requests'; // | 'bills';

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // useEffect(() => {
  //   const token = localStorage.getItem('sxt_token');
  //   if (!token) { router.push('/login'); return; }

  //   const headers = { Authorization: `Bearer ${token}` };
  //   const base = process.env.NEXT_PUBLIC_API_URL;

  //   Promise.all([
  //     fetch(`${base}/api/customer/profile`, { headers }).then(r => { if (r.status === 401) throw new Error('auth'); return r.json(); }),
  //     fetch(`${base}/api/purchase-requests?page=0&size=20`, { headers }).then(r => r.json()).catch(() => []),
  //     fetch(`${base}/api/customer/bills?page=0&size=20&sort=createdAt,desc`, { headers }).then(r => r.json()).catch(() => []),
  //   ])
  //     .then(([p, reqs, bs]) => {
  //       setProfile(p);
  //       setEditForm({ name: p.fullName, phone: p.phone });
  //       setRequests(reqs.content ?? reqs ?? []);
  //       setBills(bs.content ?? bs ?? []);
  //     })
  //     .catch(e => { if (e.message === 'auth') router.push('/login'); })
  //     .finally(() => setLoading(false));
  // }, []);

  useEffect(() => {
    const token = localStorage.getItem('sxt_token');
    if (!token) { router.push('/login'); return; }

    const headers = { Authorization: `Bearer ${token}` };
    const base = process.env.NEXT_PUBLIC_API_URL;

    Promise.all([
      fetch(`${base}/api/customer/profile`, { headers }).then(r => { if (r.status === 401) throw new Error('auth'); return r.json(); }),
      fetch(`${base}/api/purchase-requests?page=0&size=20`, { headers }).then(r => r.json()).catch(() => []),
    ])
      .then(([p, reqs]) => {
        setProfile(p);
        setEditForm({ name: p.fullName, phone: p.phone });
        setRequests(reqs.content ?? reqs ?? []);
      })
      .catch(e => { if (e.message === 'auth') router.push('/login'); })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('sxt_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customer/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: editForm.name, phone: editForm.phone }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProfile(updated);
      const user = JSON.parse(localStorage.getItem('sxt_user') ?? '{}');
      localStorage.setItem('sxt_user', JSON.stringify({ ...user, name: updated.fullName }));
      setEditing(false);
      showToast('Profile updated successfully.');
    } catch { showToast('Failed to update profile.'); }
    finally { setSaving(false); }
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'requests', label: 'Requests', count: requests.length },
    // { key: 'bills', label: 'Bills', count: bills.length },
  ];

  if (loading) return <LoadingSpinner message="Loading account…" />;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 24px 80px' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '14px', zIndex: 9999, boxShadow: 'var(--shadow-lg)' }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700', color: '#000', flexShrink: 0 }}>
          {profile?.fullName?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: '700', color: 'var(--text-primary)' }}>{profile?.fullName}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>{profile?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === t.key ? 'var(--blue-accent)' : 'transparent'}`,
              color: tab === t.key ? 'var(--blue-bright)' : 'var(--text-muted)',
              fontWeight: tab === t.key ? '600' : '400',
              fontSize: '14px', cursor: 'pointer', transition: 'all var(--transition)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span style={{ padding: '1px 7px', background: tab === t.key ? 'rgba(61,143,212,0.2)' : 'rgba(255,255,255,0.06)', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)' }}>Account Details</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} style={{ padding: '7px 14px', background: 'rgba(61,143,212,0.1)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-sm)', color: 'var(--blue-bright)', fontSize: '13px', cursor: 'pointer' }}>Edit</button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleSaveProfile} disabled={saving} style={{ padding: '7px 14px', background: 'var(--gold-gradient)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#000', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
                <button onClick={() => { setEditing(false); setEditForm({ name: profile?.fullName ?? '', phone: profile?.phone ?? '' }); }} style={{ padding: '7px 14px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              </div>
            )}
          </div>
          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { label: 'Full Name', key: 'name', value: profile?.fullName ?? '', editable: true },
              { label: 'Email', key: 'email', value: profile?.email ?? '', editable: false },
              { label: 'Phone', key: 'phone', value: profile?.phone ?? '', editable: true },
              { label: 'Account Type', key: 'role', value: profile?.role ?? '', editable: false },
            ].map(({ label, key, value, editable }) => (
              <div key={key} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                {editing && editable ? (
                  <input value={(editForm as Record<string, string>)[key] ?? value}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', WebkitTextFillColor: 'var(--text-primary)' }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-active)'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                  />
                ) : (
                  <span style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase requests tab */}
      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.length === 0 ? (
            <div style={{ padding: '80px 40px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No Requests Yet</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Browse our collection and submit a purchase request.</p>
              <Link href="/products" style={{ padding: '10px 24px', background: 'rgba(61,143,212,0.1)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-md)', color: 'var(--blue-bright)', textDecoration: 'none', fontSize: '14px' }}>Browse Collection →</Link>
            </div>
          ) : requests.map(req => (
            <Link key={req.id} href={`/purchase-requests/${req.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textDecoration: 'none', transition: 'all var(--transition)', gap: '12px' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-active)'; el.style.transform = 'translateX(3px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'translateX(0)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(61,143,212,0.1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📋</div>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>Request #{req.referenceId}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fmtDate(req.createdAt)} · {req.items.length} item{req.items.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{fmt(req.totalAmount)}</span>
                <StatusBadge status={req.status} size="sm" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bills tab */}
      {/* {tab === 'bills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bills.length === 0 ? (
            <div style={{ padding: '80px 40px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧾</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No Bills Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Bills will appear here once your requests are confirmed.</p>
            </div>
          ) : bills.map(bill => (
            <Link key={bill.id} href={`/bills/${bill.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textDecoration: 'none', transition: 'all var(--transition)', gap: '12px' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-active)'; el.style.transform = 'translateX(3px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'translateX(0)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🧾</div>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>Bill #{bill.billNumber}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fmtDate(bill.createdAt)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{fmt(bill.finalTotal)}</span>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <StatusBadge status={bill.billStatus} size="sm" />
                  <StatusBadge status={bill.paymentStatus} size="sm" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )} */}
    </div>
  );
}
