'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { purchaseRequestService } from '@/services';
import { StatusBadge, LoadingSpinner, Button } from '@/components/ui';
import { formatCurrency, formatDateTime, prStatusLabel, prStatusColor } from '@/utils';
import { MessageCircle, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Props { params: { id: string } }

export default function PurchaseRequestDetailPage({ params }: Props) {
  const id = Number(params.id);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: pr, isLoading } = useQuery({
    queryKey: ['purchase-request', id],
    queryFn: () => purchaseRequestService.getById(id),
    enabled: isAuthenticated && !!id,
  });

  const whatsappMutation = useMutation({
    mutationFn: () => purchaseRequestService.sendWhatsApp(id),
    onSuccess: (data) => {
      if (data.whatsappLink) window.open(data.whatsappLink, '_blank');
      toast.success('WhatsApp message generated — tap to send!');
    },
    onError: () => toast.error('Could not generate WhatsApp message'),
  });

  if (!isAuthenticated) return null;
  if (isLoading) return <div className="container-wide py-20"><LoadingSpinner size="lg" /></div>;
  if (!pr) return <div className="container-wide py-20 text-center text-brand-gray">Request not found.</div>;

  return (
    <div className="container-wide py-10 max-w-2xl">
      {/* Nav */}
      <Link href="/account" className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Account
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <p className="text-brand-gold text-xs tracking-[0.4em] uppercase mb-1">Purchase Request</p>
          <h1 className="font-serif text-3xl text-brand-white">{pr.referenceId}</h1>
          <p className="text-brand-gray text-sm mt-1">{formatDateTime(pr.createdAt)}</p>
        </div>
        <StatusBadge label={prStatusLabel(pr.status)} colorClass={prStatusColor(pr.status)} />
      </div>

      {/* Status info banner */}
      <div className="glass-card-gold rounded-xl p-4 mb-6 text-sm">
        <p className="text-brand-white font-medium mb-1">What happens next?</p>
        {pr.status === 'REQUESTED' && (
          <p className="text-brand-white/70">
            Send this request to our team via WhatsApp. We&apos;ll review your order and generate an official bill.
          </p>
        )}
        {pr.status === 'UNDER_REVIEW' && (
          <p className="text-brand-white/70">Your request is being reviewed by our team. We&apos;ll generate your bill shortly.</p>
        )}
        {pr.status === 'BILL_GENERATED' && pr.billId && (
          <p className="text-brand-white/70">
            Your bill is ready!{' '}
            <Link href={`/bills/${pr.billId}`} className="text-brand-gold hover:underline">View your bill →</Link>
          </p>
        )}
        {pr.status === 'CANCELLED' && (
          <p className="text-red-400">This request has been cancelled.</p>
        )}
      </div>

      {/* Items */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="font-serif text-lg text-brand-white mb-5">Items Requested</h2>
        <div className="space-y-4">
          {pr.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 py-3 border-b border-brand-black-border last:border-0">
              <div>
                <p className="text-brand-white font-medium">{item.productName}</p>
                <p className="text-xs text-brand-gray mt-0.5">
                  {formatCurrency(item.unitPrice)} × {item.quantity}
                  {item.discountValue > 0 && (
                    <span className="ml-2 text-green-400">
                      ({item.discountType === 'PERCENTAGE' ? `${item.discountValue}% off` : `-${formatCurrency(item.discountValue)}`})
                    </span>
                  )}
                </p>
              </div>
              <span className="font-serif text-brand-white flex-shrink-0">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-5 pt-4 border-t border-brand-black-border space-y-2 text-sm">
          <div className="flex justify-between text-brand-gray">
            <span>Subtotal</span>
            <span>{formatCurrency(pr.subtotal)}</span>
          </div>
          {pr.totalDiscount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Discount</span>
              <span>-{formatCurrency(pr.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-serif text-xl text-brand-white pt-2">
            <span>Total</span>
            <span className="gold-text">{formatCurrency(pr.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {(pr.status === 'REQUESTED' || pr.status === 'UNDER_REVIEW') && (
          <Button
            variant="gold"
            size="lg"
            fullWidth
            onClick={() => whatsappMutation.mutate()}
            loading={whatsappMutation.isPending}
            className="gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Send to Owner via WhatsApp
          </Button>
        )}

        {pr.billId && (
          <Link href={`/bills/${pr.billId}`} className="flex-1">
            <Button variant="outline" size="lg" fullWidth className="gap-2">
              <FileText className="w-5 h-5" /> View Bill
            </Button>
          </Link>
        )}
      </div>

      {pr.whatsappSentAt && (
        <p className="text-xs text-brand-gray text-center mt-4">
          WhatsApp message sent at {formatDateTime(pr.whatsappSentAt)}
        </p>
      )}
    </div>
  );
}
