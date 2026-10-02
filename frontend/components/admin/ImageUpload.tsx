'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onDelete?: () => void;
  label?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onDelete,
  label = 'Product Image',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');
  const [error, setError] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadAreaStyle = {
    border: '2px dashed var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    background: isHovering ? 'rgba(93,64,55,0.06)' : 'var(--bg-elevated)',
    transition: 'all 0.2s',
    borderColor: isHovering ? 'var(--blue-accent)' : 'var(--border)',
  } as const;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    await uploadToCloudinary(file);
  };

  const uploadToCloudinary = async (file: File) => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('sxt_token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/upload/image`,
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

      // Update parent component with Cloudinary URL
      onChange(data.imageUrl);
      setPreview(data.imageUrl);

      console.log('✅ Image uploaded:', data.imageUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      setPreview(value || ''); // Revert to original
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    setPreview('');
    setError('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onDelete?.();
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}
      </label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        // capture="environment" // Opens camera on mobile
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Preview or Upload Area */}
      {preview ? (
        <div style={{ position: 'relative', width: '100%', height: '240px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          <Image
            src={preview}
            alt="Preview"
            fill
            style={{ objectFit: 'contain' }}
            unoptimized // Cloudinary handles optimization
          />

          {/* Delete button */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading}
            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239,68,68,0.9)', color: 'white', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}
          >
            🗑️ Delete
          </button>

          {/* Uploading overlay */}
          {uploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'white', padding: '16px 24px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid #ddd', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#000' }}>Uploading...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleCameraClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          style={uploadAreaStyle}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Click to select an image
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            JPG, PNG or WebP (max 10MB)
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* URL input (fallback) */}
      <details style={{ fontSize: '13px' }}>
        <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
          Or paste image URL
        </summary>
        <input
          type="url"
          value={preview}
          onChange={(e) => {
            setPreview(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="https://res.cloudinary.com/..."
          style={{ marginTop: '8px', width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '13px' }}
        />
      </details>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
