import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, X } from 'lucide-react';

const STORAGE_KEY = 'elite_daily_task_prompt';

export function shouldShowDailyPrompt() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;
    const { date, forever } = JSON.parse(stored);
    if (forever) return false;
    return date !== new Date().toDateString();
  } catch {
    return true;
  }
}

export function dismissDailyPrompt(forever = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: new Date().toDateString(),
    forever,
  }));
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function DailyTaskPrompt({ teamMembers = [], onAssign, onClose }) {
  const [dontShow, setDontShow] = useState(false);

  const handleClose = () => {
    dismissDailyPrompt(dontShow);
    onClose();
  };

  const handleAssign = () => {
    dismissDailyPrompt(dontShow);
    onAssign();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.22 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderTop: '4px solid var(--primary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '420px',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ClipboardList size={18} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)' }}>
                  Good {getGreeting()}! 👋
                </h3>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                  Have you assigned tasks to your team today?
                </p>
              </div>
            </div>
            <button onClick={handleClose} style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 6, width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--muted-foreground)',
            }}>
              <X size={14} />
            </button>
          </div>

          {/* Team members with no tasks today */}
          {teamMembers.length > 0 && (
            <div style={{
              background: 'var(--secondary)', border: '1px solid var(--border)',
              borderRadius: '0.625rem', padding: '0.75rem', marginBottom: '1rem',
            }}>
              <p style={{
                margin: '0 0 0.5rem', fontSize: '0.73rem',
                color: 'var(--muted-foreground)', fontWeight: 600,
              }}>
                No tasks assigned to yet today:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {teamMembers.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {m.avatar && (
                      <img src={m.avatar} alt={m.name} style={{
                        width: 20, height: 20, borderRadius: '50%', objectFit: 'cover',
                      }} />
                    )}
                    <span style={{ fontSize: '0.78rem', color: 'var(--foreground)' }}>{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Don't show again */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.75rem', color: 'var(--muted-foreground)',
            cursor: 'pointer', marginBottom: '1rem',
          }}>
            <input
              type="checkbox"
              checked={dontShow}
              onChange={e => setDontShow(e.target.checked)}
              style={{ accentColor: 'var(--primary)', width: 14, height: 14 }}
            />
            Don't show this again
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                border: '1px solid var(--border)', background: 'none',
                color: 'var(--muted-foreground)', fontSize: '0.8rem', cursor: 'pointer',
              }}
            >
              Later
            </button>
            <button
              onClick={handleAssign}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                border: 'none', backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)', fontSize: '0.8rem',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Assign Tasks
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}