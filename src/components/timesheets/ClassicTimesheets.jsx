import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronRight, ChevronDown, Search, Layers, Filter, Briefcase, Tag, Clock, Users, X, Plus, AlertTriangle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import ManualTimeEntryModal from "../forms/timesheets/ManualTimeEntryModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  General: { text:"#374151", bg:"#F9FAFB", border:"#D1D5DB" },
  Break:   { text:"#854d0e", bg:"#fef9c3", border:"#fde047" },
};

const AVATAR_COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#EC4899"];
const HOUR_OPTIONS = [
  { value: '', label: 'All Hours' },
  ...Array.from({ length: 24 }, (_, i) => {
    const ampm = i >= 12 ? 'PM' : 'AM';
    const displayHour = i % 12 === 0 ? 12 : i % 12;
    return { value: String(i), label: `${displayHour} ${ampm}` };
  })
];
function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (const c of name) h = (h + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function initials(name) {
  if (!name) return "U";
  return name.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
}

// ─── Custom Select (rich dropdown) ───────────────────────────────────────────
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
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13px] cursor-pointer transition-all border"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
      >
        <span className="truncate">{renderValue(value)}</span>
        <ChevronDown size={13} className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180":""}`}
          style={{ color: "var(--muted-foreground)" }} />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full min-w-max rounded-xl shadow-xl overflow-hidden border"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {options.map(opt => (
            <div
              key={opt.id}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="px-3 py-2.5 text-[13px] cursor-pointer transition-colors"
              style={{
                background: opt.id === value?.id ? "var(--accent)" : "transparent",
                color: opt.id === value?.id ? "var(--primary)" : "var(--foreground)",
                fontWeight: opt.id === value?.id ? 600 : 400,
              }}
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
  const s = TYPE_STYLES[type] ?? TYPE_STYLES.General;
  return (
    <span className="text-[10px] font-semibold px-2 py-[2px] rounded-full border whitespace-nowrap"
      style={{ color: s.text, background: s.bg, borderColor: s.border }}>
      {type}
    </span>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function TimesheetStatusPill({ status }) {
  const map = {
    Approved: { color: '#22c55e', bg: '#22c55e1a', label: 'Approved' },
    Pending:  { color: '#3b82f6', bg: '#3b82f61a', label: 'Pending'  },
    Rejected: { color: '#ef4444', bg: '#ef44441a', label: 'Rejected' },
  };
  const cfg = map[status] || map.Pending;
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4,
      backgroundColor: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}30`, whiteSpace: 'nowrap', display: 'inline-flex',
      alignItems: 'center'
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Week row (collapsible) ───────────────────────────────────────────────────
function WeekBlock({ week, entries, openWeeks, toggleWeek, projectColors }) {
  const isOpen = openWeeks[week.id] ?? false;
  const weekEntries = entries.filter(e => e.weekId === week.id);
  const weekTotal = weekEntries.reduce((s, e) => s + e.totalHours, 0);

  const byDay = {};
  for (const e of weekEntries) {
    if (!byDay[e.dayKey]) byDay[e.dayKey] = [];
    byDay[e.dayKey].push(e);
  }

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
          type: "entry", entry,
          dayLabel: ei === 0 ? dayLabel : "",
          isFirstOfDay: ei === 0,
          dayTotal: ei === 0 ? dayTotal : null,
        });
      });
    }
  });

  return (
    <div>
      {/* Week header */}
      <div onClick={() => toggleWeek(week.id)}
        className="flex items-center gap-2 px-4 py-3 border-b cursor-pointer select-none transition-colors"
        style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
        <span className="inline-block transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", color: "var(--muted-foreground)" }}>
          <ChevronRight size={12} />
        </span>
        <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>{week.label}</span>
        {weekTotal > 0 && (
          <span className="ml-2 text-[12px] font-bold px-2 py-0.5 rounded-full border"
            style={{ color: "var(--primary)", background: "var(--accent)", borderColor: "var(--border)" }}>
            {toHHMM(weekTotal)}
          </span>
        )}
        {weekTotal === 0 && (
          <span className="ml-2 text-[11px] italic" style={{ color: "var(--muted-foreground)" }}>No entries</span>
        )}
      </div>

      {isOpen && (
        <div>
          {dayRows.map((row, idx) => {
            if (row.type === "empty") {
              return (
                <div key={row.dayKey}
                  className="grid border-b transition-colors"
                  style={{ gridTemplateColumns: "90px 80px 1fr 1fr 70px 70px 90px 90px 100px", background: "var(--card)", borderColor: "var(--border)" }}>
                  <span className="px-4 py-2.5 text-[12px] font-medium" style={{ color: "var(--muted-foreground)" }}>{row.dayLabel}</span>
                  {[...Array(8)].map((_, i) => (
                    <span key={i} className="px-2 py-2.5 text-[12px] text-center" style={{ color: "var(--border)" }}>—</span>
                  ))}
                </div>
              );
            }
            const { entry, dayLabel, isFirstOfDay, dayTotal } = row;
            return (
              <div key={entry.id}
                className="grid border-b transition-colors"
                style={{ gridTemplateColumns: "90px 80px 1fr 1fr 70px 70px 90px 90px 100px", background: "var(--card)", borderColor: "var(--border)" }}>
                <span className="px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap" style={{ color: "var(--foreground)" }}>{dayLabel}</span>
                <div className="px-2 py-2 flex items-center"><TypeBadge type={entry.type} /></div>
                <div className="px-2 py-2 flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: projectColors[entry.job] ?? "#888" }} />
                  <span className="text-[12px] truncate" style={{ color: "var(--foreground)" }}>{entry.job}</span>
                </div>
                <div className="px-2 py-2 min-w-0">
                  <div className="text-[12px] font-semibold truncate flex items-center gap-1.5" style={{ color: entry.isOverEta ? "#ef4444" : "var(--primary)" }}>
                    {entry.isOverEta && <AlertTriangle size={12} className="shrink-0 text-red-500 animate-pulse" />}
                    <span className="truncate">{entry.task}</span>
                    <TimesheetStatusPill status={entry.status} />
                  </div>
                  <div className="text-[11px] italic truncate" style={{ color: "var(--muted-foreground)" }}>{entry.desc}</div>
                </div>
                <span className="px-2 py-2.5 text-[12px] text-center" style={{ color: "var(--muted-foreground)" }}>{entry.start}</span>
                <span className="px-2 py-2.5 text-[12px] text-center" style={{ color: "var(--muted-foreground)" }}>{entry.end}</span>
                <span className="px-2 py-2.5 text-[12px] font-bold text-center" style={{ color: "var(--foreground)" }}>{toHHMM(entry.totalHours)}</span>
                <span className="px-2 py-2.5 text-[12px] font-bold text-center" style={{ color: "var(--foreground)" }}>
                  {isFirstOfDay && dayTotal > 0 ? toHHMM(dayTotal) : ""}
                </span>
                <span className="px-3 py-2.5 text-[12px] font-bold text-right" style={{ color: "var(--primary)" }}>
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
  const { users, projects, tasks, timeEntries, teams, currentUser } = useApp();

  const [classifyBy, setClassifyBy] = useState("employee");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  const [searchQuery,     setSearchQuery]     = useState("");
  const [teamFilter,      setTeamFilter]      = useState("all");
  const [roleFilter,      setRoleFilter]      = useState("all");
  const [projectFilter,   setProjectFilter]   = useState("all");
  const [categoryFilter,  setCategoryFilter]  = useState("all");
  const [statusFilter,    setStatusFilter]    = useState("all");
  const [startHourFilter, setStartHourFilter] = useState("");
  const [endHourFilter,   setEndHourFilter]   = useState("");

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [fromWeekId, setFromWeekId] = useState(null);
  const [toWeekId,   setToWeekId]   = useState(null);
  const [openWeeks,  setOpenWeeks]  = useState({});

  const projectColors = useMemo(() => {
    const m = {};
    projects.forEach(p => { m[p.name] = p.color || "#888"; m[p.id] = p.color || "#888"; });
    return m;
  }, [projects]);

  const dynamicWeeks = useMemo(() => {
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0,0,0,0);
    const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const DN = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const pad = n => String(n).padStart(2,"0");
    return Array.from({ length: 4 }, (_, i) => {
      const ws = new Date(monday); ws.setDate(monday.getDate() - (3 - i) * 7);
      const we = new Date(ws);     we.setDate(ws.getDate() + 6); we.setHours(23,59,59,999);
      const from = `${ws.getFullYear()}-${pad(ws.getMonth()+1)}-${pad(ws.getDate())}`;
      const to   = `${we.getFullYear()}-${pad(we.getMonth()+1)}-${pad(we.getDate())}`;
      const days = [], dayKeys = [];
      for (let d = 0; d < 7; d++) {
        const dd = new Date(ws); dd.setDate(ws.getDate() + d);
        days.push(`${DN[d]} ${dd.getDate()}/${dd.getMonth()+1}`);
        dayKeys.push(`${dd.getFullYear()}-${pad(dd.getMonth()+1)}-${pad(dd.getDate())}`);
      }
      return { id: `w${i+1}`, label: `${MN[ws.getMonth()]} ${ws.getDate()} – ${MN[we.getMonth()]} ${we.getDate()}`, from, to, days, dayKeys };
    });
  }, []);

  useEffect(() => {
    if (dynamicWeeks.length) {
      setFromWeekId(dynamicWeeks[0].id);
      setToWeekId(dynamicWeeks[dynamicWeeks.length - 1].id);
    }
  }, [dynamicWeeks]);

  const isEmployee = currentUser?.role === 'Employee';

  const subjectOptions = useMemo(() => {
    if (classifyBy === "employee") {
      const list = isEmployee ? [currentUser].filter(Boolean) : users;
      return list.map(u => ({ id: u.id, name: u.name, role: u.role }));
    }
    if (classifyBy === "project") {
      const list = isEmployee ? projects.filter(p => p.members?.includes(currentUser.id)) : projects;
      return list.map(p => ({ id: p.id, name: p.name, color: p.color }));
    }
    if (classifyBy === "team") {
      const list = isEmployee ? teams.filter(t => t.members?.includes(currentUser.id) || t.leadId === currentUser.id || t.subLeadId === currentUser.id) : teams;
      return list.map(t => ({ id: t.id, name: t.name }));
    }
    return [];
  }, [classifyBy, users, projects, teams, currentUser, isEmployee]);

  useEffect(() => {
    setSelectedSubjectId(subjectOptions[0]?.id ?? null);
  }, [classifyBy, subjectOptions]);

  const selectedSubject = useMemo(
    () => subjectOptions.find(s => s.id === selectedSubjectId) || subjectOptions[0],
    [subjectOptions, selectedSubjectId]
  );

  const allEntries = useMemo(() => {
    const DN = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const map = {};
    users.forEach(user => {
      map[user.id] = timeEntries
        .filter(e => e.userId === user.id)
        .map(e => {
          const week = dynamicWeeks.find(w => e.date >= w.from && e.date <= w.to);
          if (!week) return null;
          const proj = projects.find(p => p.id === e.projectId);
          const projName = proj ? proj.name : "Internal R&D";
          const taskObj  = tasks.find(t => t.id === e.taskId);
          const taskLabel = taskObj ? `${taskObj.taskNumber} ${taskObj.name}` : e.description || "Manual Entry";
          
          // Check if task exceeds ETA
          const isOverEta = taskObj && parseFloat(taskObj.logged || 0) > parseFloat(taskObj.eta || 0);

          let dayName = "Mon";
          try {
            const d = new Date(e.date);
            if (!isNaN(d)) dayName = DN[(d.getDay() + 6) % 7];
          } catch(_) {}
          return {
            id: e.id, weekId: week.id,
            date: `${dayName} ${new Date(e.date).getDate()}/${new Date(e.date).getMonth()+1}`,
            dayKey: e.date,
            type: e.workCategory || "Story",
            job: projName, projectId: e.projectId,
            task: taskLabel, desc: e.description,
            start: e.startTime, end: e.endTime,
            totalHours: parseFloat(e.duration) || 0,
            status: e.status || "Pending",
            userId: user.id,
            isOverEta
          };
        }).filter(Boolean);
    });
    return map;
  }, [users, timeEntries, projects, tasks, dynamicWeeks]);

  const fromIdx = dynamicWeeks.findIndex(w => w.id === fromWeekId);
  const toIdx   = dynamicWeeks.findIndex(w => w.id === toWeekId);
  const visibleWeeks = dynamicWeeks.slice(
    Math.min(fromIdx < 0 ? 0 : fromIdx, toIdx < 0 ? 0 : toIdx),
    Math.max(fromIdx < 0 ? 4 : fromIdx, toIdx < 0 ? 4 : toIdx) + 1
  );

  const targetUserIds = useMemo(() => {
    if (isEmployee) return [currentUser?.id].filter(Boolean);
    if (!selectedSubject) return [];
    if (classifyBy === "employee") return [selectedSubject.id];
    if (classifyBy === "project") {
      const proj = projects.find(p => p.id === selectedSubject.id);
      return proj ? (proj.members || []) : [];
    }
    if (classifyBy === "team") {
      const team = teams.find(t => t.id === selectedSubject.id);
      if (!team) return [];
      return [...new Set([...(team.members || []), team.leadId, team.subLeadId].filter(Boolean))];
    }
    return [];
  }, [classifyBy, selectedSubject, projects, teams, isEmployee, currentUser]);

  const filteredEntries = useMemo(() => {
    let entries = [];
    targetUserIds.forEach(uid => { entries = entries.concat(allEntries[uid] || []); });
    return entries.filter(e => {
      if (!visibleWeeks.some(w => w.id === e.weekId)) return false;
      if (categoryFilter !== "all" && e.type !== categoryFilter) return false;
      if (statusFilter   !== "all" && e.status !== statusFilter) return false;
      if (projectFilter  !== "all" && e.projectId !== projectFilter) return false;
      if (teamFilter !== "all") {
        const team = teams.find(t => t.id === teamFilter);
        if (team && !team.members.includes(e.userId) && team.leadId !== e.userId && team.subLeadId !== e.userId) return false;
      }
      if (roleFilter !== "all") {
        const u = users.find(u => u.id === e.userId);
        if (u && u.role !== roleFilter) return false;
      }
      if (searchQuery) {
        const u = users.find(u => u.id === e.userId);
        const nameMatch = u && u.name.toLowerCase().includes(searchQuery.toLowerCase());
        const taskMatch = e.task.toLowerCase().includes(searchQuery.toLowerCase());
        if (!nameMatch && !taskMatch) return false;
      }
      if (startHourFilter !== '') {
        const entryHour = parseInt(e.start.split(':')[0]);
        if (isNaN(entryHour) || entryHour < parseInt(startHourFilter)) return false;
      }
      if (endHourFilter !== '') {
        const entryHour = parseInt(e.end.split(':')[0]);
        if (isNaN(entryHour) || entryHour > parseInt(endHourFilter)) return false;
      }
      return true;
    });
  }, [targetUserIds, allEntries, visibleWeeks, categoryFilter, statusFilter, projectFilter, teamFilter, roleFilter, searchQuery, startHourFilter, endHourFilter, teams, users]);

  const totalHours   = filteredEntries.reduce((s,e) => s + e.totalHours, 0);
  const regularHours = totalHours;
  const ptoHours     = 0;

  const summaryPills = useMemo(() => {
    const pills = {};
    filteredEntries.forEach(e => {
      const key = classifyBy === "project" ? (users.find(u=>u.id===e.userId)?.name || "Unknown") : e.job;
      pills[key] = (pills[key] ?? 0) + e.totalHours;
    });
    return pills;
  }, [filteredEntries, classifyBy, users]);

  const activeFilters = [teamFilter,roleFilter,projectFilter,categoryFilter,statusFilter,searchQuery,startHourFilter,endHourFilter]
    .filter(f => f && f !== "all" && f !== "").length;

  const clearAllFilters = () => {
    setSearchQuery(""); setTeamFilter("all"); setRoleFilter("all");
    setProjectFilter("all"); setCategoryFilter("all"); setStatusFilter("all");
    setStartHourFilter(""); setEndHourFilter("");
  };

  const toggleWeek  = id => setOpenWeeks(prev => ({ ...prev, [id]: !prev[id] }));
  const expandAll   = () => { const m = {}; dynamicWeeks.forEach(w => { m[w.id] = true;  }); setOpenWeeks(m); };
  const collapseAll = () => { const m = {}; dynamicWeeks.forEach(w => { m[w.id] = false; }); setOpenWeeks(m); };

  const fromWeek = dynamicWeeks.find(w => w.id === fromWeekId) || dynamicWeeks[0];
  const toWeek   = dynamicWeeks.find(w => w.id === toWeekId)   || dynamicWeeks[dynamicWeeks.length - 1];

  return (
    <div className="timesheet-console font-sans text-[13px] rounded-2xl overflow-visible shadow-sm border"
      style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>

      {/* ══ Filter Bar ══════════════════════════════════════════════════════ */}
      <button
        className="mobile-filter-toggle-btn"
        onClick={() => setIsFiltersExpanded(prev => !prev)}
      >
        <Filter size={14} /> {isFiltersExpanded ? "Hide Filters" : "Show Filters"}
      </button>
      <div className={`timesheet-filter-bar px-5 py-4 border-b rounded-t-2xl ${isFiltersExpanded ? 'mobile-filters-open' : ''}`}
        style={{ borderColor: "var(--border)", background: "var(--card)" }}>

        {/* Row 1: Classify By + Subject picker + Week range */}
        <div className="flex flex-wrap items-center gap-3 mb-3">

          {/* Classify By toggle */}
          {!isEmployee && (
            <div className="flex items-center gap-1 rounded-xl p-1 border shadow-sm"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              {[
                { val: "employee", label: "Employee", icon: <Users size={12}/> },
                { val: "project",  label: "Project",  icon: <Briefcase size={12}/> },
                { val: "team",     label: "Team",      icon: <Layers size={12}/> },
              ].map(({ val, label, icon }) => (
                <button
                  key={val}
                  onClick={() => setClassifyBy(val)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer"
                  style={{
                    background: classifyBy === val ? "var(--primary)" : "transparent",
                    color: classifyBy === val ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  }}
                >
                  {icon}{label}
                </button>
              ))}
            </div>
          )}

          {/* Subject dropdown */}
          {!isEmployee && selectedSubject && (
            <Select
              value={selectedSubject}
              options={subjectOptions}
              onChange={opt => setSelectedSubjectId(opt.id)}
              width="w-52"
              renderValue={opt => (
                <div className="flex items-center gap-2">
                  {classifyBy === "employee" && (
                    <span className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ background: avatarColor(opt.name) }}>
                      {initials(opt.name)}
                    </span>
                  )}
                  {classifyBy === "project" && (
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: opt.color || "#888" }} />
                  )}
                  <span className="truncate">{opt.name}</span>
                </div>
              )}
              renderOption={opt => (
                <div className="flex items-center gap-2">
                  {classifyBy === "employee" && (
                    <span className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ background: avatarColor(opt.name) }}>
                      {initials(opt.name)}
                    </span>
                  )}
                  {classifyBy === "project" && (
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: opt.color || "#888" }} />
                  )}
                  <span>{opt.name}</span>
                  {classifyBy === "employee" && opt.role && (
                    <span className="ml-auto text-[11px]" style={{ color: "var(--muted-foreground)" }}>{opt.role}</span>
                  )}
                </div>
              )}
            />
          )}

          {/* Week FROM */}
          {fromWeek && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase" style={{ color: "var(--muted-foreground)" }}>From</span>
              <select value={fromWeekId || ""} onChange={e => setFromWeekId(e.target.value)}>
                {dynamicWeeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </div>
          )}

          {/* Week TO */}
          {toWeek && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase" style={{ color: "var(--muted-foreground)" }}>To</span>
              <select value={toWeekId || ""} onChange={e => setToWeekId(e.target.value)}>
                {dynamicWeeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </div>
          )}

          <div className="flex-1" />

          <button onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg cursor-pointer transition-all text-white hover:opacity-90 animate-fade-in"
            style={{ background: "var(--primary)", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <Plus size={12} /> Add Time Log
          </button>
          <button onClick={expandAll}
            className="px-3 py-1.5 text-[12px] font-medium rounded-lg cursor-pointer transition-colors border"
            style={{ color: "var(--foreground)", borderColor: "var(--border)", background: "var(--card)" }}>
            Expand All
          </button>
          <button onClick={collapseAll}
            className="px-3 py-1.5 text-[12px] font-medium rounded-lg cursor-pointer transition-colors border"
            style={{ color: "var(--foreground)", borderColor: "var(--border)", background: "var(--card)" }}>
            Collapse All
          </button>
        </div>

        {/* Row 2: Search + Filters */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 w-56 border transition-all"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <Search size={14} className="shrink-0" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              placeholder={isEmployee ? "Search task..." : "Search name or task..."}
              className="bg-transparent border-none outline-none text-[12px] w-full"
              style={{ color: "var(--foreground)" }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="cursor-pointer hover:opacity-70" style={{ color: "var(--muted-foreground)" }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Team filter */}
          {!isEmployee && classifyBy !== "team" && (
            <div className="flex items-center gap-1.5">
              <Layers size={13} style={{ color: "var(--muted-foreground)" }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Team:</span>
              <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
                <option value="all">All Teams</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          {/* Role filter */}
          {!isEmployee && classifyBy !== "employee" && (
            <div className="flex items-center gap-1.5">
              <Filter size={13} style={{ color: "var(--muted-foreground)" }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Role:</span>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="Employee">Employee</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}

          {/* Project filter */}
          {classifyBy !== "project" && (
            <div className="flex items-center gap-1.5">
              <Briefcase size={13} style={{ color: "var(--muted-foreground)" }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Project:</span>
              <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
                <option value="all">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {/* Category */}
          <div className="flex items-center gap-1.5">
            <Tag size={13} style={{ color: "var(--muted-foreground)" }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Category:</span>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="Story">Story</option>
              <option value="Bug">Bug</option>
              <option value="Feature">Feature</option>
              <option value="Support">Support</option>
              <option value="Meeting">Meeting</option>
              <option value="Admin">Admin</option>
              <option value="Break">Break</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <Clock size={13} style={{ color: "var(--muted-foreground)" }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Status:</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Hour range filters */}
          <div className="flex items-center gap-1.5">
            <Clock size={13} style={{ color: "var(--muted-foreground)" }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Hours:</span>
            <select value={startHourFilter} onChange={e => setStartHourFilter(e.target.value)}>
              {HOUR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <span className="text-xs text-slate-400">—</span>
            <select value={endHourFilter} onChange={e => setEndHourFilter(e.target.value)}>
              {HOUR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {/* Clear filters */}
          {activeFilters > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold rounded-xl cursor-pointer transition-colors"
              style={{ color: "var(--destructive)", border: "1px solid var(--destructive)" }}
            >
              <X size={12} /> Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* ══ Summary pills ═══════════════════════════════════════════════════ */}
      {Object.keys(summaryPills).length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            {classifyBy === "project" ? "Members:" : "Projects:"}
          </span>
          {Object.entries(summaryPills).slice(0, 8).map(([key, hrs]) => (
            <div key={key} className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--foreground)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
              <span className="font-medium">{key}:</span>
              <span style={{ color: "var(--muted-foreground)" }}>{hrs.toFixed(1)} hrs</span>
            </div>
          ))}
        </div>
      )}

      {/* ══ Hours summary bar ════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-end gap-6 px-5 py-3 border-b"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[20px] font-bold" style={{ color: "var(--primary)" }}>{toHHMM(totalHours)}</span>
          <span className="text-[10px] uppercase tracking-wide font-bold" style={{ color: "var(--primary)" }}>Total Paid Hours</span>
        </div>
        <div className="flex-1" />
        <div className="text-[12px] italic" style={{ color: "var(--muted-foreground)" }}>
          {filteredEntries.length} entr{filteredEntries.length === 1 ? "y" : "ies"} across {visibleWeeks.length} week{visibleWeeks.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ══ Column headers ══════════════════════════════════════════════════ */}
      <div className="grid px-0 py-2.5 border-b-2"
        style={{ gridTemplateColumns: "90px 80px 1fr 1fr 70px 70px 90px 90px 100px", background: "var(--card)", borderColor: "var(--border)" }}>
        {["DATE","TYPE","JOB","SUB JOB","START","END","TOTAL HRS","DAILY","WEEKLY"].map((col, i) => (
          <span key={col}
            style={{ color: "var(--muted-foreground)" }}
            className={`px-2 text-[10px] font-bold uppercase tracking-widest
              ${i === 0 ? "pl-4" : ""}
              ${i >= 4 && i <= 7 ? "text-center" : ""}
              ${i === 8 ? "text-right pr-3" : ""}`}>
            {col}
          </span>
        ))}
      </div>

      {/* ══ Week blocks ═════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-b-2xl">
        {visibleWeeks.length === 0 ? (
          <div className="px-5 py-12 text-center" style={{ color: "var(--muted-foreground)" }}>No weeks in range.</div>
        ) : filteredEntries.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-[14px] font-medium" style={{ color: "var(--muted-foreground)" }}>No entries match your filters</div>
            <div className="text-[12px] mt-1" style={{ color: "var(--muted-foreground)" }}>Try adjusting or clearing the filters above</div>
          </div>
        ) : (
          visibleWeeks.map(week => (
            <WeekBlock
              key={week.id}
              week={week}
              entries={filteredEntries}
              openWeeks={openWeeks}
              toggleWeek={toggleWeek}
              projectColors={projectColors}
            />
          ))
        )}
      </div>

      <ManualTimeEntryModal
        show={showManualModal}
        onClose={() => setShowManualModal(false)}
        defaultDate={new Date().toISOString().split('T')[0]}
      />
    </div>
  );
}