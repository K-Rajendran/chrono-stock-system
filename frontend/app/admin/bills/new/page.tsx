'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Button, Input, Select, LoadingSpinner } from '@/components/ui';
import { formatCurrency } from '@/utils';
import { Plus, Trash2, Search, ArrowLeft, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface LineItem {
  productId: number;
  productName: string;
  sku: string;
  sellingPrice: number;
  effectivePrice: number;
  stockQuantity: number;
  quantity: number;
  discountValue: number;
  discountType: string;
}

export default function NewBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  // Pre-fill from purchase request
  const { data: prData, isLoading: prLoading } = useQuery({
    queryKey: ['admin-pr-prefill', requestId],
    queryFn: () => adminService.getPurchaseRequest(Number(requestId)),
    enabled: !!requestId,
  });

  useEffect(() => {
    if (!prData) return;
    setCustomerName(prData.customerName);
    setCustomerPhone(prData.customerPhone);
    // Pre-fill items from PR
    setItems(
      prData.items
        .filter(i => i.productId)
        .map(i => ({
          productId: i.productId!,
          productName: i.productName,
          sku: '',
          sellingPrice: i.unitPrice,
          effectivePrice: i.unitPrice,
          stockQuantity: 999,
          quantity: i.quantity,
          discountValue: i.discountValue,
          discountType: i.discountType,
        }))
    );
  }, [prData]);

  // Product search for picker
  const { data: productResults, isLoading: searchLoading } = useQuery({
    queryKey: ['product-picker', productSearch],
    queryFn: () => adminService.listProducts({ search: productSearch, size: 10 }),
    enabled: pickerOpen && productSearch.length >= 1,
    staleTime: 30_000,
  });

  const { data: allProducts } = useQuery({
    queryKey: ['product-picker-all'],
    queryFn: () => adminService.listProducts({ size: 20, stockStatus: 'IN_STOCK' }),
    enabled: pickerOpen && productSearch.length === 0,
    staleTime: 60_000,
  });

  const displayProducts = productSearch.length >= 1 ? productResults?.content : allProducts?.content;

  const createMutation = useMutation({
    mutationFn: () =>
      adminService.createBill({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        purchaseRequestId: requestId ? Number(requestId) : undefined,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          discountValue: i.discountValue || 0,
          discountType: i.discountType || 'PERCENTAGE',
        })),
        paymentMethod,
        paymentStatus,
        transactionRef: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (bill: any) => {
      toast.success(`Bill ${bill.billNumber} created!`);
      router.push(`/admin/bills/${bill.id}`);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Could not create bill'),
  });

  const addProduct = (p: any) => {
    const existing = items.find(i => i.productId === p.id);
    if (existing) {
      setItems(items.map(i =>
        i.productId === p.id ? { ...i, quantity: Math.min(i.quantity + 1, p.stockQuantity) } : i
      ));
    } else {
      setItems([...items, {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        sellingPrice: p.sellingPrice,
        effectivePrice: p.effectivePrice,
        stockQuantity: (p as any).stockQuantity ?? 0,
        quantity: 1,
        discountValue: p.discountValue ?? 0,
        discountType: p.discountType ?? 'PERCENTAGE',
      }]);
    }
    setPickerOpen(false);
    setProductSearch('');
  };

  const removeItem = (productId: number) =>
    setItems(items.filter(i => i.productId !== productId));

  const updateQty = (productId: number, qty: number) =>
    setItems(items.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i));

  // Compute totals preview (display only — backend recalculates)
  const computedTotal = items.reduce((sum, i) => {
    const unit = i.discountType === 'PERCENTAGE'
      ? i.sellingPrice * (1 - i.discountValue / 100)
      : Math.max(0, i.sellingPrice - i.discountValue);
    return sum + unit * i.quantity;
  }, 0);

  const canSubmit = customerName.trim() && customerPhone.trim() && items.length > 0;

  if (requestId && prLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/bills">
          <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#888]" />
          </button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl text-white">Create Bill</h1>
          {requestId && (
            <p className="text-[#B8933A] text-sm mt-0.5">
              Linked to purchase request #{requestId}
            </p>
          )}
        </div>
      </div>

      {/* Customer Details */}
      <Section title="Customer Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Customer Name *"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Full name"
          />
          <Input
            label="Phone Number *"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
      </Section>

      {/* Items */}
      <Section title="Bill Items">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[#888] text-sm">{items.length} item{items.length !== 1 ? 's' : ''} added</p>
          <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>

        {/* Product picker inline */}
        {pickerOpen && (
          <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid #B8933A33', background: '#111' }}>
            <div className="p-3 border-b border-[#1E1E1E]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#888' }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Type to search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{
                    width: '100%', height: '38px',
                    paddingLeft: '2.25rem', paddingRight: '1rem',
                    borderRadius: '0.5rem', border: '1px solid #1E1E1E',
                    backgroundColor: '#161616', color: '#FAFAFA',
                    WebkitTextFillColor: '#FAFAFA', caretColor: '#B8933A',
                    fontSize: '0.875rem', outline: 'none',
                  }}
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-[#1E1E1E]">
              {searchLoading ? (
                <div className="p-4 text-center text-[#888] text-sm">Searching...</div>
              ) : !displayProducts?.length ? (
                <div className="p-4 text-center text-[#888] text-sm">
                  {productSearch ? 'No products found.' : 'Loading products...'}
                </div>
              ) : (
                displayProducts.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => addProduct(p)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {p.primaryImageUrl && (
                        <img src={p.primaryImageUrl} alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <div>
                        <p className="text-white text-sm font-medium">{p.name}</p>
                        <p className="text-[#888] text-xs">{p.sku} · Stock: {(p as any).stockQuantity ?? '?'}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-[#B8933A] font-serif text-sm">{formatCurrency(p.effectivePrice)}</p>
                      {p.discountAmount > 0 && (
                        <p className="text-[#888] text-xs line-through">{formatCurrency(p.sellingPrice)}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-2 border-t border-[#1E1E1E] text-right">
              <button onClick={() => { setPickerOpen(false); setProductSearch(''); }}
                className="text-xs text-[#888] hover:text-white transition-colors px-2 py-1">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Items list */}
        {items.length === 0 ? (
          <div className="py-10 text-center rounded-xl" style={{ border: '1px dashed #1E1E1E' }}>
            <Package className="w-10 h-10 text-[#333] mx-auto mb-2" />
            <p className="text-[#888] text-sm">No items added yet.</p>
            <p className="text-[#555] text-xs">Click "Add Product" to add watches to this bill.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const unitAfterDisc = item.discountType === 'PERCENTAGE'
                ? item.sellingPrice * (1 - item.discountValue / 100)
                : Math.max(0, item.sellingPrice - item.discountValue);
              const lineTotal = unitAfterDisc * item.quantity;

              return (
                <div key={item.productId}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.productName}</p>
                    <div className="flex gap-3 text-xs text-[#888] mt-0.5">
                      <span>{item.sku}</span>
                      <span>{formatCurrency(item.sellingPrice)} each</span>
                      {item.discountValue > 0 && (
                        <span className="text-green-400">
                          {item.discountType === 'PERCENTAGE' ? `-${item.discountValue}%` : `-${formatCurrency(item.discountValue)}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center rounded-lg overflow-hidden flex-shrink-0"
                    style={{ border: '1px solid #1E1E1E' }}>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                    >−</button>
                    <span className="w-9 text-center text-sm text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stockQuantity}
                      className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                    >+</button>
                  </div>

                  <div className="text-right flex-shrink-0 w-24">
                    <p className="text-white font-serif text-sm">{formatCurrency(lineTotal)}</p>
                  </div>

                  <button onClick={() => removeItem(item.productId)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#888] hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {/* Total preview */}
            <div className="flex justify-end pt-3 border-t border-[#1E1E1E] mt-2">
              <div className="text-right">
                <p className="text-[#888] text-xs mb-1">Estimated Total</p>
                <p className="font-serif text-xl gold-text">{formatCurrency(computedTotal)}</p>
                <p className="text-[#555] text-xs mt-0.5">Final amount calculated server-side</p>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Payment */}
      <Section title="Payment Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            options={['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER'].map(v => ({ value: v, label: v }))}
          />
          <Select
            label="Payment Status"
            value={paymentStatus}
            onChange={e => setPaymentStatus(e.target.value)}
            options={['PENDING', 'PAID', 'PARTIAL', 'CANCELLED'].map(v => ({ value: v, label: v }))}
          />
          <Input
            label="Transaction Reference (optional)"
            value={transactionRef}
            onChange={e => setTransactionRef(e.target.value)}
            placeholder="UPI / Bank reference ID"
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any internal notes..."
          />
        </div>
      </Section>

      {/* Submit */}
      {!canSubmit && (
        <div className="p-3 rounded-lg text-sm text-[#888]"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
          {!customerName.trim() && <p>· Customer name is required</p>}
          {!customerPhone.trim() && <p>· Customer phone is required</p>}
          {items.length === 0 && <p>· At least one product is required</p>}
        </div>
      )}

      <div className="flex gap-4 justify-end pt-2 border-t border-[#1E1E1E]">
        <Link href="/admin/bills">
          <Button variant="ghost" size="lg">Cancel</Button>
        </Link>
        <Button
          variant="gold"
          size="lg"
          disabled={!canSubmit}
          loading={createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          Create Bill
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
      <h2 className="font-serif text-lg text-white border-b border-[#1E1E1E] pb-3 mb-4">{title}</h2>
      {children}
    </div>
  );
}
