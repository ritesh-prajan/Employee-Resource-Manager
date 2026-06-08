import React from 'react';

/**
 * AvatarGroup
 * Renders a row of overlapping initials circles.
 * Props:
 *   users     — array of user objects (need .name, .id)
 *   max       — how many to show before "+N" overflow badge (default 5)
 *   size      — px size of each circle (default 26)
 */
export default function AvatarGroup({ users = [], max = 5, size = 26 }) {
  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((user, i) => (
        <div
          key={user.id || i}
          title={user.name}
          className="user-initials-badge"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.38,
            marginLeft: i === 0 ? 0 : -(size * 0.3),
            border: '2px solid var(--background)',
            zIndex: visible.length - i,
            flexShrink: 0,
          }}
        >
          {getInitials(user.name)}
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            width: size,
            height: size,
            fontSize: size * 0.35,
            marginLeft: -(size * 0.3),
            borderRadius: '50%',
            backgroundColor: 'var(--muted)',
            color: 'var(--muted-foreground)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            border: '2px solid var(--background)',
            flexShrink: 0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}