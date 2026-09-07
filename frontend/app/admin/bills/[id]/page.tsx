'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Button, StatusBadge, LoadingSpinner, Modal, Input, Select } from '@/components/ui';
import {
  formatCurrency, formatDateTime,
  paymentStatusLabel, paymentStatusColor,
  billStatusLabel, billStatusColor,
} from '@/utils';
import { ArrowLeft, Printer, MessageCircle, Edit2, XCircle, Save } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { BillResponse } from '@/types';

interface Props { params: { id: string } }

const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'].map(v => ({ value: v, label: v }));
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'PARTIAL', 'CANCELLED'].map(v => ({ value: v, label: v }));
const BILL_STATUSES = ['DRAFT', 'ISSUED', 'SENT', 'PAID', 'CANCELLED'].map(v => ({ value: v, label: v }));

export default function AdminBillDetailPage({ params }: Props) {
  const billId = Number(params.id);
  const router = useRouter();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [waResult, setWaResult] = useState<{ link: string; message: string } | null>(null);

  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    paymentMethod: '',
    paymentStatus: '',
    billStatus: '',
    transactionRef: '',
    notes: '',
  });

  const { data: bill, isLoading } = useQuery({
    queryKey: ['admin-bill', billId],
    queryFn: () => adminService.getBill(billId),
    enabled: !!billId,
    staleTime: 30_000,
  });

  const openEdit = (b: BillResponse) => {
    setEditForm({
      customerName:  b.customerName,
      customerPhone: b.customerPhone,
      paymentMethod: b.paymentMethod,
      paymentStatus: b.paymentStatus,
      billStatus:    b.billStatus,
      transactionRef:b.transactionRef ?? '',
      notes:         b.notes ?? '',
    });
    setEditOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: () => adminService.updateBill(billId, {
      customerName:  editForm.customerName || undefined,
      customerPhone: editForm.customerPhone || undefined,
      paymentMethod: editForm.paymentMethod as any || undefined,
      paymentStatus: editForm.paymentStatus as any || undefined,
      billStatus:    editForm.billStatus as any || undefined,
      transactionRef:editForm.transactionRef || undefined,
      notes:         editForm.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bill', billId] });
      qc.invalidateQueries({ queryKey: ['admin-bills'] });
      toast.success('Bill updated');
      setEditOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not update bill'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => adminService.cancelBill(billId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bill', billId] });
      qc.invalidateQueries({ queryKey: ['admin-bills'] });
      toast.success('Bill cancelled — stock returned to inventory');
      setCancelOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not cancel bill'),
  });

  const whatsappMutation = useMutation({
    mutationFn: () => adminService.sendBillWhatsApp(billId),
    onSuccess: (data) => {
      setWaResult({ link: data.whatsappLink, message: data.message });
      qc.invalidateQueries({ queryKey: ['admin-bill', billId] });
    },
    onError: () => toast.error('Could not generate WhatsApp message'),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm(f => ({ ...f, [k]: e.target.value }));

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (!bill) return (
    <div className="text-center py-20">
      <p className="text-[#888]">Bill not found.</p>
      <Link href="/admin/bills"><Button variant="ghost" className="mt-4">← Back to Bills</Button></Link>
    </div>
  );

  const isCancelled = bill.billStatus === 'CANCELLED';

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/admin/bills">
            <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#888]" />
            </button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl text-white">{bill.billNumber}</h1>
            <p className="text-[#888] text-sm">{formatDateTime(bill.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="glass" size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
          {!isCancelled && (
            <>
              <Button variant="glass" size="sm" onClick={() => whatsappMutation.mutate()}
                loading={whatsappMutation.isPending} className="gap-2">
                <MessageCircle className="w-4 h-4 text-green-400" /> WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(bill)} className="gap-2">
                <Edit2 className="w-4 h-4" /> Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)} className="gap-2">
                <XCircle className="w-4 h-4" /> Cancel Bill
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status row */}
      <div className="flex flex-wrap gap-3 items-center">
        <StatusBadge label={billStatusLabel(bill.billStatus)} colorClass={billStatusColor(bill.billStatus)} />
        <StatusBadge label={paymentStatusLabel(bill.paymentStatus)} colorClass={paymentStatusColor(bill.paymentStatus)} />
        {bill.whatsappSentAt && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> WhatsApp sent {formatDateTime(bill.whatsappSentAt)}
          </span>
        )}
      </div>

      {/* Invoice card */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1E1E1E', background: '#0D0D0D' }}>
        {/* Invoice header */}
        <div className="p-8 pb-6 text-center border-b border-[#1E1E1E]">
          <h2 className="font-serif text-3xl tracking-[0.2em] gold-text mb-1">SOUL x TIME</h2>
          <p className="text-[#888] text-xs tracking-widest italic">Where Time Finds Its Soul</p>
        </div>

        {/* Bill meta */}
        <div className="p-8 grid grid-cols-2 gap-6 border-b border-[#1E1E1E]">
          <div className="space-y-3">
            <Row label="Bill Number" value={bill.billNumber} mono />
            <Row label="Customer" value={bill.customerName} />
            <Row label="Phone" value={bill.customerPhone} />
          </div>
          <div className="space-y-3 text-right">
            <Row label="Date" value={formatDateTime(bill.createdAt)} right />
            <Row label="Payment Method" value={bill.paymentMethod} right />
            {bill.transactionRef && <Row label="Reference" value={bill.transactionRef} mono right />}
          </div>
        </div>

        {/* Items table */}
        <div className="p-8">
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#888] text-xs uppercase tracking-wider border-b border-[#1E1E1E]">
                  <th className="text-left py-3 font-medium">Product</th>
                  <th className="text-right py-3 font-medium">Unit Price</th>
                  <th className="text-right py-3 font-medium pr-2">Qty</th>
                  <th className="text-right py-3 font-medium">Discount</th>
                  <th className="text-right py-3 font-medium">Cost (Admin)</th>
                  <th className="text-right py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="py-3 text-white font-medium">{item.productName}</td>
                    <td className="py-3 text-right text-[#888]">{formatCurrency(item.sellingPrice)}</td>
                    <td className="py-3 text-right text-[#888] pr-2">{item.quantity}</td>
                    <td className="py-3 text-right text-green-400">
                      {item.lineDiscountAmount > 0 ? `-${formatCurrency(item.lineDiscountAmount)}` : '—'}
                    </td>
                    <td className="py-3 text-right text-[#888] text-xs">
                      {item.purchaseCost ? formatCurrency(item.purchaseCost) : '—'}
                    </td>
                    <td className="py-3 text-right text-white font-medium">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-[#888]">
                <span>Subtotal ({bill.items.length} item{bill.items.length !== 1 ? 's' : ''})</span>
                <span>{formatCurrency(bill.subtotal)}</span>
              </div>
              {bill.totalDiscount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Total Discount</span>
                  <span>-{formatCurrency(bill.totalDiscount)}</span>
                </div>
              )}
              {/* Profit line (admin only) */}
              {bill.items.some(i => i.purchaseCost) && (() => {
                const goodsCost = bill.items.reduce((s, i) => s + (i.purchaseCost ?? 0) * i.quantity, 0);
                const profit = bill.finalTotal - goodsCost;
                return (
                  <div className="flex justify-between text-[#888] text-xs pt-1 border-t border-[#1E1E1E]">
                    <span>Goods Cost</span>
                    <span>{formatCurrency(goodsCost)}</span>
                  </div>
                );
              })()}
              <div className="flex justify-between font-serif text-xl text-white pt-3 border-t border-[#1E1E1E]">
                <span>Final Total</span>
                <span className="gold-text">{formatCurrency(bill.finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {bill.notes && (
          <div className="px-8 pb-4">
            <p className="text-xs text-[#888] uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-white/70">{bill.notes}</p>
          </div>
        )}

        <div className="p-6 text-center border-t border-[#1E1E1E]">
          <p className="font-display text-[#888] italic text-sm">Where Time Finds Its Soul</p>
        </div>
      </div>

      {/* ── Edit Modal ─────────────────────────────────────── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Bill Details" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Customer Name" value={editForm.customerName} onChange={set('customerName')} />
            <Input label="Customer Phone" value={editForm.customerPhone} onChange={set('customerPhone')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Payment Method" options={PAYMENT_METHODS} value={editForm.paymentMethod} onChange={set('paymentMethod')} />
            <Select label="Payment Status" options={PAYMENT_STATUSES} value={editForm.paymentStatus} onChange={set('paymentStatus')} />
          </div>
          <Select label="Bill Status" options={BILL_STATUSES} value={editForm.billStatus} onChange={set('billStatus')} />
          <Input label="Transaction Reference" value={editForm.transactionRef} onChange={set('transactionRef')} placeholder="UPI / Reference ID" />
          <Input label="Notes" value={editForm.notes} onChange={set('notes')} placeholder="Internal notes..." />

          <div className="p-3 rounded-lg text-xs text-[#888]" style={{ background: 'rgba(184,147,58,0.05)', border: '1px solid rgba(184,147,58,0.15)' }}>
            To add / remove / change item quantities, use <strong className="text-[#B8933A]">Cancel &amp; recreate</strong> or contact support.
            Item changes affect inventory and require a full recalculation.
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="gold" loading={updateMutation.isPending} onClick={() => updateMutation.mutate()} className="gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Cancel Confirm ─────────────────────────────────── */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Bill" size="sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-red-400 font-medium mb-1">This action cannot be undone.</p>
            <p className="text-white/70">
              Cancelling <strong>{bill.billNumber}</strong> will return{' '}
              <strong>all stock</strong> to inventory for each item.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>Go Back</Button>
            <Button variant="danger" loading={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
              Cancel Bill &amp; Return Stock
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── WhatsApp Result Modal ──────────────────────────── */}
      <Modal open={!!waResult} onClose={() => setWaResult(null)} title="WhatsApp Message Ready" size="lg">
        {waResult && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 overflow-auto max-h-64" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
              <pre className="text-white text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {waResult.message}
              </pre>
            </div>
            <p className="text-[#888] text-xs">
              Click below to open WhatsApp with this pre-filled message for the customer.
            </p>
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

function Row({ label, value, mono, right }: { label: string; value: string; mono?: boolean; right?: boolean }) {
  return (
    <div className={right ? 'text-right' : ''}>
      <p className="text-[10px] text-[#888] uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
