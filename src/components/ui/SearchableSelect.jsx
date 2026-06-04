import React, { useState, useEffect, useRef } from 'react';

/**
 * SingleSearchSelect — searchable single-value dropdown.
 * Props:
 *   options        [{ value, label }]
 *   value          currently selected value (id string)
 *   onChange       (value) => void
 *   placeholder    string
 */
export default function SingleSearchSelect({ options, value, onChange, placeholder }) {
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

  const selectedOpt = options.find(o => o.value === value);
  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        className="input-control"
        placeholder={selectedOpt ? selectedOpt.label : placeholder}
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
            : filtered.map(opt => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setSearch(''); setIsOpen(false); }}
                style={{
                  padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '0.85rem',
                  backgroundColor: value === opt.value ? '#e6e8ff' : 'transparent',
                  color: value === opt.value ? '#0010AE' : 'var(--text-primary)',
                  fontWeight: value === opt.value ? 600 : 400
                }}
                onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.backgroundColor = 'var(--bg-canvas, #f0f1f2)'; }}
                onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {opt.label}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}