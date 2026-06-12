import React from 'react';

export default function ChartCard({ title, icon: Icon, accent, children, style = {} }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem', flexShrink: 0 }}>
        {Icon && <Icon size={15} color={accent || 'var(--muted-foreground)'} />}
        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--foreground)' }}>{title}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}