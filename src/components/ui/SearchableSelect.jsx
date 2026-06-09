import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder, style }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', minWidth: '150px', ...style }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.45rem 0.75rem', fontSize: '0.75rem', height: '100%', minHeight: '32px',
          backgroundColor: 'var(--bg-ring)', border: '1px solid var(--border-color)', borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        <span style={{ color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)', overflow: 'visible', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {value && (
            <X size={12} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onChange(''); }} />
          )}
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
          backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-color)', borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '200px', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              autoFocus
              placeholder="Search..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.75rem', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ overflowY: 'auto' }}>
            <div 
              onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
              style={{
                padding: '8px 12px', fontSize: '0.75rem', cursor: 'pointer',
                backgroundColor: !value ? 'rgba(0,16,174,0.05)' : 'transparent',
                color: !value ? '#0010AE' : 'var(--text-primary)'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = !value ? 'rgba(0,16,174,0.05)' : 'transparent'}
            >
              {placeholder}
            </div>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No results</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                  style={{
                    padding: '8px 12px', fontSize: '0.75rem', cursor: 'pointer',
                    backgroundColor: value === opt.value ? 'rgba(0,16,174,0.05)' : 'transparent',
                    color: value === opt.value ? '#0010AE' : 'var(--text-primary)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = value === opt.value ? 'rgba(0,16,174,0.05)' : 'transparent'}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
