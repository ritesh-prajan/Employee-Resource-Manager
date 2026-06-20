/**
 * GlobalLoader — full-page branded loading screen shown while the app
 * checks for an existing session (AuthContext `loading` state).
 *
 * Replaces the raw `if (loading) return null` pattern in App.jsx.
 */
export default function GlobalLoader() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        backgroundColor: 'var(--background, #0f172a)',
        zIndex: 9999,
      }}
    >
      {/* Animated logo mark */}
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        {/* Outer ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: 'var(--primary, #6366f1)',
            borderRightColor: 'var(--primary, #6366f1)',
            animation: 'spin 0.9s linear infinite',
          }}
        />
        {/* Inner ring — counter-spin for depth */}
        <div
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderBottomColor: 'color-mix(in oklch, var(--primary, #6366f1) 50%, transparent)',
            animation: 'spin 1.4s linear infinite reverse',
          }}
        />
      </div>

      {/* App name */}
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--muted-foreground, #94a3b8)',
            letterSpacing: '0.04em',
          }}
        >
          Loading Employee Resource Manager…
        </p>
      </div>
    </div>
  );
}
