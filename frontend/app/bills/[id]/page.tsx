'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { billService, adminService } from '@/services';
import { LoadingSpinner } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDateTime, paymentStatusLabel, paymentStatusColor, billStatusLabel, billStatusColor } from '@/utils';
import { Printer, MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Props { params: { id: string } }

export default function BillDetailPage({ params }: Props) {
  const billId = Number(params.id);
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => { if (!isAuthenticated) router.push('/login'); }, [isAuthenticated, router]);

  const fetchFn = user?.role === 'ADMIN'
    ? () => adminService.getBill(billId)
    : () => billService.getById(billId);

  const { data: bill, isLoading } = useQuery({
    queryKey: ['bill', billId], queryFn: fetchFn, enabled: isAuthenticated && !!billId,
  });

  const waMut = useMutation({
    mutationFn: () => adminService.sendBillWhatsApp(billId),
    onSuccess: d => { if (d.whatsappLink) window.open(d.whatsappLink, '_blank'); toast.success('WhatsApp message generated'); },
    onError: () => toast.error('Could not generate WhatsApp message'),
  });

  if (!isAuthenticated) return null;
  if (isLoading) return <div style={{ background: '#080808', minHeight: '100vh', paddingTop: '68px' }}><LoadingSpinner size="lg" /></div>;
  if (!bill) return <div style={{ background: '#080808', minHeight: '100vh', paddingTop: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#5A5A55' }}>Bill not found.</p></div>;

  return (
    <div style={{ background: '#080808', minHeight: '100vh', paddingTop: '68px' }}>
      <div className="container-wide" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '820px' }}>

        {/* Nav bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }} className="no-print">
          <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#5A5A55', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#A0A09A'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#5A5A55'}>
            <ArrowLeft size={14} /> Back
          </Link>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="glass" size="sm" onClick={() => window.print()} style={{ gap: '7px' }}>
              <Printer size={14} /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => waMut.mutate()} loading={waMut.isPending} style={{ gap: '7px' }}>
              <MessageCircle size={14} /> WhatsApp
            </Button>
          </div>
        </div>

        {/* Invoice card */}
        <div style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden' }}>

          {/* Brand header */}
          <div style={{ padding: '40px 48px 32px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '28px', letterSpacing: '0.18em', fontWeight: 400, background: 'linear-gradient(135deg,#C4A24A,#E8C96A 45%,#9A7A2A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '6px' }}>
              SOUL × TIME
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '13px', color: '#3A3A35', fontStyle: 'italic', letterSpacing: '0.08em' }}>Where Time Finds Its Soul</p>
          </div>

          {/* Meta grid */}
          <div style={{ padding: '28px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <MetaRow label="Bill Number" value={bill.billNumber} mono />
              <MetaRow label="Customer" value={bill.customerName} />
              <MetaRow label="Phone" value={bill.customerPhone} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'right' }}>
              <MetaRow label="Date" value={formatDateTime(bill.createdAt)} right />
              <MetaRow label="Payment" value={bill.paymentMethod} right />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <span className={`badge ${billStatusColor(bill.billStatus)}`}>{billStatusLabel(bill.billStatus)}</span>
                <span className={`badge ${paymentStatusColor(bill.paymentStatus)}`}>{paymentStatusLabel(bill.paymentStatus)}</span>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div style={{ padding: '28px 48px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Product', 'Unit Price', 'Qty', 'Discount', 'Total'].map((h, i) => (
                    <th key={h} style={{ padding: '10px 0', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bill.items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 0', fontSize: '14px', color: '#F5F5F0', fontWeight: 500 }}>{item.productName}</td>
                    <td style={{ padding: '14px 0', fontSize: '13px', color: '#A0A09A', textAlign: 'right' }}>{formatCurrency(item.sellingPrice)}</td>
                    <td style={{ padding: '14px 0', fontSize: '13px', color: '#A0A09A', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '14px 0', fontSize: '13px', color: '#22c55e', textAlign: 'right' }}>
                      {item.lineDiscountAmount > 0 ? `−${formatCurrency(item.lineDiscountAmount)}` : '—'}
                    </td>
                    <td style={{ padding: '14px 0', fontSize: '14px', color: '#F5F5F0', fontWeight: 500, textAlign: 'right' }}>{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#5A5A55', marginBottom: '8px' }}>
                  <span>Subtotal</span><span>{formatCurrency(bill.subtotal)}</span>
                </div>
                {bill.totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#22c55e', marginBottom: '8px' }}>
                    <span>Discount</span><span>−{formatCurrency(bill.totalDiscount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '14px', color: '#A0A09A', fontWeight: 500 }}>Total</span>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: 600, background: 'linear-gradient(135deg,#C4A24A,#E8C96A 45%,#9A7A2A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {formatCurrency(bill.finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment info */}
            {bill.transactionRef && (
              <div style={{ marginTop: '24px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(184,147,58,0.05)', border: '1px solid rgba(184,147,58,0.15)' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '4px' }}>Transaction Reference</p>
                <p style={{ fontSize: '13px', color: '#A0A09A', fontFamily: 'monospace' }}>{bill.transactionRef}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '20px 48px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '15px', color: '#3A3A35', fontStyle: 'italic' }}>Where Time Finds Its Soul</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono, right }: { label: string; value: string; mono?: boolean; right?: boolean }) {
  return (
    <div style={{ textAlign: right ? 'right' : 'left' }}>
      <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A5A55', marginBottom: '3px' }}>{label}</p>
      <p style={{ fontSize: '13px', color: '#F5F5F0', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</p>
    </div>
  );
}
