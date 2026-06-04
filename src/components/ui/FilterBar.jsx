import React from 'react';
import { Search } from 'lucide-react';

export default function FilterBar({searchValue,onSearchChange,filters,placeholder}){
    return (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
    
    {/* Search Input */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
      <Search size={16} style={{ color: 'var(--text-muted)' }} />
      <input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={onSearchChange}
        style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.85rem', color: 'var(--text-primary)' }}
      />
    </div>

    {/* Filter Dropdowns */}
    {filters.map(filter => (
      <select
        key={filter.key}
        value={filter.value}
        onChange={filter.onChange}
        className="input-control"
        style={{ fontSize: '0.85rem' }}
      >
        <option value="">{filter.placeholder}</option>
        {filter.options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ))}
  </div>
);
}