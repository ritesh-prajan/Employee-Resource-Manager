import React, { useState, useEffect, useRef } from 'react';

/**
 * MultiSearchSelect — searchable multi-value dropdown with badge pills.
 * Props:
 *   options        [{ value, label, color? }]
 *   selectedValues [value, ...]
 *   onChange       (values[]) => void
 *   placeholder    string
 */
export default function MultiSearchSelect({ options, selectedValues, onChange, placeholder }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = val => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', position: 'relative' }}>
      {/* Selected pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '24px' }}>
        {selectedValues.length === 0
          ? <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>None selected</span>
          : selectedValues.map(val => {
              const opt = options.find(o => o.value === val);
              const bg = opt?.color || '#e6e8ff';
              const fg = opt?.color ? '#ffffff' : '#0010AE';
              return (
                <span
                  key={val}
                  onClick={() => toggle(val)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    backgroundColor: bg, color: fg,
                    padding: '2px 8px', borderRadius: '4px',
                    fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  {opt ? opt.label : val}
                  <span style={{ fontWeight: 'bold', marginLeft: '2px' }}>&times;</span>
                </span>
              );
            })
        }
      </div>

      <input
        type="text"
        className="input-control"
        placeholder={placeholder}
        value={search}
        onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        style={{ fontSize: '0.85rem', padding: '10px 14px' }}
      />

      {isOpen && search.trim() !== '' && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          border: '1px solid var(--border-color)', borderRadius: '8px',
          backgroundColor: 'var(--bg-surface, #ffffff)', maxHeight: '180px',
          overflowY: 'auto', padding: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px'
        }}>
          {filtered.length === 0
            ? <div style={{ padding: '6px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No results found</div>
            : filtered.map(opt => {
                const checked = selectedValues.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',
                      fontSize: '0.85rem', userSelect: 'none',
                      backgroundColor: checked ? 'rgba(0,16,174,0.05)' : 'transparent',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(opt.value)}
                      style={{ accentColor: '#0010AE' }}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })
          }
        </div>
      )}
    </div>
  );
}