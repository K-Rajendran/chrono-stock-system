'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminService, productService } from '@/services';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    sku: '', name: '', brand: '', categoryId: '',
    description: '',
    movement: '', caseMaterial: '', strapMaterial: '',
    caseDiameterMm: '', dialColor: '', waterResistance: '',
    glassType: '', genderStyle: '', warrantyMonths: '',
    purchaseCost: '', sellingPrice: '',
    discountType: 'PERCENTAGE', discountValue: '0',
    stockQuantity: '0', lowStockThreshold: '5',
    primaryImageUrl: '', model3dUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  const mutation = useMutation({
    mutationFn: () => adminService.createProduct({
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      brand: form.brand.trim() || undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      description: form.description.trim() || undefined,
      movement: form.movement || undefined,
      caseMaterial: form.caseMaterial || undefined,
      strapMaterial: form.strapMaterial || undefined,
      caseDiameterMm: form.caseDiameterMm ? Number(form.caseDiameterMm) : undefined,
      dialColor: form.dialColor || undefined,
      waterResistance: form.waterResistance || undefined,
      glassType: form.glassType || undefined,
      genderStyle: form.genderStyle || undefined,
      warrantyMonths: form.warrantyMonths ? Number(form.warrantyMonths) : undefined,
      purchaseCost: Number(form.purchaseCost),
      sellingPrice: Number(form.sellingPrice),
      discountType: form.discountType as any,
      discountValue: Number(form.discountValue),
      stockQuantity: Number(form.stockQuantity),
      lowStockThreshold: Number(form.lowStockThreshold),
      primaryImageUrl: form.primaryImageUrl || undefined,
      model3dUrl: form.model3dUrl || undefined,
    } as any),
    onSuccess: (p: any) => {
      toast.success(`Product "${p.name}" created!`);
      router.push('/admin/products');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not create product';
      const fieldErrors = err?.response?.data?.fieldErrors || {};
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) toast.error(msg);
    },
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.purchaseCost || Number(form.purchaseCost) < 0) e.purchaseCost = 'Valid purchase cost required';
    if (!form.sellingPrice || Number(form.sellingPrice) <= 0) e.sellingPrice = 'Valid selling price required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) mutation.mutate();
  };

  const categoryOptions = categories?.map(c => ({ value: c.id, label: c.name })) ?? [];

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#888]" />
          </button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl text-white">Add New Product</h1>
          <p className="text-[#888] text-sm">Create a new timepiece in the catalogue</p>
        </div>
      </div>

      {/* Basic Info */}
      <Section title="Basic Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="SKU *" placeholder="ST-LX-001" value={form.sku} onChange={set('sku')} error={errors.sku} />
          <Input label="Product Name *" placeholder="Celestial Noir" value={form.name} onChange={set('name')} error={errors.name} />
          <Input label="Brand" placeholder="Soul x Time" value={form.brand} onChange={set('brand')} />
          <Select
            label="Category"
            options={categoryOptions}
            value={form.categoryId}
            onChange={set('categoryId')}
            placeholder="Select category"
          />
        </div>
        <Textarea
          label="Description"
          placeholder="Describe this timepiece..."
          value={form.description}
          onChange={set('description')}
          rows={4}
        />
      </Section>

      {/* Specifications */}
      <Section title="Specifications">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Movement" placeholder="Swiss Automatic" value={form.movement} onChange={set('movement')} />
          <Input label="Case Material" placeholder="Grade 5 Titanium" value={form.caseMaterial} onChange={set('caseMaterial')} />
          <Input label="Strap Material" placeholder="Alligator Leather" value={form.strapMaterial} onChange={set('strapMaterial')} />
          <Input label="Case Diameter (mm)" type="number" placeholder="42" value={form.caseDiameterMm} onChange={set('caseDiameterMm')} />
          <Input label="Dial Color" placeholder="Matte Black" value={form.dialColor} onChange={set('dialColor')} />
          <Input label="Water Resistance" placeholder="100m / 10ATM" value={form.waterResistance} onChange={set('waterResistance')} />
          <Input label="Glass Type" placeholder="Anti-reflective Sapphire" value={form.glassType} onChange={set('glassType')} />
          <Select label="Style" options={[
            { value: 'Men', label: 'Men' },
            { value: 'Women', label: 'Women' },
            { value: 'Unisex', label: 'Unisex' },
          ]} value={form.genderStyle} onChange={set('genderStyle')} placeholder="Select style" />
          <Input label="Warranty (months)" type="number" placeholder="24" value={form.warrantyMonths} onChange={set('warrantyMonths')} />
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Purchase Cost (₹) *" type="number" min="0" step="0.01"
            placeholder="5000" value={form.purchaseCost} onChange={set('purchaseCost')} error={errors.purchaseCost} />
          <Input label="Selling Price (₹) *" type="number" min="0.01" step="0.01"
            placeholder="18500" value={form.sellingPrice} onChange={set('sellingPrice')} error={errors.sellingPrice} />
          <Select label="Discount Type" options={[
            { value: 'PERCENTAGE', label: 'Percentage (%)' },
            { value: 'FIXED_AMOUNT', label: 'Fixed Amount (₹)' },
          ]} value={form.discountType} onChange={set('discountType')} />
          <Input label="Discount Value" type="number" min="0" step="0.01"
            placeholder="0" value={form.discountValue} onChange={set('discountValue')} />
        </div>
        {form.sellingPrice && form.discountValue && Number(form.discountValue) > 0 && (
          <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(184,147,58,0.08)', border: '1px solid rgba(184,147,58,0.2)' }}>
            <p className="text-[#B8933A] text-sm">
              Effective Price: ₹{
                form.discountType === 'PERCENTAGE'
                  ? (Number(form.sellingPrice) * (1 - Number(form.discountValue) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                  : Math.max(0, Number(form.sellingPrice) - Number(form.discountValue)).toLocaleString('en-IN', { minimumFractionDigits: 2 })
              }
            </p>
          </div>
        )}
      </Section>

      {/* Inventory */}
      <Section title="Inventory">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Initial Stock Quantity" type="number" min="0"
            placeholder="0" value={form.stockQuantity} onChange={set('stockQuantity')} />
          <Input label="Low Stock Threshold" type="number" min="1"
            placeholder="5" value={form.lowStockThreshold} onChange={set('lowStockThreshold')}
            hint="Alert when stock falls at or below this number" />
        </div>
      </Section>

      {/* Media */}
      <Section title="Media">
        <div className="grid grid-cols-1 gap-4">
          <Input label="Primary Image URL"
            placeholder="https://images.unsplash.com/..."
            value={form.primaryImageUrl} onChange={set('primaryImageUrl')} />
          <Input label="3D Model URL (optional)"
            placeholder="https://cdn.example.com/watch.glb"
            value={form.model3dUrl} onChange={set('model3dUrl')} />
        </div>
        {form.primaryImageUrl && (
          <div className="mt-4">
            <p className="text-xs text-[#888] mb-2">Preview:</p>
            <img
              src={form.primaryImageUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-xl"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </Section>

      {/* Actions */}
      <div className="flex gap-4 justify-end pt-4 border-t border-[#1E1E1E]">
        <Link href="/admin/products">
          <Button variant="ghost" size="lg">Cancel</Button>
        </Link>
        <Button variant="gold" size="lg" onClick={handleSubmit} loading={mutation.isPending} className="gap-2">
          <Save className="w-4 h-4" />
          Create Product
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
