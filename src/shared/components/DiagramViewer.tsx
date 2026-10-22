import * as React from 'react';
import { Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface DiagramViewerProps {
  url?: string;
  src?: string;
  caption?: string;
  alt?: string;
  className?: string;
  maxHeight?: number | string;
}

export const DiagramViewer: React.FC<DiagramViewerProps> = ({
  url,
  src,
  caption,
  alt = 'Question Diagram',
  className = '',
  maxHeight = 360,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scale, setScale] = React.useState(1);

  const rawUrl = url || src || '';

  const handleOpen = () => {
    setScale(1);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setScale(1);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!rawUrl) return null;

  // Resolve relative URLs to API host if needed
  const resolvedUrl = rawUrl.startsWith('http') || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')
    ? rawUrl
    : `${import.meta.env.VITE_API_BASE_URL || ''}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

  return (
    <div style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-16)' }} className={className}>
      {/* Thumbnail Card */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
        aria-label="Click to enlarge diagram"
        style={{
          position: 'relative',
          display: 'inline-block',
          maxWidth: '100%',
          borderRadius: 'var(--radius-lg, 12px)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-subtle, rgba(0, 0, 0, 0.02))',
          cursor: 'zoom-in',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <img
          src={resolvedUrl}
          alt={alt}
          loading="lazy"
          style={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
            objectFit: 'contain',
            margin: '0 auto',
          }}
        />
        {/* Hover overlay hint */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(0, 0, 0, 0.72)',
            color: '#fff',
            borderRadius: '6px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 500,
            pointerEvents: 'none',
          }}
        >
          <Maximize2 size={13} />
          <span>Zoom</span>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <p
          style={{
            marginTop: 'var(--space-6, 6px)',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          {caption}
        </p>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-24)',
          }}
        >
          {/* Top Bar Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(30, 30, 30, 0.85)',
              padding: '6px 14px',
              borderRadius: 30,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
              title="Zoom In"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
              }}
            >
              <ZoomIn size={18} />
            </button>
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
              title="Zoom Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
              }}
            >
              <ZoomOut size={18} />
            </button>
            <button
              type="button"
              onClick={() => setScale(1)}
              title="Reset Zoom"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
              }}
            >
              <RotateCcw size={16} />
            </button>
            <span style={{ color: '#aaa', fontSize: 13, userSelect: 'none' }}>
              {Math.round(scale * 100)}%
            </span>
            <div style={{ width: 1, height: 16, background: '#444' }} />
            <button
              type="button"
              onClick={handleClose}
              title="Close (Esc)"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Expanded Image with Pan/Zoom */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={resolvedUrl}
              alt={alt}
              style={{
                maxWidth: scale === 1 ? '85vw' : 'none',
                maxHeight: scale === 1 ? '75vh' : 'none',
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}
            />
          </div>

          {caption && (
            <p
              onClick={(e) => e.stopPropagation()}
              style={{
                marginTop: 16,
                color: '#ddd',
                fontSize: 14,
                fontStyle: 'italic',
                maxWidth: '80vw',
                textAlign: 'center',
              }}
            >
              {caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
