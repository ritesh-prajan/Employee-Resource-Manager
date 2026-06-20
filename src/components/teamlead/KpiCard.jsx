import React from 'react';

export default function KpiCard({ icon: Icon, label, value, sub, accent, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px',
        padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
        cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s', flex: 1, minWidth: 0,
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ width: 40, height: 40, borderRadius: 8, background: accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={accent} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}