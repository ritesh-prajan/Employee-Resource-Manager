import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText, variant = 'danger' }) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const accentBg = isDanger 
    ? 'linear-gradient(90deg, #ef4444, #f97316)' 
    : 'linear-gradient(90deg, var(--primary), #3b82f6)';
  
  const iconColor = isDanger ? '#ef4444' : 'var(--primary)';
  const iconBg = isDanger 
    ? 'color-mix(in srgb, #ef4444 12%, transparent)' 
    : 'color-mix(in srgb, var(--primary) 12%, transparent)';
  const iconBorder = isDanger 
    ? '1px solid color-mix(in srgb, #ef4444 25%, transparent)' 
    : '1px solid color-mix(in srgb, var(--primary) 25%, transparent)';

  const btnBg = isDanger 
    ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
    : 'linear-gradient(135deg, var(--primary), #2563eb)';
  const btnShadow = isDanger 
    ? '0 2px 10px -2px rgba(239,68,68,0.45)' 
    : '0 2px 10px -2px rgba(37,99,235,0.45)';

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        backgroundColor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 24px 60px -8px rgba(0,0,0,0.22), 0 8px 20px -4px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          animation: 'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* top accent bar */}
        <div style={{ height: '4px', background: accentBg, width: '100%' }} />

        {/* Body */}
        <div style={{ padding: '1.75rem 1.75rem 1.5rem' }}>
          {/* Icon + Title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              flexShrink: 0,
              width: 44, height: 44, borderRadius: '12px',
              background: iconBg,
              border: iconBorder,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isDanger ? (
                <AlertTriangle size={22} color={iconColor} />
              ) : (
                <HelpCircle size={22} color={iconColor} />
              )}
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 750,
                color: 'var(--foreground)',
                lineHeight: 1.3,
              }}>
                {title || 'Confirm Action'}
              </h3>
              <p style={{
                margin: '0.45rem 0 0',
                fontSize: '0.85rem',
                color: 'var(--muted-foreground)',
                lineHeight: 1.55,
              }}>
                {message || 'Are you sure you want to proceed?'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          gap: '0.65rem',
          padding: '1rem 1.75rem 1.5rem',
          borderTop: '1px solid var(--border)',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--secondary)',
              color: 'var(--foreground)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--secondary)'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '0.6rem 1.35rem',
              borderRadius: '10px',
              border: 'none',
              background: btnBg,
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: btnShadow,
              transition: 'opacity 0.15s, transform 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {confirmText || (isDanger ? 'Delete' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}