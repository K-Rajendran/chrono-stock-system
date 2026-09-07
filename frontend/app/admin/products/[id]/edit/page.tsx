'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, productService } from '@/services';
import { Button, Input, Select, Textarea, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Props { params: { id: string } }

export default function EditProductPage({ params }: Props) {
  const id = Number(params.id);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminService.getProduct(id),
    enabled: !!id,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (product && !initialized) {
      setForm({
        sku: product.sku ?? '',
        name: product.name ?? '',
        brand: product.brand ?? '',
        categoryId: product.categoryId?.toString() ?? '',
        description: product.description ?? '',
        movement: product.movement ?? '',
        caseMaterial: product.caseMaterial ?? '',
        strapMaterial: product.strapMaterial ?? '',
        caseDiameterMm: product.caseDiameterMm?.toString() ?? '',
        dialColor: product.dialColor ?? '',
        waterResistance: product.waterResistance ?? '',
        glassType: product.glassType ?? '',
        genderStyle: product.genderStyle ?? '',
        warrantyMonths: product.warrantyMonths?.toString() ?? '',
        purchaseCost: (product as any).purchaseCost?.toString() ?? '',
        sellingPrice: product.sellingPrice?.toString() ?? '',
        discountType: product.discountType ?? 'PERCENTAGE',
        discountValue: product.discountValue?.toString() ?? '0',
        lowStockThreshold: (product as any).lowStockThreshold?.toString() ?? '5',
        primaryImageUrl: product.primaryImageUrl ?? '',
        model3dUrl: product.model3dUrl ?? '',
        active: (product as any).active?.toString() ?? 'true',
      });
      setInitialized(true);
    }
  }, [product, initialized]);

  const mutation = useMutation({
    mutationFn: () => adminService.updateProduct(id, {
      name: form.name || undefined,
      brand: form.brand || undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      description: form.description || undefined,
      movement: form.movement || undefined,
      caseMaterial: form.caseMaterial || undefined,
      strapMaterial: form.strapMaterial || undefined,
      caseDiameterMm: form.caseDiameterMm ? Number(form.caseDiameterMm) : undefined,
      dialColor: form.dialColor || undefined,
      waterResistance: form.waterResistance || undefined,
      glassType: form.glassType || undefined,
      genderStyle: form.genderStyle || undefined,
      warrantyMonths: form.warrantyMonths ? Number(form.warrantyMonths) : undefined,
      purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : undefined,
      sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
      discountType: form.discountType as any,
      discountValue: form.discountValue !== '' ? Number(form.discountValue) : undefined,
      lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : undefined,
      primaryImageUrl: form.primaryImageUrl || undefined,
      model3dUrl: form.model3dUrl || undefined,
      active: form.active === 'true',
    } as any),
    onSuccess: (p: any) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-product', id] });
      toast.success(`"${p.name}" updated!`);
      router.push('/admin/products');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not update product';
      const fieldErrors = err?.response?.data?.fieldErrors || {};
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) toast.error(msg);
    },
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  if (isLoading || !initialized) return <LoadingSpinner size="lg" />;
  if (!product) return <div className="text-[#888] py-20 text-center">Product not found.</div>;

  const categoryOptions = categories?.map(c => ({ value: c.id, label: c.name })) ?? [];

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#888]" />
          </button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl text-white">Edit Product</h1>
          <p className="text-[#888] text-sm font-mono text-xs">{product.sku}</p>
        </div>
      </div>

      <Section title="Basic Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="SKU" value={form.sku} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} hint="SKU cannot be changed after creation" />
          <Input label="Product Name *" placeholder="Celestial Noir" value={form.name} onChange={set('name')} error={errors.name} />
          <Input label="Brand" value={form.brand} onChange={set('brand')} />
          <Select label="Category" options={categoryOptions} value={form.categoryId} onChange={set('categoryId')} placeholder="Select category" />
          <Select label="Status" options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
            value={form.active} onChange={set('active')} />
        </div>
        <Textarea label="Description" value={form.description} onChange={set('description')} rows={4} />
      </Section>

      <Section title="Specifications">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Movement" value={form.movement} onChange={set('movement')} />
          <Input label="Case Material" value={form.caseMaterial} onChange={set('caseMaterial')} />
          <Input label="Strap Material" value={form.strapMaterial} onChange={set('strapMaterial')} />
          <Input label="Case Diameter (mm)" type="number" value={form.caseDiameterMm} onChange={set('caseDiameterMm')} />
          <Input label="Dial Color" value={form.dialColor} onChange={set('dialColor')} />
          <Input label="Water Resistance" value={form.waterResistance} onChange={set('waterResistance')} />
          <Input label="Glass Type" value={form.glassType} onChange={set('glassType')} />
          <Select label="Style" options={[
            { value: 'Men', label: 'Men' }, { value: 'Women', label: 'Women' }, { value: 'Unisex', label: 'Unisex' },
          ]} value={form.genderStyle} onChange={set('genderStyle')} placeholder="Select style" />
          <Input label="Warranty (months)" type="number" value={form.warrantyMonths} onChange={set('warrantyMonths')} />
        </div>
      </Section>

      <Section title="Pricing">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Purchase Cost (₹) *" type="number" min="0" step="0.01" value={form.purchaseCost} onChange={set('purchaseCost')} error={errors.purchaseCost} />
          <Input label="Selling Price (₹) *" type="number" min="0.01" step="0.01" value={form.sellingPrice} onChange={set('sellingPrice')} error={errors.sellingPrice} />
          <Select label="Discount Type" options={[
            { value: 'PERCENTAGE', label: 'Percentage (%)' }, { value: 'FIXED_AMOUNT', label: 'Fixed Amount (₹)' },
          ]} value={form.discountType} onChange={set('discountType')} />
          <Input label="Discount Value" type="number" min="0" step="0.01" value={form.discountValue} onChange={set('discountValue')} />
        </div>
      </Section>

      <Section title="Inventory Settings">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Low Stock Threshold" type="number" min="1" value={form.lowStockThreshold} onChange={set('lowStockThreshold')}
            hint="Alert when stock reaches this level" />
        </div>
        <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(184,147,58,0.05)', border: '1px solid rgba(184,147,58,0.15)' }}>
          <p className="text-[#B8933A]">To adjust stock quantity, use the Inventory → Stock Adjustment page.</p>
        </div>
      </Section>

      <Section title="Media">
        <div className="grid grid-cols-1 gap-4">
          <Input label="Primary Image URL" value={form.primaryImageUrl} onChange={set('primaryImageUrl')} />
          <Input label="3D Model URL (optional)" value={form.model3dUrl} onChange={set('model3dUrl')} />
        </div>
        {form.primaryImageUrl && (
          <div className="mt-4">
            <p className="text-xs text-[#888] mb-2">Preview:</p>
            <img src={form.primaryImageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-xl"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
      </Section>

      <div className="flex gap-4 justify-end pt-4 border-t border-[#1E1E1E]">
        <Link href="/admin/products">
          <Button variant="ghost" size="lg">Cancel</Button>
        </Link>
        <Button variant="gold" size="lg" onClick={() => mutation.mutate()} loading={mutation.isPending} className="gap-2">
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E1E' }}>
      <h2 className="font-serif text-lg text-white border-b border-[#1E1E1E] pb-3">{title}</h2>
      {children}
    </div>
  );
}
