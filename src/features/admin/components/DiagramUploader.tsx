import * as React from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { adminApi } from '../api/admin.api';

export interface DiagramUploaderProps {
  value?: string;
  caption?: string;
  onChange: (url: string | undefined, caption?: string) => void;
  label?: string;
  helperText?: string;
}

export const DiagramUploader: React.FC<DiagramUploaderProps> = ({
  value,
  caption = '',
  onChange,
  label = 'Attach Diagram / Figure',
  helperText = 'Upload an architectural schematic, circuit diagram, graph, or figure (PNG, JPG, SVG, WebP up to 5MB)',
}) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [prevCaption, setPrevCaption] = React.useState(caption);
  const [localCaption, setLocalCaption] = React.useState(caption);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Derive / adjust state during render when prop changes
  if (prevCaption !== caption) {
    setPrevCaption(caption);
    setLocalCaption(caption);
  }

  const handleFile = async (file: File) => {
    setError(null);
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (PNG, JPEG, WebP, SVG).');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await adminApi.uploadDiagram(file);
      if (res.data && res.data.url) {
        onChange(res.data.url, localCaption);
      } else {
        setError('Upload succeeded but no image URL was returned.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload image. Please try again.';
      setError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleFile(file);
      }
    }
  };

  const handleCaptionChange = (newCaption: string) => {
    setLocalCaption(newCaption);
    onChange(value, newCaption);
  };

  const handleRemove = () => {
    onChange(undefined, '');
    setLocalCaption('');
    setError(null);
  };

  return (
    <div style={{ marginBottom: 'var(--space-16)' }}>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {label}
      </label>
      {helperText && (
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>
          {helperText}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {value ? (
        /* Image Preview Box */
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: 'var(--space-12)',
            background: 'var(--color-bg-subtle, rgba(0, 0, 0, 0.02))',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '6px',
                overflow: 'hidden',
                background: '#fff',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src={value}
                alt="Diagram Preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 4 }}>
                <ImageIcon size={14} color="var(--color-primary)" />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  Diagram Attached
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-primary)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Replace image
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-danger, #ef4444)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Caption Input */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
              Figure Caption (Optional)
            </label>
            <input
              type="text"
              value={localCaption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              placeholder="e.g. Figure 1: Digital Filter Block Diagram"
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          role="button"
          tabIndex={0}
          onPaste={handlePaste}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: 'var(--space-20)',
            textAlign: 'center',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            background: 'var(--color-bg-subtle, rgba(0, 0, 0, 0.01))',
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
          }}
        >
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Uploading to Cloudinary CDN...
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Upload size={22} color="var(--color-text-secondary)" />
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                Drag & drop or <span style={{ color: 'var(--color-primary)' }}>browse</span> to upload diagram
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary, #888)' }}>
                You can also paste (Ctrl+V) an image here
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p style={{ marginTop: 'var(--space-6)', fontSize: '12px', color: 'var(--color-danger, #ef4444)' }}>
          {error}
        </p>
      )}
    </div>
  );
};
