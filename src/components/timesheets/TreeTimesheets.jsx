import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useApp } from "../../context/AppContext";
import {
  ChevronRight, Calendar, Briefcase, ChevronLeft, ChevronDown,
  Search, Layers, Filter, Tag, Clock, X, Users
} from "lucide-react";

function gettotal(node) {
  if (!node.children || node.children.length === 0) return node.hours ?? 0;
  return node.children.reduce((sum, child) => sum + gettotal(child), 0);
}

function formatHHMM(hours) {
  if (!Number.isFinite(hours) || hours <= 0) return "-";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const AVATAR_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"];

function avatarcolor(name) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (const c of name) h = (h + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function initials(name) {
  if (!name) return "U";
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const dayNames   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function buildTreeFromContext(users, projects, tasks, timeEntries, filters) {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const { searchQuery, teamFilter, roleFilter, projectFilter, categoryFilter, statusFilter, teams, customDate, weekMode } = filters;
  const pad = n => String(n).padStart(2, '0');
  const weekOffsets = [3, 2, 1, 0];

  if (customDate) {
    const cd = new Date(customDate);
    if (!isNaN(cd)) {
      const cdDow = cd.getDay();
      const cdMonday = new Date(cd);
      cdMonday.setDate(cd.getDate() - (cdDow === 0 ? 6 : cdDow - 1));
      cdMonday.setHours(0, 0, 0, 0);
      const diffWeeks = Math.round((monday - cdMonday) / (7 * 24 * 60 * 60 * 1000));
      weekOffsets.length = 0;
      if (weekMode === "before") {
        weekOffsets.push(diffWeeks + 3, diffWeeks + 2, diffWeeks + 1, diffWeeks);
      } else if (weekMode === "after") {
        weekOffsets.push(diffWeeks, diffWeeks - 1, diffWeeks - 2, diffWeeks - 3);
      } else {
        weekOffsets.push(diffWeeks + 2, diffWeeks + 1, diffWeeks, diffWeeks - 1);
      }
    }
  }

  const dynamicWeeks = [];

  for (const i of weekOffsets) {
    const ws = new Date(monday); ws.setDate(monday.getDate() - i * 7);
    const we = new Date(ws);     we.setDate(ws.getDate() + 6); we.setHours(23, 59, 59, 999);

    const label = (() => {
      const s = `${monthNames[ws.getMonth()]} ${ws.getDate()}`;
      const e = `${monthNames[we.getMonth()]} ${we.getDate()}, ${we.getFullYear()}`;
      return `Week of ${s} - ${e}`;
    })();
    const startStr = `${ws.getFullYear()}-${pad(ws.getMonth()+1)}-${pad(ws.getDate())}`;
    const endStr   = `${we.getFullYear()}-${pad(we.getMonth()+1)}-${pad(we.getDate())}`;

    let weekEntries = timeEntries.filter(e => e.date >= startStr && e.date <= endStr);
    if (categoryFilter !== "all")  weekEntries = weekEntries.filter(e => (e.workCategory||"Story") === categoryFilter);
    if (statusFilter   !== "all")  weekEntries = weekEntries.filter(e => (e.status||"Pending")      === statusFilter);
    if (projectFilter  !== "all")  weekEntries = weekEntries.filter(e => e.projectId                === projectFilter);

    const byProj = {};
    weekEntries.forEach(e => {
      const pid = e.projectId || "other";
      if (!byProj[pid]) byProj[pid] = [];
      byProj[pid].push(e);
    });

    const projectNodes = [];
    for (const pid in byProj) {
      const projEntries = byProj[pid];
      const projObj  = projects.find(p => p.id === pid);
      const projName = projObj ? projObj.name : (pid === "other" ? "Internal Tasks" : pid);

      const byUser = {};
      projEntries.forEach(e => {
        if (!byUser[e.userId]) byUser[e.userId] = [];
        byUser[e.userId].push(e);
      });

      const personNodes = [];
      for (const uid in byUser) {
        const userObj  = users.find(u => u.id === uid);
        const userName = userObj ? userObj.name : "Unknown";
        const userRole = userObj ? userObj.role  : "Employee";

        if (roleFilter !== "all" && userRole !== roleFilter) continue;
        if (teamFilter !== "all") {
          const team = teams.find(t => t.id === teamFilter);
          if (team && !team.members.includes(uid) && team.leadId !== uid) continue;
        }
        if (searchQuery && !userName.toLowerCase().includes(searchQuery.toLowerCase())) {
          const hasTaskMatch = byUser[uid].some(e => {
            const task = tasks.find(t => t.id === e.taskId);
            return task && task.name.toLowerCase().includes(searchQuery.toLowerCase());
          });
          if (!hasTaskMatch) continue;
        }

        const entryNodes = byUser[uid].map(entry => {
          const taskObj   = tasks.find(t => t.id === entry.taskId);
          const taskLabel = taskObj ? `${taskObj.taskNumber} ${taskObj.name}` : entry.description || "Time Entry";
          let fmtDate = entry.date;
          try {
            const d = new Date(entry.date);
            if (!isNaN(d)) fmtDate = `${dayNames[(d.getDay()+6)%7]} ${d.getDate()}/${d.getMonth()+1}`;
          } catch(_) {}
          return {
            id: entry.id, type: "entry",
            date: fmtDate, dayKey: entry.date,
            entryType: entry.workCategory || "Story",
            task: taskLabel, start: entry.startTime, end: entry.endTime,
            hours: parseFloat(entry.duration) || 0,
            description: entry.description, children: []
          };
        });

        personNodes.push({
          id: `person-${uid}-wk${3-i}`, type: "person",
          label: userName, role: userRole, children: entryNodes
        });
      }
      if (personNodes.length === 0) continue;

      projectNodes.push({
        id: `proj-${pid}-wk${3-i}`, type: "project",
        label: `Project: ${projName}`, color: projObj?.color,
        children: personNodes
      });
    }

    dynamicWeeks.push({
      id: `dw-${3-i}`, type: "week", label,
      dateRange: { start: ws, end: we },
      children: projectNodes
    });
  }
  return dynamicWeeks;
}

function WeekRow({ node, isopen, Ontoggle }) {
  const total = gettotal(node);
  return (
    <div onClick={Ontoggle}
      className="grid items-center px-0 py-[11px] border-b cursor-pointer select-none transition-colors"
      style={{ gridTemplateColumns: "90px 80px 1fr 1fr 70px 70px 90px 90px 100px", background: "var(--secondary)", borderColor: "var(--border)" }}>
      <div className="col-span-8 flex items-center gap-2 pl-4">
        <span className="inline-block transition-transform duration-200"
          style={{ transform: isopen ? "rotate(90deg)" : "rotate(0deg)", color: "var(--muted-foreground)" }}>
          <ChevronRight size={12} strokeWidth={2.5} />
        </span>
        <Calendar size={14} className="shrink-0" style={{ color: "var(--primary)" }} />
        <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>{node.label}</span>
      </div>
      <div className="text-right pr-3">
        {total > 0
          ? <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md" style={{ color: "var(--primary)", background: "var(--accent)", border: "1px solid var(--border)" }}>{total.toFixed(1)} hrs</span>
          : <span className="text-[11px] italic" style={{ color: "var(--muted-foreground)" }}>No entries</span>}
      </div>
    </div>
  );
}

function ProjectRow({ node, isopen, Ontoggle }) {
  const total = gettotal(node);
  return (
    <div onClick={Ontoggle}
      className="grid items-center px-0 py-[10px] border-b cursor-pointer select-none transition-colors"
      style={{ gridTemplateColumns: "90px 80px 1fr 1fr 70px 70px 90px 90px 100px", background: "var(--secondary)", borderColor: "var(--border)" }}>
      <div className="col-span-8 flex items-center gap-2 pl-8">
        <span className="inline-block transition-transform duration-200"
          style={{ transform: isopen ? "rotate(90deg)" : "rotate(0deg)", color: "var(--muted-foreground)" }}>
          <ChevronRight size={12} strokeWidth={2.5} />
        </span>
        {node.color
          ? <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: node.color }} />
          : <Briefcase size={13} className="shrink-0" style={{ color: "var(--primary)" }} />}
        <span className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>{node.label}</span>
      </div>
      <div className="text-right pr-3">
        <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md"
          style={{ color: "var(--primary)", background: "var(--accent)", border: "1px solid var(--border)" }}>
          {total.toFixed(1)} hrs
        </span>
      </div>
    </div>
  );
}

function PersonRow({ node, isopen, Ontoggle }) {
  const total = gettotal(node);
  const color = avatarcolor(node.label);
  return (
    <div onClick={Ontoggle}
      className="grid items-center px-0 py-[10px] border-b cursor-pointer select-none transition-colors"
      style={{ gridTemplateColumns: "90px 80px 1fr 1fr 70px 70px 90px 90px 100px", background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="col-span-8 flex items-center gap-2 pl-12">
        <span className="inline-block transition-transform duration-200"
          style={{ transform: isopen ? "rotate(90deg)" : "rotate(0deg)", color: "var(--muted-foreground)" }}>
          <ChevronRight size={12} strokeWidth={2.5} />
        </span>
        <span className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm"
          style={{ background: color }}>
          {initials(node.label)}
        </span>
        <span className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
          {node.label}{" "}
          <span className="text-[11px] font-normal" style={{ color: "var(--muted-foreground)" }}>({node.role})</span>
        </span>
      </div>
      <div className="text-right pr-4 text-[12px] font-semibold whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
        {total.toFixed(1)} hrs
      </div>
    </div>
  );
}

function EntryRow({ node, projectLabel }) {
  const isFirstOfDay   = node.isFirstOfDay  ?? true;
  const isFirstOverall = node.isFirstOverall ?? false;
  const dayTotal       = node.dayTotal  ?? 0;
  const weeklyTotal    = node.weeklyTotal ?? 0;

  return (
    <div className="grid items-start px-0 py-2.5 border-b transition-colors"
      style={{ gridTemplateColumns: "90px 80px 1fr 1fr 70px 70px 90px 90px 100px", background: "var(--card)", borderColor: "var(--border)" }}>
      <span className="pl-4 text-[12px] font-medium whitespace-nowrap" style={{ color: "var(--foreground)" }}>
        {isFirstOfDay ? node.date : ""}
      </span>
      <span className="px-2 text-[11px] font-semibold pt-[2px]" style={{ color: "var(--muted-foreground)" }}>{node.entryType}</span>
      <div className="px-2 flex items-center gap-1.5 min-w-0">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--primary)" }} />
        <span className="text-[12px] font-medium truncate" style={{ color: "var(--foreground)" }}>{projectLabel || "General"}</span>
      </div>
      <div className="px-2 min-w-0">
        <div className="text-[12px] font-semibold truncate" style={{ color: "var(--primary)" }}>{node.task}</div>
        {node.description && (
          <div className="text-[11px] italic truncate mt-0.5" style={{ color: "var(--muted-foreground)" }}>{node.description}</div>
        )}
      </div>
      <span className="text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>{node.start}</span>
      <span className="text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>{node.end}</span>
      <span className="text-center text-[12px] font-bold" style={{ color: "var(--foreground)" }}>{formatHHMM(node.hours)}</span>
      <span className="text-center text-[12px] font-bold" style={{ color: "var(--foreground)" }}>{isFirstOfDay && dayTotal > 0 ? formatHHMM(dayTotal) : ""}</span>
      <span className="text-right pr-4 text-[12px] font-bold" style={{ color: "var(--primary)" }}>{isFirstOverall ? formatHHMM(weeklyTotal) : ""}</span>
    </div>
  );
}

function TreeNode({ node, depth = 0, openmap, setopenmap, projectLabel = "" }) {
  const isopen    = openmap[node.id] ?? false;
  const hasChildren = (node.children?.length ?? 0) > 0;
  const toggle    = () => setopenmap(prev => ({ ...prev, [node.id]: !isopen }));

  const RowMap = { week: WeekRow, project: ProjectRow, person: PersonRow, entry: EntryRow };
  const Row    = RowMap[node.type];

  let childrenToRender = node.children || [];
  if (node.type === "person" && hasChildren) {
    const byDay = {};
    node.children.forEach(c => {
      if (!byDay[c.dayKey || c.date]) byDay[c.dayKey || c.date] = [];
      byDay[c.dayKey || c.date].push(c);
    });
    const weeklyTotal = node.children.reduce((s, e) => s + (e.hours ?? 0), 0);
    let firstOverall  = true;
    const processed   = [];
    Object.values(byDay).forEach(dayEntries => {
      const dayTotal = dayEntries.reduce((s, e) => s + (e.hours ?? 0), 0);
      dayEntries.forEach((entry, idx) => {
        processed.push({ ...entry, isFirstOfDay: idx === 0, dayTotal, isFirstOverall: firstOverall, weeklyTotal });
        firstOverall = false;
      });
    });
    childrenToRender = processed;
  }

  return (
    <div>
      <Row node={node} isopen={isopen} Ontoggle={toggle} projectLabel={projectLabel} />
      {isopen && hasChildren && childrenToRender.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          openmap={openmap}
          setopenmap={setopenmap}
          projectLabel={node.type === "project" ? node.label.replace("Project: ", "") : projectLabel}
        />
      ))}
    </div>
  );
}

