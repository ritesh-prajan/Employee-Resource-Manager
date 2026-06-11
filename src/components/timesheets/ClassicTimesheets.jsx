import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, User } from "lucide-react";
import { EMPLOYEES,PROJECT_COLORS,ALL_ENTRIES,WEEKS } from "#components/mock_dataset/Data_admin_classictimesheet.js";

function toHHMM(h) {
  if (!Number.isFinite(h) || h === 0) return "00:00";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}`;
}

const TYPE_STYLES = {
  Story:   { text:"#1D4ED8", bg:"#EFF6FF", border:"#BFDBFE" },
  Bug:     { text:"#B45309", bg:"#FFFBEB", border:"#FDE68A" },
  Feature: { text:"#065F46", bg:"#ECFDF5", border:"#A7F3D0" },
  Review:  { text:"#5B21B6", bg:"#F5F3FF", border:"#DDD6FE" },
  "R&D":   { text:"#9A3412", bg:"#FFF7ED", border:"#FDBA74" },
};

const AVATAR_COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6"];
function avatarColor(name) {
  let h = 0;
  for (const c of name) h = (h + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function initials(name) {
  return name.split(" ").slice(0,2).map(w => w[0]).join("");
}

// ─── Select dropdown ──────────────────────────────────────────────────────────
function Select({ value, options, onChange, renderValue, renderOption, width = "w-48" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className={`relative ${width}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-[#E0E0EB] rounded-lg text-[13px] text-[#1A1A2E] cursor-pointer hover:border-[#6366F1] transition-colors"
      >
        <span className="truncate">{renderValue(value)}</span>
        <ChevronDown size={13} color="#888" className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180":""}`}/>
      </button>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-white border border-[#E0E0EB] rounded-xl shadow-lg overflow-hidden">
          {options.map(opt => (
            <div
              key={opt.id}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`px-3 py-2.5 text-[13px] cursor-pointer hover:bg-[#F5F5FF] transition-colors ${opt.id === value.id ? "bg-[#EEEDFE] text-[#3C3489] font-medium" : "text-[#1A1A2E]"}`}
            >
              {renderOption(opt)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const s = TYPE_STYLES[type] ?? TYPE_STYLES.Feature;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-[2px] rounded-full border whitespace-nowrap"
      style={{ color: s.text, background: s.bg, borderColor: s.border }}
    >
      {type}
    </span>
  );
}

// ─── Week row (collapsible) ───────────────────────────────────────────────────
function WeekBlock({ week, entries, openWeeks, toggleWeek }) {
  const isOpen = openWeeks[week.id] ?? false;
  const weekEntries = entries.filter(e => e.weekId === week.id);
  const weekTotal = weekEntries.reduce((s, e) => s + e.totalHours, 0);

  // Group by day
  const byDay = {};
  for (const e of weekEntries) {
    if (!byDay[e.dayKey]) byDay[e.dayKey] = [];
    byDay[e.dayKey].push(e);
  }

  // Build day rows: all 7 days, entries or empty
  const dayRows = [];
  week.dayKeys.forEach((dayKey, di) => {
    const dayEntries = byDay[dayKey] || [];
    const dayLabel = week.days[di];
    const dayTotal = dayEntries.reduce((s, e) => s + e.totalHours, 0);

    if (dayEntries.length === 0) {
      dayRows.push({ type: "empty", dayLabel, dayKey });
    } else {
      dayEntries.forEach((entry, ei) => {
        dayRows.push({
          type: "entry",
          entry,
          dayLabel: ei === 0 ? dayLabel : "",
          isFirstOfDay: ei === 0,
          isLastOfDay: ei === dayEntries.length - 1,
          dayTotal: ei === 0 ? dayTotal : null,
        });
      });
    }
  });

  return (
    <div>
      {/* Week header */}
      <div
        onClick={() => toggleWeek(week.id)}
        className="flex items-center gap-2 px-4 py-3 border-b border-[#E8E8F0] cursor-pointer select-none hover:bg-[#FAFAFC] transition-colors"
      >
        <span
          className="inline-block transition-transform duration-150 text-[#888]"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          <ChevronRight size={12} />
        </span>
        <span className="text-[13px] font-semibold text-[#1A1A2E]">{week.label}</span>
        {weekTotal > 0 && (
          <span className="ml-2 text-[12px] font-semibold text-[#3C3489]">{toHHMM(weekTotal)}</span>
        )}
      </div>

      {/* Day / entry rows */}
      {isOpen && (
        <div>
          {dayRows.map((row, idx) => {
            if (row.type === "empty") {
              return (
                <div
                  key={row.dayKey}
                  className="grid border-b border-[#F0F0F8] bg-white hover:bg-[#FAFAFC] transition-colors"
                  style={{ gridTemplateColumns: "90px 80px 1fr 1fr 70px 70px 90px 90px 100px" }}
                >
                  <span className="px-4 py-2.5 text-[12px] text-[#1A1A2E] font-medium">{row.dayLabel}</span>
                  {[...Array(8)].map((_, i) => (
                    <span key={i} className="px-2 py-2.5 text-[12px] text-[#C0C0D0] text-center">—</span>
                  ))}
                </div>
              );
            }

            const { entry, dayLabel, isFirstOfDay, dayTotal } = row;
            return (
              <div
                key={entry.id}
                className="grid border-b border-[#F0F0F8] bg-white hover:bg-[#FAFAFC] transition-colors"
                style={{ gridTemplateColumns: "90px 80px 1fr 1fr 70px 70px 90px 90px 100px" }}
              >
                {/* Date — only on first entry of day */}
                <span className="px-4 py-2.5 text-[12px] text-[#1A1A2E] font-medium whitespace-nowrap">
                  {dayLabel}
                </span>
                {/* Type badge */}
                <div className="px-2 py-2 flex items-center">
                  <TypeBadge type={entry.type} />
                </div>
                {/* Job */}
                <div className="px-2 py-2 flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: PROJECT_COLORS[entry.job] ?? "#888" }}
                  />
                  <span className="text-[12px] text-[#1A1A2E] truncate">{entry.job}</span>
                </div>
                {/* Sub job / task */}
                <div className="px-2 py-2 min-w-0">
                  <div className="text-[12px] font-medium text-[#3C3489] truncate">{entry.task}</div>
                  <div className="text-[11px] text-[#999] truncate">{entry.desc}</div>
                </div>
                {/* Start */}
                <span className="px-2 py-2.5 text-[12px] text-[#555] text-center">{entry.start}</span>
                {/* End */}
                <span className="px-2 py-2.5 text-[12px] text-[#555] text-center">{entry.end}</span>
                {/* Total hours */}
                <span className="px-2 py-2.5 text-[12px] font-semibold text-[#1A1A2E] text-center">
                  {toHHMM(entry.totalHours)}
                </span>
                {/* Daily total — only on first entry of day */}
                <span className="px-2 py-2.5 text-[12px] font-semibold text-[#1A1A2E] text-center">
                  {isFirstOfDay && dayTotal > 0 ? toHHMM(dayTotal) : ""}
                </span>
                {/* Weekly total — only on last row of last day that has entries */}
                <span className="px-3 py-2.5 text-[12px] font-bold text-[#3C3489] text-right">
                  {idx === dayRows.length - 1 && weekTotal > 0 ? toHHMM(weekTotal) : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ClassicTimesheet() {
  const [selectedEmp, setSelectedEmp] = useState(EMPLOYEES[0]);
  const [fromWeek, setFromWeek]       = useState(WEEKS[0]);
  const [toWeek, setToWeek]           = useState(WEEKS[WEEKS.length - 1]);
  const [openWeeks, setOpenWeeks]     = useState({ w3: false });

  const toggleWeek = id => setOpenWeeks(prev => ({ ...prev, [id]: !prev[id] }));

  const expandAll  = () => { const m = {}; WEEKS.forEach(w => m[w.id] = true);  setOpenWeeks(m); };
  const collapseAll= () => { const m = {}; WEEKS.forEach(w => m[w.id] = false); setOpenWeeks(m); };

  // Filter weeks by from/to selection
  const fromIdx = WEEKS.findIndex(w => w.id === fromWeek.id);
  const toIdx   = WEEKS.findIndex(w => w.id === toWeek.id);
  const visibleWeeks = WEEKS.slice(Math.min(fromIdx,toIdx), Math.max(fromIdx,toIdx)+1);

  // All entries for this employee in the visible range
  const empEntries = (ALL_ENTRIES[selectedEmp.id] || [])
    .filter(e => visibleWeeks.some(w => w.id === e.weekId));

  // Summary calculations
  const totalHours    = empEntries.reduce((s,e) => s + e.totalHours, 0);
  const paidBreaks    = empEntries.reduce((s,e) => s + (e.paidBreak ?? 0), 0);
  const unpaidBreaks  = empEntries.reduce((s,e) => s + (e.unpaidBreak ?? 0), 0);
  const regularHours  = totalHours; // simplified: all regular
  const ptoHours      = 0;

  // Project totals
  const projectTotals = {};
  for (const e of empEntries) {
    projectTotals[e.job] = (projectTotals[e.job] ?? 0) + e.totalHours;
  }

  const color = avatarColor(selectedEmp.name);

  return (
    <div className="font-sans text-[13px] bg-white border border-[#E0E0EB] rounded-xl overflow-visible">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E0E0EB]">
        <h2 className="text-[16px] font-bold text-[#1A1A2E] mr-2">Timesheet</h2>

        {/* Employee picker */}
        <Select
          value={selectedEmp}
          options={EMPLOYEES}
          onChange={setSelectedEmp}
          width="w-48"
          renderValue={emp => (
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: avatarColor(emp.name) }}>
                {initials(emp.name)}
              </span>
              {emp.name}
            </div>
          )}
          renderOption={emp => (
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: avatarColor(emp.name) }}>
                {initials(emp.name)}
              </span>
              <span>{emp.name}</span>
              <span className="text-[11px] text-[#999] ml-auto">{emp.role}</span>
            </div>
          )}
        />

        {/* From */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#999] font-medium">From:</span>
          <Select
            value={fromWeek}
            options={WEEKS}
            onChange={setFromWeek}
            width="w-44"
            renderValue={w => w.label}
            renderOption={w => w.label}
          />
        </div>

        {/* To */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#999] font-medium">To:</span>
          <Select
            value={toWeek}
            options={WEEKS}
            onChange={setToWeek}
            width="w-44"
            renderValue={w => w.label}
            renderOption={w => w.label}
          />
        </div>
      </div>

      {/* ── Project summary pills ── */}
      {Object.keys(projectTotals).length > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E0E0EB] bg-[#FAFAFC]">
          <span className="text-[11px] font-bold text-[#888] uppercase tracking-wider">
            {selectedEmp.name.split(" ")[0]}:
          </span>
          {Object.entries(projectTotals).map(([proj, hrs]) => (
            <div key={proj} className="flex items-center gap-1.5 text-[12px] text-[#1A1A2E]">
              <span className="w-2 h-2 rounded-full" style={{ background: PROJECT_COLORS[proj] ?? "#888" }} />
              <span className="font-medium">{proj}:</span>
              <span className="text-[#555]">{hrs % 1 === 0 ? hrs + ".0" : hrs} hrs</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar: expand/collapse ── */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#E0E0EB] bg-white">
        <div className="flex-1" />
        <button onClick={expandAll}   className="px-3 py-1.5 text-[12px] font-medium text-[#555] border border-[#E0E0EB] rounded-lg hover:bg-[#F5F5FF] cursor-pointer transition-colors">Expand All</button>
        <button onClick={collapseAll} className="px-3 py-1.5 text-[12px] font-medium text-[#555] border border-[#E0E0EB] rounded-lg hover:bg-[#F5F5FF] cursor-pointer transition-colors">Collapse All</button>
      </div>

      {/* ── Hours summary ── */}
      <div className="flex items-end gap-6 px-5 py-3 border-b border-[#E0E0EB] bg-[#FAFAFC]">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-bold text-[#1A1A2E]">{toHHMM(regularHours)}</span>
          <span className="text-[10px] text-[#999] uppercase tracking-wide">Regular</span>
        </div>
        <span className="text-[14px] text-[#CCC] mb-0.5">+</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-bold text-[#1A1A2E]">{toHHMM(ptoHours)}</span>
          <span className="text-[10px] text-[#999] uppercase tracking-wide">Paid time off</span>
        </div>
        <span className="text-[14px] text-[#CCC] mb-0.5">=</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[18px] font-bold text-[#3C3489]">{toHHMM(totalHours)}</span>
          <span className="text-[10px] text-[#3C3489] uppercase tracking-wide font-semibold">Total Paid Hours</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold text-[#1A1A2E]">{toHHMM(paidBreaks)}</span>
          <span className="text-[10px] text-[#999] uppercase tracking-wide">Paid Breaks</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold text-[#1A1A2E]">{toHHMM(unpaidBreaks)}</span>
          <span className="text-[10px] text-[#999] uppercase tracking-wide">Unpaid Breaks</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold text-[#1A1A2E]">00:00</span>
          <span className="text-[10px] text-[#999] uppercase tracking-wide">Unpaid time off</span>
        </div>
      </div>

      {/* ── Column header ── */}
      <div
        className="grid px-0 py-2 bg-[#F8F8FB] border-b-2 border-[#E0E0EB]"
        style={{ gridTemplateColumns: "90px 80px 1fr 1fr 70px 70px 90px 90px 100px" }}
      >
        {["DATE","TYPE","JOB","SUB JOB","START","END","TOTAL HOURS","DAILY TOTAL","WEEKLY TOTAL"].map((col, i) => (
          <span
            key={col}
            className={`px-2 text-[10px] font-bold text-[#999] uppercase tracking-wider ${i === 0 ? "pl-4" : ""} ${i >= 4 ? "text-center" : ""} ${i === 8 ? "text-right pr-3" : ""}`}
          >
            {col}
          </span>
        ))}
      </div>

      {/* ── Week blocks ── */}
      <div className="overflow-hidden rounded-b-xl">
        {visibleWeeks.length === 0 ? (
          <div className="px-5 py-10 text-center text-[#999]">No weeks in selected range.</div>
        ) : (
          visibleWeeks.map(week => (
            <WeekBlock
              key={week.id}
              week={week}
              entries={empEntries}
              openWeeks={openWeeks}
              toggleWeek={toggleWeek}
            />
          ))
        )}
      </div>
    </div>
  );
}
