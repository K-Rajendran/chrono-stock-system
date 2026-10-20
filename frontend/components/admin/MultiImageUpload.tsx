'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { authenticatedFetch } from '@/lib/auth';

interface GalleryImage {
  id?: number;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
}

interface MultiImageUploadProps {
  productId?: number; // Only available when editing existing product
  maxImages?: number;
  onChange?: (imageUrls: string[]) => void;
}

export default function MultiImageUpload({
  productId,
  maxImages = 5,
  onChange,
}: MultiImageUploadProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(!!productId);
  const [error, setError] = useState('');

  // Fetch existing gallery images when editing product
  useEffect(() => {
    if (productId) {
      fetchGalleryImages();
    }
  }, [productId]);

  const fetchGalleryImages = async () => {
    try {
      const token = localStorage.getItem('sxt_token');
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/upload/gallery/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (err) {
      console.error('Failed to fetch gallery images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check limit
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed. Current: ${images.length}`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        setError('All files must be images');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('Each image must be less than 10MB');
        return;
      }
      
      validFiles.push(file);
    }

    // Upload to backend
    await uploadImages(validFiles);
    
    // Clear input
    e.target.value = '';
  };

  const uploadImages = async (files: File[]) => {
    if (!productId) {
      setError('Please save the product first before uploading gallery images');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const token = localStorage.getItem('sxt_token');

      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/upload/gallery/${productId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('✅ Gallery images uploaded:', data.imageUrls);

      // Refresh gallery
      await fetchGalleryImages();

      // Notify parent
      if (onChange) {
        onChange(data.imageUrls);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: number, imageUrl: string) => {
    if (!confirm('Delete this image?')) return;

    try {
      const token = localStorage.getItem('sxt_token');

      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/upload/gallery/${imageId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Delete failed');

      // Remove from local state
      setImages((prev) => prev.filter((img) => img.id !== imageId));

      console.log('✅ Image deleted:', imageUrl);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete image');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--blue-accent)',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <label
            style={{
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Gallery Images
          </label>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {images.length} / {maxImages} images
          </p>
        </div>

        {/* Upload button */}
        {productId && images.length < maxImages && (
          <label
            style={{
              padding: '8px 16px',
              background: 'rgba(93,64,55,0.10)',
              border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--blue-bright)',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {uploading ? (
              <>
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(93,64,55,0.30)',
                    borderTopColor: 'var(--blue-bright)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Uploading...
              </>
            ) : (
              <>
                📤 Upload Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </>
            )}
          </label>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            fontSize: '13px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Gallery Grid */}
      {images.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          {images.map((image) => (
            <div
              key={image.id || image.imageUrl}
              style={{
                position: 'relative',
                aspectRatio: '1',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--bg-elevated)',
              }}
            >
              <Image
                src={image.imageUrl}
                alt={image.altText || 'Gallery image'}
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
              />

              {/* Delete button */}
              <button
                type="button"
                onClick={() => image.id && handleDelete(image.id, image.imageUrl)}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: 'rgba(239,68,68,0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                }}
              >
                🗑️
              </button>

              {/* Sort order badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '6px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                }}
              >
                #{image.sortOrder + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          {productId ? (
            <>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🖼️</div>
              <p style={{ fontSize: '14px' }}>No gallery images yet</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Click "Upload Images" to add up to {maxImages} images
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>💾</div>
              <p style={{ fontSize: '14px' }}>Save product first</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Gallery images can be added after creating the product
              </p>
            </>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
