import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AppToast() {
  const toastContext = useToast();
  if (!toastContext) return null;

  const { activeToasts, removeToast } = toastContext;

  const getVariantData = (variant) => {
    switch (variant) {
      case 'success':
        return {
          color: '#4ade80',
          title: 'Success',
          icon: <CheckCircle size={16} color="#4ade80" />
        };
      case 'error':
        return {
          color: 'var(--destructive)',
          title: 'Error',
          icon: <XCircle size={16} color="var(--destructive)" />
        };
      case 'warning':
        return {
          color: '#fbbf24',
          title: 'Warning',
          icon: <AlertTriangle size={16} color="#fbbf24" />
        };
      case 'info':
      default:
        return {
          color: 'var(--primary)',
          title: 'Info',
          icon: <Info size={16} color="var(--primary)" />
        };
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        pointerEvents: 'none',
        width: '340px',
      }}
    >
      <AnimatePresence>
        {activeToasts.map((toast) => {
          const { color, title, icon } = getVariantData(toast.variant);
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              style={{
                pointerEvents: 'auto',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${color}`,
                borderRadius: '0.875rem',
                padding: '0.875rem 1rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  flexShrink: 0,
                  backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)' }}>
                  {title}
                </p>
                <p
                  style={{
                    margin: '1px 0 0',
                    fontSize: '0.73rem',
                    color: 'var(--muted-foreground)',
                    lineHeight: '1.3',
                    wordBreak: 'break-word',
                  }}
                >
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--muted-foreground)',
                  flexShrink: 0,
                }}
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
}
