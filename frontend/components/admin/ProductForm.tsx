'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from './ImageUpload';
import MultiImageUpload from './MultiImageUpload';

interface ProductFormData {
  name: string;
  sku: string;
  brand: string;
  categoryId: string;
  description: string;
  purchaseCost: string;
  sellingPrice: string;
  stockQuantity: string;
  lowStockThreshold: string;
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  active: boolean;
  primaryImageUrl: string;
  specifications: Record<string, string>;
}

interface Category { id: string; name: string; }

interface ProductFormProps {
  mode: 'new' | 'edit';
  productId?: string;
}

const FIELD = (label: string, name: keyof ProductFormData | string, el: React.ReactNode) => (
  <div key={name as string}>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</label>
    {el}
  </div>
);

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  WebkitTextFillColor: 'var(--text-primary)',
  transition: 'border-color var(--transition)',
};

export default function ProductForm({ mode, productId }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');

  const [form, setForm] = useState<ProductFormData>({
    name: '', sku: '', brand: '', categoryId: '', description: '',
    purchaseCost: '', sellingPrice: '',
    stockQuantity: '0', lowStockThreshold: '5',
    discountType: 'NONE', discountValue: '0',
    active: true, primaryImageUrl: '',
    specifications: {},
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  useEffect(() => {
    const token = localStorage.getItem('sxt_token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setCategories).catch(() => {});

    if (mode === 'edit' && productId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${productId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then((p) => {
          setForm({
            name: p.name ?? '',
            sku: p.sku ?? '',
            brand: p.brand ?? '',
            categoryId: p.categoryId ?? '',
            description: p.description ?? '',
            purchaseCost: String(p.purchaseCost ?? ''),
            sellingPrice: String(p.sellingPrice ?? ''),
            stockQuantity: String(p.stockQuantity ?? 0),
            lowStockThreshold: String(p.lowStockThreshold ?? 5),
            discountType: p.discountType ?? 'NONE',
            discountValue: String(p.discountValue ?? 0),
            active: p.active ?? true,
            primaryImageUrl: p.primaryImageUrl ?? '',
            specifications: p.specifications ?? {},
          });
        })
        .catch(() => setError('Could not load product.'))
        .finally(() => setFetching(false));
    }
  }, [mode, productId]);

  const set = (key: keyof ProductFormData, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (!form.purchaseCost || isNaN(Number(form.purchaseCost)) || Number(form.purchaseCost) < 0) e.purchaseCost = 'Valid cost required';
    if (!form.sellingPrice || isNaN(Number(form.sellingPrice)) || Number(form.sellingPrice) <= 0) e.sellingPrice = 'Valid price required';
    if (isNaN(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0) e.stockQuantity = 'Valid stock required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('sxt_token');
      const { specifications: _specifications, ...productFields } = form;
      const body = {
        ...productFields,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        discountType: form.discountType === 'NONE'
          ? null
          : form.discountType === 'FIXED'
            ? 'FIXED_AMOUNT'
            : form.discountType,
        purchaseCost: Number(form.purchaseCost),
        sellingPrice: Number(form.sellingPrice),
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold),
        discountValue: Number(form.discountValue),
      };

      const url = mode === 'new'
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${productId}`;
      const method = mode === 'new' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const responseText = await res.text();

        let message = 'Failed to save product';

        try {
          const data = JSON.parse(responseText);
          message = data.message ?? data.error ?? message;
        } catch {
          if (responseText) {
            message = responseText;
          }
        }

        console.error('Product save failed:', {
          status: res.status,
          response: responseText,
        });

        throw new Error(message);
      }

      router.push('/admin/products');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addSpec = () => {
    if (!specKey.trim()) return;
    setForm(f => ({ ...f, specifications: { ...f.specifications, [specKey.trim()]: specVal.trim() } }));
    setSpecKey(''); setSpecVal('');
  };

  const removeSpec = (key: string) => {
    const s = { ...form.specifications };
    delete s[key];
    setForm(f => ({ ...f, specifications: s }));
  };

  if (fetching) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
      <div style={{ width: 36, height: 36, border: '2px solid var(--border)', borderTopColor: 'var(--blue-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: '700', color: 'var(--text-primary)' }}>
          {mode === 'new' ? 'Add Product' : 'Edit Product'}
        </h1>
        <button onClick={() => router.back()}
          style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
          ← Cancel
        </button>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '14px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Basic info */}
        <Section title="Basic Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {FIELD('Product Name *', 'name',
              <><input style={{ ...INPUT_STYLE, borderColor: errors.name ? '#f87171' : 'var(--border)' }} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Chronograph Elite" />
              {errors.name && <span style={{ fontSize: '12px', color: '#f87171', marginTop: '4px', display: 'block' }}>{errors.name}</span>}</>
            )}
            {FIELD('SKU *', 'sku',
              <><input style={{ ...INPUT_STYLE, borderColor: errors.sku ? '#f87171' : 'var(--border)', fontFamily: 'monospace' }} value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. CHR-001" />
              {errors.sku && <span style={{ fontSize: '12px', color: '#f87171', marginTop: '4px', display: 'block' }}>{errors.sku}</span>}</>
            )}
            {FIELD('Brand', 'brand',
              <input style={INPUT_STYLE} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Seiko" />
            )}
            {FIELD('Category', 'categoryId',
              <select style={{ ...INPUT_STYLE }} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          {FIELD('Description', 'description',
            <textarea style={{ ...INPUT_STYLE, minHeight: '100px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Product description…" />
          )}
        </Section>

        {/* Pricing */}
        <Section title="Pricing">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {FIELD('Purchase Cost (₹) *', 'purchaseCost',
              <><input type="number" min="0" style={{ ...INPUT_STYLE, borderColor: errors.purchaseCost ? '#f87171' : 'var(--border)' }} value={form.purchaseCost} onChange={e => set('purchaseCost', e.target.value)} placeholder="0" />
              {errors.purchaseCost && <span style={{ fontSize: '12px', color: '#f87171', marginTop: '4px', display: 'block' }}>{errors.purchaseCost}</span>}</>
            )}
            {FIELD('Selling Price (₹) *', 'sellingPrice',
              <><input type="number" min="0" style={{ ...INPUT_STYLE, borderColor: errors.sellingPrice ? '#f87171' : 'var(--border)' }} value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} placeholder="0" />
              {errors.sellingPrice && <span style={{ fontSize: '12px', color: '#f87171', marginTop: '4px', display: 'block' }}>{errors.sellingPrice}</span>}</>
            )}
            {FIELD('Discount Type', 'discountType',
              <select style={INPUT_STYLE} value={form.discountType} onChange={e => set('discountType', e.target.value as ProductFormData['discountType'])}>
                <option value="NONE">No Discount</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            )}
            {form.discountType !== 'NONE' && FIELD(`Discount Value ${form.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}`, 'discountValue',
              <input type="number" min="0" style={INPUT_STYLE} value={form.discountValue} onChange={e => set('discountValue', e.target.value)} />
            )}
          </div>
        </Section>

        {/* Inventory */}
        <Section title="Inventory">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {FIELD(
              'Stock Quantity',
              'stockQuantity',
              <input
                type="number"
                min="0"
                step="1"
                style={{
                  ...INPUT_STYLE,
                  width: '100%',
                  boxSizing: 'border-box',
                  cursor: mode === 'edit' ? 'not-allowed' : 'text',
                  opacity: mode === 'edit' ? 0.8 : 1,
                }}
                value={form.stockQuantity}
                onChange={(e) => set('stockQuantity', e.target.value)}
                disabled={mode === 'edit'}
              />
            )}
            {FIELD('Low Stock Threshold', 'lowStockThreshold',
              <input type="number" min="0" style={INPUT_STYLE} value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)} />
            )}
          </div>
        </Section>

        {/* Media */}
        <Section title="Media">
          {/* Primary Image */}
          <ImageUpload
            label="Primary Image (Featured)"
            value={form.primaryImageUrl}
            onChange={(url) => set('primaryImageUrl', url)}
          />
          
          {/* Gallery Images - Only in Edit Mode */}
          {mode === 'edit' && productId && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <MultiImageUpload
                productId={parseInt(productId)}
                maxImages={5}
              />
            </div>
          )}
          
          {/* Info Message for New Products */}
          {mode === 'new' && (
            <div style={{ 
              marginTop: '16px',
              padding: '14px 18px', 
              background: 'rgba(61,143,212,0.05)', 
              border: '1px solid rgba(61,143,212,0.2)', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '13px', 
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '18px' }}>💡</span>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Tip:</strong> Save the product first, then you can add up to 5 gallery images on the edit page.
              </div>
            </div>
          )}
        </Section>

        {/* Specifications */}
        {/* <Section title="Specifications">
          {Object.entries(form.specifications).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '120px' }}>{key}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{val}</span>
              <button onClick={() => removeSpec(key)} style={{ padding: '4px 8px', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginTop: '12px' }}>
            <input style={INPUT_STYLE} placeholder="Spec name (e.g. Movement)" value={specKey} onChange={e => setSpecKey(e.target.value)} />
            <input style={INPUT_STYLE} placeholder="Value (e.g. Automatic)" value={specVal} onChange={e => setSpecVal(e.target.value)} />
            <button onClick={addSpec} style={{ padding: '10px 16px', background: 'rgba(61,143,212,0.1)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-md)', color: 'var(--blue-bright)', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>+ Add</button>
          </div>
        </Section> */}

        {/* Active toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => set('active', !form.active)}
            style={{
              width: '44px', height: '24px', borderRadius: '12px',
              background: form.active ? 'var(--blue-accent)' : 'var(--border)',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background var(--transition)',
            }}
          >
            <span style={{
              position: 'absolute', top: '3px', left: form.active ? '22px' : '3px',
              width: '18px', height: '18px', borderRadius: '50%', background: 'white',
              transition: 'left var(--transition)',
            }} />
          </button>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {form.active ? 'Active (visible to customers)' : 'Inactive (hidden from store)'}
          </span>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '12px 28px', background: 'var(--gold-gradient)', color: '#fff',
              fontWeight: '700', fontSize: '14px', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {loading && <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
            {loading ? 'Saving…' : mode === 'new' ? 'Create Product' : 'Save Changes'}
          </button>
          <button onClick={() => router.back()}
            style={{ padding: '12px 24px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 1fr auto"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(8,20,40,0.4)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </div>
    </div>
  );
}
