import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarX, X } from 'lucide-react';

export default function ETABreachPopup({ isOpen, breaches, onClose }) {
  if (!breaches || breaches.length === 0) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderTop: '4px solid #ef4444',
              borderRadius: '1rem',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  backgroundColor: 'color-mix(in srgb, #ef4444 12%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CalendarX size={18} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>
                    ETA Breaches Detected
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                    {breaches.length} task{breaches.length > 1 ? 's are' : ' is'} past their deadline
                  </p>
                </div>
              </div>
              <button onClick={onClose} style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--muted-foreground)',
              }}>
                <X size={14} />
              </button>
            </div>

            {/* Breach list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {breaches.map(task => (
                <div key={task.id} style={{
                  padding: '0.75rem 0.875rem',
                  background: 'var(--secondary)',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid #ef4444',
                  borderRadius: '0.625rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      {task.taskNumber} — {task.name}
                    </p>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 600,
                      color: '#ef4444',
                      backgroundColor: 'color-mix(in srgb, #ef4444 10%, transparent)',
                      border: '1px solid color-mix(in srgb, #ef4444 25%, transparent)',
                      borderRadius: 4, padding: '2px 7px',
                    }}>
                      Overdue
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#ef4444' }}>
                    ETA: {new Date(task.etaDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {task.assignedTo && (
                    <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>
                      Status: {task.status}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: '0.5rem',
                  border: 'none', backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)', fontSize: '0.82rem',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}