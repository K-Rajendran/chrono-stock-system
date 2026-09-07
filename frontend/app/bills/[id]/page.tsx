'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { billService, adminService } from '@/services';
import { LoadingSpinner, StatusBadge, Button } from '@/components/ui';
import { formatCurrency, formatDateTime, paymentStatusLabel, paymentStatusColor, billStatusLabel, billStatusColor } from '@/utils';
import { Printer, MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Props { params: { id: string } }

export default function BillDetailPage({ params }: Props) {
  const billId = Number(params.id);
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const fetchBill = user?.role === 'ADMIN'
    ? () => adminService.getBill(billId)
    : () => billService.getById(billId);

  const { data: bill, isLoading } = useQuery({
    queryKey: ['bill', billId],
    queryFn: fetchBill,
    enabled: isAuthenticated && !!billId,
  });

  const whatsappMutation = useMutation({
    mutationFn: () => adminService.sendBillWhatsApp(billId),
    onSuccess: (data) => {
      if (data.whatsappLink) window.open(data.whatsappLink, '_blank');
      toast.success('WhatsApp message generated');
    },
    onError: () => toast.error('Could not generate WhatsApp message'),
  });

  if (!isAuthenticated) return null;
  if (isLoading) return <div className="container-wide py-20"><LoadingSpinner size="lg" /></div>;
  if (!bill) return <div className="container-wide py-20 text-center text-brand-gray">Bill not found.</div>;

  return (
    <div className="container-wide py-10 max-w-3xl">
      {/* Nav */}
      <div className="flex items-center justify-between mb-8 no-print">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex gap-3">
          <Button variant="glass" size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={() => whatsappMutation.mutate()}
            loading={whatsappMutation.isPending} className="gap-2">
            <MessageCircle className="w-4 h-4" /> Share
          </Button>
        </div>
      </div>

      {/* Invoice */}
      <div className="glass-card rounded-2xl p-8 lg:p-12 print:bg-white print:text-black print:border-0">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl tracking-[0.2em] gold-text print:text-black mb-1">SOUL x TIME</h1>
          <p className="text-xs text-brand-gray tracking-widest italic print:text-gray-500">Where Time Finds Its Soul</p>
        </div>

        <div className="border-t border-brand-black-border print:border-gray-300 mb-6" />

        {/* Bill meta */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-brand-gray text-xs uppercase tracking-wider mb-1">Bill Number</p>
            <p className="font-medium text-brand-white print:text-black">{bill.billNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-brand-gray text-xs uppercase tracking-wider mb-1">Date</p>
            <p className="font-medium text-brand-white print:text-black">{formatDateTime(bill.createdAt)}</p>
          </div>
          <div>
            <p className="text-brand-gray text-xs uppercase tracking-wider mb-1">Customer</p>
            <p className="font-medium text-brand-white print:text-black">{bill.customerName}</p>
            <p className="text-brand-gray text-xs">{bill.customerPhone}</p>
          </div>
          <div className="text-right">
            <div className="flex flex-col items-end gap-1">
              <StatusBadge label={billStatusLabel(bill.billStatus)} colorClass={billStatusColor(bill.billStatus)} />
              <StatusBadge label={paymentStatusLabel(bill.paymentStatus)} colorClass={paymentStatusColor(bill.paymentStatus)} />
            </div>
          </div>
        </div>

        <div className="border-t border-brand-black-border print:border-gray-300 mb-6" />

        {/* Items */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-brand-gray text-xs uppercase tracking-wider">
                <th className="text-left py-2 font-medium">Product</th>
                <th className="text-right py-2 font-medium">Price</th>
                <th className="text-right py-2 font-medium">Qty</th>
                <th className="text-right py-2 font-medium">Discount</th>
                <th className="text-right py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, i) => (
                <tr key={item.id} className="border-t border-brand-black-border/50 print:border-gray-200">
                  <td className="py-3 text-brand-white print:text-black font-medium">{item.productName}</td>
                  <td className="py-3 text-right text-brand-gray">{formatCurrency(item.sellingPrice)}</td>
                  <td className="py-3 text-right text-brand-gray">{item.quantity}</td>
                  <td className="py-3 text-right text-green-400">
                    {item.lineDiscountAmount > 0 ? `-${formatCurrency(item.lineDiscountAmount)}` : '—'}
                  </td>
                  <td className="py-3 text-right text-brand-white print:text-black font-medium">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-brand-black-border print:border-gray-300 mb-6" />

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-brand-gray">
              <span>Subtotal</span>
              <span>{formatCurrency(bill.subtotal)}</span>
            </div>
            {bill.totalDiscount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Total Discount</span>
                <span>-{formatCurrency(bill.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-serif text-xl text-brand-white print:text-black pt-2 border-t border-brand-black-border">
              <span>Total</span>
              <span className="gold-text print:text-black">{formatCurrency(bill.finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="glass-card-gold rounded-xl p-4 text-sm print:bg-gray-50 print:border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-brand-gray text-xs uppercase tracking-wider mb-1">Payment Method</p>
              <p className="text-brand-white print:text-black">{bill.paymentMethod}</p>
            </div>
            {bill.transactionRef && (
              <div>
                <p className="text-brand-gray text-xs uppercase tracking-wider mb-1">Reference</p>
                <p className="text-brand-white print:text-black font-mono text-xs">{bill.transactionRef}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 pt-6 border-t border-brand-black-border print:border-gray-300">
          <p className="font-display text-brand-gray italic text-sm print:text-gray-400">
            Where Time Finds Its Soul
          </p>
          <p className="text-xs text-brand-gray/50 mt-1 print:text-gray-300">SOUL x TIME</p>
        </div>
      </div>
    </div>
  );
}
