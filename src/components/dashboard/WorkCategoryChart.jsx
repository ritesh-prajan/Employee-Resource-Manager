    import React, { useState } from 'react';
    import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

    const COLORS = {
    Story: 'var(--chart-1)',
    Bug: '#ef4444',
    'R&D': 'var(--chart-2)',    
    COC: 'var(--chart-3)',
    CRC: 'var(--chart-4)',
    Support: '#f59e0b',
    POC:'#679bac',
    Feature:'#53984d',
    Subtask:'#aaaaaa',
    Epic:'#b677b7'

    };

    const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
        backgroundColor: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '0.6rem 0.85rem', boxShadow: 'var(--shadow-md)',
        }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)' }}>{payload[0].name}</p>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--foreground)' }}>
            {payload[0].value.toFixed(1)}h
        </p>
        <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>Click to view entries</p>
        </div>
    );
    };

    function Modal({ category, entries, color, onClose }) {
    const total = entries.reduce((s, e) => s + parseFloat(e.duration), 0);
    return (
        <div onClick={onClose} style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
        }}>
        <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '14px', padding: '1.5rem', width: '100%', maxWidth: '850px',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '1rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>{category}</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{entries.length} entries · {total.toFixed(1)}h total</span>
                </div>
            </div>
            <button onClick={onClose} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted-foreground)', fontSize: '1.25rem', lineHeight: 1, padding: '0 4px',
            }}>×</button>
            </div>

            {/* Entries */}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {entries.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textAlign: 'center', padding: '1rem' }}>No entries.</p>
            ) : entries.map((e, i) => (
                <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 0.75rem', borderRadius: '8px',
                backgroundColor: 'var(--secondary)', border: '1px solid var(--border)',
                }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                    <span style={{
                    fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                    {e.description || e.taskName || 'General work'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {e.date && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>{e.date}</span>
                    )}
                    {e.projectName && (
                        <span style={{
                        fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px',
                        backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', fontWeight: 500,
                        }}>{e.projectName}</span>
                    )}
                    </div>
                </div>
                <span style={{
                    fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: 'var(--foreground)', flexShrink: 0, marginLeft: '0.75rem',
                }}>{parseFloat(e.duration).toFixed(1)}h</span>
                </div>
            ))}
            </div>
        </div>
        </div>
    );
    }

    export default function WorkCategoryChart({ timeEntries }) {
    const [selected, setSelected] = useState(null);
    const [hoveredRow, setHoveredRow] = useState(null);

    const categoryMap = {};
    const categoryEntries = {};
    timeEntries.forEach(e => {
        const cat = e.workCategory || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + parseFloat(e.duration);
        if (!categoryEntries[cat]) categoryEntries[cat] = [];
        categoryEntries[cat].push(e);
    });

    const data = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const total = data.reduce((s, d) => s + d.value, 0);

    const openModal = (name) => {
        const color = COLORS[name] || 'var(--chart-5)';
        setSelected({ category: name, entries: categoryEntries[name] || [], color });
    };

    return (
        <>
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 h-full overflow-hidden shadow-sm">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h3 className="text-[0.875rem] font-semibold text-foreground">Work Categories</h3>
                    <span className="text-[0.7rem] text-muted-foreground">Hours by type · click to drill down</span>
                </div>
                <span className="text-[0.75rem] font-bold font-mono text-foreground">
                    {total.toFixed(1)}h
                </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center flex-1 min-h-0 w-full overflow-y-auto sm:overflow-hidden">
                {/* Donut */}
                <div className="flex items-center justify-center shrink-0 cursor-pointer" style={{ width: 120, height: 120 }}>
                    <PieChart width={120} height={120}>
                        <Pie
                            data={data} 
                            cx="50%" 
                            cy="50%"
                            innerRadius={36} 
                            outerRadius={55}
                            dataKey="value" 
                            strokeWidth={0}
                            onClick={(entry) => openModal(entry.name)}
                            style={{ outline: 'none' }}
                        >
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={COLORS[entry.name] || 'var(--chart-5)'} style={{ outline: 'none' }} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} position={{ x: 125, y: 20 }} />
                    </PieChart>
                </div>

                {/* Legend list */}
                <div className="flex flex-col gap-1.5 flex-1 w-full overflow-y-auto pr-1 max-h-[140px] sm:max-h-full">
                    {data.map(d => {
                        const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : 0;
                        const color = COLORS[d.name] || 'var(--chart-5)';
                        return (
                            <div
                                key={d.name}
                                onClick={() => openModal(d.name)}
                                onMouseEnter={() => setHoveredRow(d.name)}
                                onMouseLeave={() => setHoveredRow(null)}
                                className="flex items-center justify-between gap-2 cursor-pointer rounded-md px-1 py-0.5 transition-colors duration-150"
                                style={{
                                    backgroundColor: hoveredRow === d.name ? 'var(--secondary)' : 'transparent',
                                }}
                            >
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                    <span className="text-[0.72rem] font-medium text-foreground truncate">{d.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[0.68rem] text-muted-foreground">
                                    <span>{d.value.toFixed(1)}h</span>
                                    <span>({pct}%)</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {selected && <Modal {...selected} onClose={() => setSelected(null)} />}
        </>
    );
}
