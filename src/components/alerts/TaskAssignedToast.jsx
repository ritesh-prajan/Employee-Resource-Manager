import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, X } from 'lucide-react';

export default function TaskAssignedToast({ task, onClose, onView, duration = 5000 }) {
  useEffect(() => {
    if (!task) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [task, duration, onClose]);

  return createPortal(
    <AnimatePresence>
      {task && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed', bottom: '1.5rem', right: '1.5rem',
            zIndex: 1100, maxWidth: 340, width: '100%',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--primary)',
            borderRadius: '0.875rem',
            padding: '0.875rem 1rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckSquare size={16} color="var(--primary)" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)' }}>
              New Task Assigned
            </p>
            {task.taskNumber && (
              <p style={{ margin: '1px 0 0', fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                {task.taskNumber}
              </p>
            )}
            <p style={{
              margin: '1px 0 0', fontSize: '0.73rem', color: 'var(--muted-foreground)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {task.name || task.title}
            </p>
            {task.etaDate && (
              <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>
                Due: {new Date(task.etaDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={onView}
              style={{
                padding: '0.3rem 0.7rem', borderRadius: 6, fontSize: '0.72rem',
                fontWeight: 600, border: 'none',
                backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)',
                cursor: 'pointer',
              }}
            >
              View
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--muted-foreground)',
              }}
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}