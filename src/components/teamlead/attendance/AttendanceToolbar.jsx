import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import FilterBar from '../../ui/FilterBar';

const STATUS_OPTIONS = [
  { value: 'Present', label: 'Present' },
  { value: 'WFH',     label: 'WFH'     },
  { value: 'Leave',   label: 'Leave'   },
  { value: 'Absent',  label: 'Absent'  },
];

export default function AttendanceToolbar({ searchQuery, onSearchChange, filterStatus, onStatusChange, team }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          className="mobile-filter-toggle-btn"
          onClick={() => setIsExpanded(prev => !prev)}
          style={{ marginBottom: 0 }}
        >
          <Filter size={14} /> {isExpanded ? "Hide Filters" : "Show Filters"}
        </button>

        {team && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--muted)', borderRadius: 8, padding: '6px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--foreground)' }}>
              {team.teamName || team.name}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              {team.members?.length ?? 0} members
            </span>
          </div>
        )}
      </div>

      <div
        className={`attendance-filter-bar ${isExpanded ? 'mobile-filters-open' : ''}`}
        style={{
          marginBottom: '1.5rem', borderRadius: '1rem',
          border: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={onSearchChange}
            placeholder="Search members..."
            filters={[{
              key: 'status',
              value: filterStatus,
              onChange: onStatusChange,
              placeholder: 'All Statuses',
              options: STATUS_OPTIONS,
            }]}
          />
        </div>
      </div>
    </>
  );
}