function collectIds(node) {
  const ids = [node.id];
  for (const c of node.children || []) ids.push(...collectIds(c));
  return ids;
}

function ColHeader() {
  return (
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
  );
}

function WeeksDropdown({ weeks, selectedIds, onToggle, customDate, onCustomDate, weekMode, onWeekMode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium cursor-pointer transition-colors border"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
        <Calendar size={13} style={{ color: "var(--primary)" }} />
        Weeks ({selectedIds.length})
        <ChevronDown size={12} style={{ color: "var(--muted-foreground)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 rounded-xl shadow-xl min-w-[240px] pt-2.5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest px-3.5 pb-2"
            style={{ color: "var(--muted-foreground)" }}>Select Weeks</div>
          <div className="pb-1" style={{ borderBottom: "1px solid var(--border)" }}>
            {weeks.map(w => (
              <label key={w.id}
                className="flex items-center gap-2.5 px-3.5 py-2 cursor-pointer text-[12px] hover:opacity-80"
                style={{ color: selectedIds.includes(w.id) ? "var(--foreground)" : "var(--muted-foreground)" }}>
                <input type="checkbox" checked={selectedIds.includes(w.id)}
                  onChange={() => onToggle(w.id)}
                  className="w-3.5 h-3.5 rounded" style={{ accentColor: "var(--primary)" }} />
                <span>{w.label}</span>
              </label>
            ))}
          </div>
          <div className="px-3.5 py-2.5 flex flex-col gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase mb-1.5" style={{ color: "var(--muted-foreground)" }}>Jump to date</div>
              <input type="date" value={customDate} onChange={e => onCustomDate(e.target.value)}
                className="input-control text-[12px]" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase mb-1.5" style={{ color: "var(--muted-foreground)" }}>Show weeks</div>
              <div className="flex gap-1">
                {[["before","← Before"],["both","Both"],["after","After →"]].map(([val, label]) => (
                  <button key={val} onClick={() => onWeekMode(val)}
                    className="flex-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition border cursor-pointer"
                    style={{
                      background: weekMode === val ? "var(--primary)" : "var(--card)",
                      color: weekMode === val ? "var(--primary-foreground)" : "var(--muted-foreground)",
                      borderColor: weekMode === val ? "var(--primary)" : "var(--border)"
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TreeTimesheets() {
  const { users, projects, tasks, timeEntries, teams } = useApp();

  const [searchQuery,    setSearchQuery]    = useState("");
  const [teamFilter,     setTeamFilter]     = useState("all");
  const [roleFilter,     setRoleFilter]     = useState("all");
  const [projectFilter,  setProjectFilter]  = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [customDate,     setCustomDate]     = useState(() => new Date().toISOString().split("T")[0]);
  const [weekMode,       setWeekMode]       = useState("before");

  const activeFilterCount = [teamFilter,roleFilter,projectFilter,categoryFilter,statusFilter,searchQuery]
    .filter(f => f && f !== "all").length;

  const clearFilters = () => {
    setSearchQuery(""); setTeamFilter("all"); setRoleFilter("all");
    setProjectFilter("all"); setCategoryFilter("all"); setStatusFilter("all");
  };

  const weeks = useMemo(() => buildTreeFromContext(
    users, projects, tasks, timeEntries,
    { searchQuery, teamFilter, roleFilter, projectFilter, categoryFilter, statusFilter, teams, customDate, weekMode }
  ), [users, projects, tasks, timeEntries, searchQuery, teamFilter, roleFilter, projectFilter, categoryFilter, statusFilter, teams, customDate, weekMode]);

  const [selectedIds, setSelectedIds] = useState(() => weeks.map(w => w.id));
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [openmap,     setOpenmap]     = useState({});

  useEffect(() => { setSelectedIds(weeks.map(w => w.id)); }, [weeks]);

  const toggleWeek    = id => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const visibleWeeks  = weeks.filter(w => selectedIds.includes(w.id));
  const allVisibleIds = visibleWeeks.flatMap(w => collectIds(w));
  const expandAll     = () => { const m = {}; allVisibleIds.forEach(id => { m[id] = true;  }); setOpenmap(m); };
  const collapseAll   = () => { const m = {}; allVisibleIds.forEach(id => { m[id] = false; }); setOpenmap(m); };

  const focusRef = useRef(null);
  const onPrev   = () => setCurrentIdx(i => Math.max(0, i - 1));
  const onNext   = () => setCurrentIdx(i => Math.min(weeks.length - 1, i + 1));

  useEffect(() => {
    const targetId = weeks[currentIdx]?.id;
    if (!targetId) return;
    if (!selectedIds.includes(targetId)) setSelectedIds(prev => [...prev, targetId]);
    setTimeout(() => { if (focusRef.current) focusRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, 50);
  }, [currentIdx, weeks]);

  useEffect(() => {
    if (!customDate) return;
    const d = new Date(customDate);
    if (isNaN(d)) return;
    const idx = weeks.findIndex(w => d >= w.dateRange.start && d <= w.dateRange.end);
    if (idx !== -1) {
      setCurrentIdx(idx);
      if (!selectedIds.includes(weeks[idx].id)) setSelectedIds(prev => [...prev, weeks[idx].id]);
    }
  }, [customDate, weeks]);

  const totalVisibleHours = useMemo(() => visibleWeeks.reduce((s, w) => s + gettotal(w), 0), [visibleWeeks]);

  const totalEntryCount = useMemo(() => {
    function countEntries(node) {
      if (node.type === "entry") return 1;
      return (node.children || []).reduce((s, c) => s + countEntries(c), 0);
    }
    return visibleWeeks.reduce((s, w) => s + countEntries(w), 0);
  }, [visibleWeeks]);

  return (
    <div className="font-sans rounded-2xl text-[13px] shadow-sm"
      style={{ border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }}>

      <div className="px-5 py-4 border-b rounded-t-2xl" style={{ borderColor: "var(--border)", background: "var(--card)" }}>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button onClick={onPrev} disabled={currentIdx <= 0}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border cursor-pointer transition ${currentIdx <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <ChevronLeft size={14} style={{ color: "var(--foreground)" }} />
          </button>
          <button onClick={onNext} disabled={currentIdx >= weeks.length - 1}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border cursor-pointer transition ${currentIdx >= weeks.length - 1 ? "opacity-40 cursor-not-allowed" : ""}`}
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <ChevronRight size={14} style={{ color: "var(--foreground)" }} />
          </button>

          <WeeksDropdown
            weeks={weeks} selectedIds={selectedIds} onToggle={toggleWeek}
            customDate={customDate} onCustomDate={setCustomDate}
            weekMode={weekMode} onWeekMode={setWeekMode}
          />

          <div className="flex-1" />

          {totalEntryCount > 0 && (
            <div className="flex items-center gap-2 text-[12px] rounded-xl px-3 py-1.5 border"
              style={{ color: "var(--muted-foreground)", background: "var(--card)", borderColor: "var(--border)" }}>
              <span className="font-bold" style={{ color: "var(--primary)" }}>{totalVisibleHours.toFixed(1)} hrs</span>
              <span style={{ color: "var(--border)" }}>·</span>
              <span>{totalEntryCount} entries</span>
            </div>
          )}

          <button onClick={expandAll}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition border"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
            Expand All
          </button>
          <button onClick={collapseAll}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition border"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
            Collapse All
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 w-56 border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <Search size={14} className="shrink-0" style={{ color: "var(--muted-foreground)" }} />
            <input type="text" placeholder="Search name or task..."
              className="bg-transparent border-none outline-none text-[12px] w-full"
              style={{ color: "var(--foreground)" }}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="cursor-pointer hover:opacity-70" style={{ color: "var(--muted-foreground)" }}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Layers size={13} style={{ color: "var(--muted-foreground)" }} />
            <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
              <option value="all">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={13} style={{ color: "var(--muted-foreground)" }} />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="Employee">Employee</option>
              <option value="Team Lead">Team Lead</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Briefcase size={13} style={{ color: "var(--muted-foreground)" }} />
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Tag size={13} style={{ color: "var(--muted-foreground)" }} />
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="Story">Story</option>
              <option value="Bug">Bug</option>
              <option value="Feature">Feature</option>
              <option value="Review">Review</option>
              <option value="R&D">R&D</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock size={13} style={{ color: "var(--muted-foreground)" }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold rounded-xl cursor-pointer transition-colors"
              style={{ color: "var(--destructive)", border: "1px solid var(--destructive)" }}>
              <X size={12} /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      <ColHeader />

      <div className="overflow-hidden rounded-b-2xl">
        {visibleWeeks.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-[14px] font-medium" style={{ color: "var(--muted-foreground)" }}>No weeks selected</div>
            <div className="text-[12px] mt-1" style={{ color: "var(--muted-foreground)" }}>Use the Weeks dropdown above to select weeks</div>
          </div>
        ) : totalEntryCount === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-[14px] font-medium" style={{ color: "var(--muted-foreground)" }}>No entries match your filters</div>
            <div className="text-[12px] mt-1" style={{ color: "var(--muted-foreground)" }}>Try adjusting the filters or clearing them</div>
          </div>
        ) : (
          visibleWeeks.map((week) => (
            <div key={week.id} ref={week.id === weeks[currentIdx]?.id ? focusRef : null}>
              <TreeNode node={week} depth={0} openmap={openmap} setopenmap={setOpenmap} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}