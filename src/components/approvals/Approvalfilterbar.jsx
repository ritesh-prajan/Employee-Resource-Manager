import React from 'react';
import { Search, X, Filter } from 'lucide-react';

/**
 * ApprovalFilterBar
 * Props:
 *   searchQuery        — string
 *   onSearchChange     — (val) => void
 *   selectedUserId     — string
 *   onUserChange       — (id) => void
 *   selectedProjectId  — string
 *   onProjectChange    — (id) => void
 *   showOnlyOverruns   — bool
 *   onOverrunsChange   — (bool) => void
 *   userOptions        — [{ id, name }]
 *   projectOptions     — [{ id, name }]
 *   onClear            — () => void
 *   hasActiveFilters   — bool
 */
export default function ApprovalFilterBar({
  searchQuery,
  onSearchChange,
  selectedUserId,
  onUserChange,
  selectedProjectId,
  onProjectChange,
  showOnlyOverruns,
  onOverrunsChange,
  userOptions,
  projectOptions,
  onClear,
  hasActiveFilters,
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <>
      <button
        className="mobile-filter-toggle-btn"
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <Filter size={14} /> {isExpanded ? "Hide Filters" : "Show Filters"}
      </button>
      <div
        className={`approval-filter-bar ${isExpanded ? 'mobile-filters-open' : ''}`}
        style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.25rem',
        borderRadius: '14px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--secondary)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '0.45rem 0.85rem',
          width: 240,
        }}
      >
        <Search size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search staff, task, project..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: '0.8rem',
            color: 'var(--foreground)',
            width: '100%',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex', padding: 0 }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Employee filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Staff:
        </span>
        <select
          value={selectedUserId}
          onChange={(e) => onUserChange(e.target.value)}
          className="input-control"
          style={{ fontSize: '0.8rem' }}
        >
          <option value="">All Staff</option>
          {userOptions.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {/* Project filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Project:
        </span>
        <select
          value={selectedProjectId}
          onChange={(e) => onProjectChange(e.target.value)}
          className="input-control"
          style={{ fontSize: '0.8rem' }}
        >
          <option value="">All Projects</option>
          {projectOptions.map((p) => (
            <option key={p.id} value={p.id}>{p.name.split(' (')[0]}</option>
          ))}
        </select>
      </div>

      {/* ETA overruns toggle */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--muted-foreground)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <input
          type="checkbox"
          checked={showOnlyOverruns}
          onChange={(e) => onOverrunsChange(e.target.checked)}
          style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: 14, height: 14 }}
        />
        ETA Overruns Only
      </label>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: 'none',
            border: '1px solid var(--destructive)',
            borderRadius: '8px',
            padding: '0.3rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--destructive)',
            cursor: 'pointer',
          }}
        >
          <X size={11} /> Clear Filters
        </button>
      )}
    </div>
    </>
  );
}