import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from "../../context/AppContext";
import { ChevronRight, Calendar, Briefcase, ChevronLeft, ChevronDown, Search, Layers, Filter, Tag, Users, X, Plus, AlertTriangle } from "lucide-react";
import ManualTimeEntryModal from "../forms/timesheets/ManualTimeEntryModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function gettotal(node) {
  if (!node.children || node.children.length === 0) return node.hours ?? 0;
  return node.children.reduce((sum, child) => sum + gettotal(child), 0);
}

const AVATAR_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

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

const BADGE_COLORS = {
  Story:   { text: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
  Bug:     { text: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  Feature: { text: "#065F46", bg: "#ECFDF5", border: "#A7F3D0" },
  Review:  { text: "#5B21B6", bg: "#F5F3FF", border: "#DDD6FE" },
  "R&D":   { text: "#9A3412", bg: "#FFF7ED", border: "#FDBA74" },
  Epic:    { text: "#1E3A8A", bg: "#DBEAFE", border: "#93C5FD" },
  Break:   { text: "#854d0e", bg: "#fef9c3", border: "#fde047" },
};

const formatWeekLabel = (monday, sunday) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m1 = months[monday.getMonth()];
  const m2 = months[sunday.getMonth()];
  const y1 = monday.getFullYear();
  if (m1 === m2) {
    return `Week of ${m1} ${monday.getDate()} - ${sunday.getDate()}, ${y1}`;
  } else {
    return `Week of ${m1} ${monday.getDate()} - ${m2} ${sunday.getDate()}, ${y1}`;
  }
};

const buildTreeFromContext = ({ users, projects, tasks, timeEntries, teams, currentUser }, filters) => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mondayOfCurrentWeek = new Date(today);
  mondayOfCurrentWeek.setDate(today.getDate() + diff);
  mondayOfCurrentWeek.setHours(0, 0, 0, 0);

  const weeksToGenerate = 4;
  const dynamicWeeks = [];
  const DN = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const isEmployee = currentUser?.role === 'Employee';

  for (let i = 0; i < weeksToGenerate; i++) {
    const weeksAgo = weeksToGenerate - 1 - i;
    const weekMonday = new Date(mondayOfCurrentWeek);
    weekMonday.setDate(mondayOfCurrentWeek.getDate() - (weeksAgo * 7));

    const weekSunday = new Date(weekMonday);
    weekSunday.setDate(weekMonday.getDate() + 6);
    weekSunday.setHours(23, 59, 59, 999);

    const label = formatWeekLabel(weekMonday, weekSunday);

    const weekEntries = (timeEntries || []).filter(e => {
      const eDate = new Date(e.date);
      if (isNaN(eDate) || eDate < weekMonday || eDate > weekSunday) return false;

      if (isEmployee && e.userId !== currentUser?.id) return false;

      // Apply filters:
      if (filters.statusFilter && filters.statusFilter !== "all" && e.status !== filters.statusFilter) return false;
      if (filters.categoryFilter && filters.categoryFilter !== "all" && e.workCategory !== filters.categoryFilter) return false;
      if (filters.projectFilter && filters.projectFilter !== "all" && e.projectId !== filters.projectFilter) return false;
      if (filters.teamFilter && filters.teamFilter !== "all") {
        const team = (teams || []).find(t => t.id === filters.teamFilter);
        if (team && !team.members.includes(e.userId) && team.leadId !== e.userId) return false;
      }
      if (filters.roleFilter && filters.roleFilter !== "all") {
        const u = (users || []).find(u => u.id === e.userId);
        if (u && u.role !== filters.roleFilter) return false;
      }
      if (filters.searchQuery) {
        const u = (users || []).find(u => u.id === e.userId);
        const taskObj = (tasks || []).find(t => t.id === e.taskId);
        const taskLabel = taskObj ? `${taskObj.taskNumber} ${taskObj.name}` : e.description || "";
        const nameMatch = u && u.name.toLowerCase().includes(filters.searchQuery.toLowerCase());
        const taskMatch = taskLabel.toLowerCase().includes(filters.searchQuery.toLowerCase());
        if (!nameMatch && !taskMatch) return false;
      }
      return true;
    });

    const projectMap = {};
    weekEntries.forEach(entry => {
      const projId = entry.projectId || "internal-rd";
      const proj = (projects || []).find(p => p.id === projId);
      const projName = proj ? proj.projectName || proj.name : "Internal R&D";
      const projLabel = `Project: ${projName}`;

      if (!projectMap[projId]) {
        projectMap[projId] = {
          id: `week-${i}-proj-${projId}`,
          type: "project",
          label: projLabel,
          projectId: projId,
          color: proj ? proj.colorHex || proj.color : null,
          childrenMap: {}
        };
      }

      const userId = entry.userId;
      const user = (users || []).find(u => u.id === userId);
      const userName = user ? user.name : "Unknown Employee";
      const userRole = user ? user.role : "Employee";

      if (!projectMap[projId].childrenMap[userId]) {
        projectMap[projId].childrenMap[userId] = {
          id: `week-${i}-proj-${projId}-user-${userId}`,
          type: "person",
          label: userName,
          role: userRole,
          userId: userId,
          children: []
        };
      }

      const taskObj = (tasks || []).find(t => t.id === entry.taskId);
      const taskLabel = taskObj ? `${taskObj.taskNumber} ${taskObj.name}` : entry.description || "Manual Entry";
      
      let dayName = "Mon";
      try {
        const d = new Date(entry.date);
        if (!isNaN(d)) dayName = DN[(d.getDay() + 6) % 7];
      } catch(_) {}
      const formattedDate = `${dayName} ${new Date(entry.date).getDate()}/${new Date(entry.date).getMonth() + 1}`;

      // Check if task exceeds ETA
      const isOverEta = taskObj && parseFloat(taskObj.logged || 0) > parseFloat(taskObj.eta || 0);

      projectMap[projId].childrenMap[userId].children.push({
        id: entry.id,
        type: "entry",
        date: formattedDate,
        dayKey: entry.date,
        entryType: entry.workCategory || "Story",
        task: taskLabel,
        desc: entry.description,
        start: entry.startTime,
        end: entry.endTime,
        hours: parseFloat(entry.duration) || 0,
        taskId: entry.taskId,
        isOverEta
      });
    });

    const projectChildren = Object.values(projectMap).map(projNode => {
      const peopleChildren = Object.values(projNode.childrenMap).map(personNode => {
        personNode.children.sort((a, b) => a.dayKey.localeCompare(b.dayKey));
        return personNode;
      }).filter(p => p.children.length > 0);
      
      peopleChildren.sort((a, b) => a.label.localeCompare(b.label));
      
      return {
        id: projNode.id,
        type: projNode.type,
        label: projNode.label,
        color: projNode.color,
        children: peopleChildren
      };
    }).filter(p => p.children.length > 0);

    projectChildren.sort((a, b) => a.label.localeCompare(b.label));

    dynamicWeeks.push({
      id: `dynamic-week-${i}`,
      type: "week",
      label,
      dateRange: { start: weekMonday, end: weekSunday },
      children: projectChildren
    });
  }

  return dynamicWeeks;
};

// ─── Row components ───────────────────────────────────────────────────────────
function weekrow({ node, isopen, Ontoggle }) {
  const total = gettotal(node);
  return (
    <div
      onClick={Ontoggle}
      className="grid items-center px-4 py-[11px] border-b cursor-pointer select-none hover:bg-slate-100 font-sans"
      style={{
        gridTemplateColumns: "120px 80px 100px 1fr 80px 80px 100px 100px 140px",
        background: "var(--secondary)",
        borderColor: "var(--border)",
        color: "var(--foreground)"
      }}
    >
      <div className="col-span-8 flex items-center gap-2.5">
        <span
          className="inline-block transition-transform duration-150"
          style={{ transform: isopen ? "rotate(90deg)" : "rotate(0deg)", color: "var(--muted-foreground)" }}
        >
          <ChevronRight size={10} />
        </span>
        <span style={{ color: '#0010ae' }}><Calendar size={13} /></span>
        <span className="text-[13px] font-semibold">{node.label}</span>
      </div>
      <div className="text-right pr-4">
        <span className="text-[11px] font-semibold px-3 py-[3px] rounded-full whitespace-nowrap border"
          style={{ color: "var(--primary)", background: "var(--accent)", borderColor: "var(--border)" }}>
          {total.toFixed(1)} hrs logged
        </span>
      </div>
    </div>
  );
}

function projectrow({ node, isopen, Ontoggle }) {
  const total = gettotal(node);
  return (
    <div
      onClick={Ontoggle}
      className="grid items-center px-4 py-[11px] border-b cursor-pointer select-none hover:bg-slate-100 font-sans"
      style={{
        gridTemplateColumns: "120px 80px 100px 1fr 80px 80px 100px 100px 140px",
        background: "var(--card)",
        borderColor: "var(--border)",
        color: "var(--foreground)"
      }}
    >
      <div className="col-span-8 flex items-center gap-2.5 pl-6">
        <span
          className="inline-block transition-transform duration-150"
          style={{ transform: isopen ? "rotate(90deg)" : "rotate(0deg)", color: "var(--muted-foreground)" }}
        >
          <ChevronRight size={10} />
        </span>
        <span className="text-blue-500"><Briefcase size={13} /></span>
        <span className="text-[13px] font-semibold">{node.label}</span>
      </div>
      <div className="text-right pr-4">
        <span className="text-[11px] font-semibold px-3 py-[3px] rounded-full whitespace-nowrap border"
          style={{ color: "var(--primary)", background: "var(--accent)", borderColor: "var(--border)" }}>
          {total.toFixed(1)} hrs logged
        </span>
      </div>
    </div>
  );
}

function personrow({ node, isopen, Ontoggle }) {
  const total = gettotal(node);
  const color = avatarcolor(node.label);
  return (
    <div
      onClick={Ontoggle}
      className="grid items-center px-4 py-[11px] border-b cursor-pointer select-none hover:bg-slate-100 font-sans"
      style={{
        gridTemplateColumns: "120px 80px 100px 1fr 80px 80px 100px 100px 140px",
        background: "var(--card)",
        borderColor: "var(--border)",
        color: "var(--foreground)"
      }}
    >
      <div className="col-span-8 flex items-center gap-2.5 pl-12 font-medium">
        <span
          className="inline-block transition-transform duration-150"
          style={{ transform: isopen ? "rotate(90deg)" : "rotate(0deg)", color: "var(--muted-foreground)" }}
        >
          <ChevronRight size={10} />
        </span>
        <span
          className="w-[22px] h-[22px] rounded-full text-white flex items-center justify-center text-[9px] font-semibold shrink-0"
          style={{ background: color }}
        >
          {initials(node.label)}
        </span>
        <span className="text-[13px]">
          {node.label}{" "}
          <span className="text-[11px] font-normal" style={{ color: "var(--muted-foreground)" }}>({node.role})</span>
        </span>
      </div>
      <div className="text-right pr-4 text-[12px] font-medium whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
        {total.toFixed(1)} hrs logged
      </div>
    </div>
  );
}

function entryrow({ node, isFirstOfDate, isFirstOfPerson, dailyTotal, weeklyTotal, projectLabel, projectColor, currentUser, navigate }) {
  const badge = BADGE_COLORS[node.entryType] ?? BADGE_COLORS.Feature;
  const displayColor = projectColor || avatarcolor(projectLabel || "AAM");

  const formatHHMM = (h) => {
    if (!Number.isFinite(h) || h <= 0) return "";
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  return (
    <div
      className="grid items-center px-4 py-2 border-b hover:bg-slate-50 font-sans"
      style={{
        gridTemplateColumns: "120px 80px 100px 1fr 80px 80px 100px 100px 140px",
        background: "var(--card)",
        borderColor: "var(--border)",
        color: "var(--foreground)"
      }}
    >
      <span className="text-[12px] font-medium pl-14 whitespace-nowrap" style={{ color: "var(--foreground)" }}>
        {isFirstOfDate ? node.date : ""}
      </span>
      <div className="flex items-center">
        <span
          className="text-[10px] font-semibold px-2 py-[2px] rounded-full border whitespace-nowrap"
          style={{ color: badge.text, background: badge.bg, borderColor: badge.border }}
        >
          {node.entryType || "Epic"}
        </span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: displayColor }} />
        <span className="text-[12px] truncate font-medium">{projectLabel || "AAM"}</span>
      </div>
      <div className="min-w-0 pr-2">
        <div className="text-[12px] font-semibold truncate flex items-center gap-1" style={{ color: node.isOverEta ? "#ef4444" : "var(--primary)" }}>
          {node.isOverEta && <AlertTriangle size={12} className="shrink-0 text-red-500 animate-pulse" />}
          {node.taskId && currentUser && navigate ? (
            <button
              onClick={() => {
                const path = currentUser.role === 'Admin' ? '/admin/tasks' : ((currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead') ? '/lead/tasks' : '/tasks');
                navigate(path, { state: { highlightTaskId: node.taskId } });
              }}
              style={{
                background: 'none', border: 'none', padding: 0, margin: 0, font: 'inherit', textAlign: 'left',
                color: 'inherit', cursor: 'pointer', textDecoration: 'underline'
              }}
            >
              {node.task}
            </button>
          ) : node.task}
        </div>
        {node.desc && (
          <div className="text-[11px] truncate mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {node.desc}
          </div>
        )}
      </div>
      <span className="text-[12px] text-center" style={{ color: "var(--muted-foreground)" }}>{node.start}</span>
      <span className="text-[12px] text-center" style={{ color: "var(--muted-foreground)" }}>{node.end}</span>
      <span className="text-[12px] font-semibold text-center">{formatHHMM(node.hours)}</span>
      <span className="text-[12px] font-semibold text-center">
        {isFirstOfDate && dailyTotal > 0 ? formatHHMM(dailyTotal) : ""}
      </span>
      <span className="text-[12px] font-bold text-right pr-4" style={{ color: "var(--primary)" }}>
        {isFirstOfPerson && weeklyTotal > 0 ? formatHHMM(weeklyTotal) : ""}
      </span>
    </div>
  );
}

// ─── Tree node ────────────────────────────────────────────────────────────────
function Treenode({ node, depth = 0, coloridx = 0, openmap, setopenmap, extraProps = {}, projectLabel = "", projectColor = "" }) {
  const isopen = openmap[node.id] ?? false;
  const haschildren = node.children?.length > 0;
  const toggle = () => setopenmap(prev => ({ ...prev, [node.id]: !isopen }));

  const rowprops = { node, isopen, Ontoggle: toggle, coloridx, depth, ...extraProps, projectLabel, projectColor };
  const Row = { week: weekrow, project: projectrow, person: personrow, entry: entryrow }[node.type];

  return (
    <div>
      <Row {...rowprops} />
      {isopen && haschildren && node.children.map((child, i) => {
        const currentProjLabel = node.type === "project" ? node.label.replace("Project: ", "") : projectLabel;
        const currentProjColor = node.type === "project" ? (node.color || "") : projectColor;
        let childExtra = {};
        if (child.type === "entry") {
          const siblings = node.children;
          const firstIdx = siblings.findIndex(s => s.date === child.date);
          const isFirstOfDate = (firstIdx === i);
          const dailyTotalVal = siblings
            .filter(s => s.date === child.date)
            .reduce((sum, s) => sum + (s.hours || 0), 0);
          const isFirstOfPerson = (i === 0);
          const weeklyTotalVal = siblings.reduce((sum, s) => sum + (s.hours || 0), 0);
          
          childExtra = {
            ...extraProps,
            isFirstOfDate,
            isFirstOfPerson,
            dailyTotal: dailyTotalVal,
            weeklyTotal: weeklyTotalVal,
          };
        } else {
          childExtra = extraProps;
        }

        return (
          <Treenode
            key={child.id}
            node={child}
            depth={depth + 1}
            coloridx={node.type === "week" ? i : coloridx}
            openmap={openmap}
            setopenmap={setopenmap}
            extraProps={childExtra}
            projectLabel={currentProjLabel}
            projectColor={currentProjColor}
          />
        );
      })}
    </div>
  );
}

// ─── Collect all node IDs ─────────────────────────────────────────────────────
function collectids(node) {
  const ids = [node.id];
  if (node.children) {
    for (const c of node.children) ids.push(...collectids(c));
  }
  return ids;
}

// ─── Column header ────────────────────────────────────────────────────────────
function Colheader() {
  return (
    <div className="grid px-4 py-2 border-b-2 font-sans"
      style={{
        gridTemplateColumns: "120px 80px 100px 1fr 80px 80px 100px 100px 140px",
        background: "var(--secondary)",
        borderColor: "var(--border)"
      }}
    >
      {["DATE", "TYPE", "JOB", "SUB JOB", "START", "END", "TOTAL HOURS", "DAILY TOTAL", "WEEKLY TOTAL"].map((col, i) => (
        <span
          key={col}
          className={`text-[10px] font-bold uppercase tracking-wider ${i >= 4 && i <= 7 ? "text-center" : ""} ${i === 8 ? "text-right pr-4" : "text-left"}`}
          style={{ color: "var(--muted-foreground)" }}
        >
          {col}
        </span>
      ))}
    </div>
  );
}

// ─── Weeks dropdown ───────────────────────────────────────────────────────────
function WeeksDropdown({ weeks, selectedIds, onToggle, customDate, onCustomDate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 hover:bg-slate-100 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer border"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
      >
        <Calendar size={13} color="#6366F1" />
        Weeks Displayed ({selectedIds.length})
        <ChevronDown
          size={13}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "var(--muted-foreground)" }}
          className="transition-transform duration-150"
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 rounded-xl pt-3 min-w-[240px] shadow-xl border"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <div className="text-[10px] font-bold tracking-widest px-3.5 pb-2" style={{ color: "var(--muted-foreground)" }}>
            SELECT WEEKS TO AUDIT
          </div>
          <div className="max-h-[200px] overflow-y-auto border-b" style={{ borderColor: "var(--border)" }}>
            {weeks.map(w => (
              <label
                key={w.id}
                className={`flex items-center gap-2.5 px-3.5 py-[9px] cursor-pointer text-[13px] ${selectedIds.includes(w.id) ? "font-semibold" : "opacity-60"}`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(w.id)}
                  onChange={() => onToggle(w.id)}
                  className="w-3.5 h-3.5"
                  style={{ accentColor: '#0010ae' }}
                />
                <span>{w.label}</span>
              </label>
            ))}
          </div>
          <div className="px-3.5 py-2.5">
            <div className="text-[10px] font-bold tracking-wider mb-1.5" style={{ color: "var(--muted-foreground)" }}>PICK CUSTOM DATE:</div>
            <input
              type="date"
              value={customDate}
              onChange={e => onCustomDate(e.target.value)}
              className="w-full px-2 py-1.5 rounded-md text-[13px] box-border border"
              style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function Toolbar({ weeks, selectedIds, onToggleWeek, customDate, onCustomDate, currentIdx, onPrev, onNext, onExpandAll, onCollapseAll, onAddClick }) {
  const iconBtn = "p-1.5 border rounded-lg cursor-pointer flex items-center justify-center transition-colors hover:bg-slate-100";

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b"
      style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
      <button onClick={onPrev} disabled={currentIdx <= 0} className={`${iconBtn} ${currentIdx <= 0 ? "opacity-40" : ""}`}
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
        <ChevronLeft size={14} />
      </button>
      <button onClick={onNext} disabled={currentIdx >= weeks.length - 1} className={`${iconBtn} ${currentIdx >= weeks.length - 1 ? "opacity-40" : ""}`}
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
        <ChevronRight size={14} />
      </button>

      <WeeksDropdown
        weeks={weeks}
        selectedIds={selectedIds}
        onToggle={onToggleWeek}
        customDate={customDate}
        onCustomDate={onCustomDate}
      />

      <div className="flex-1" />

      <button onClick={onAddClick} className="px-3.5 flex items-center gap-1.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all hover:opacity-90"
        style={{ background: "var(--primary)", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", height: "32px" }}>
        <Plus size={13} /> Add Time Log
      </button>
      <button onClick={onExpandAll} className="px-3.5 hover:bg-slate-100 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer border"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>Expand All</button>
      <button onClick={onCollapseAll} className="px-3.5 hover:bg-slate-100 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer border"
        style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>Collapse All</button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function TreeTimesheets() {
  const { users, projects, tasks, timeEntries, teams, currentUser } = useApp();
  const navigate = useNavigate();

  const [showManualModal, setShowManualModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const isEmployee = currentUser?.role === 'Employee';

  const weeks = useMemo(() => {
    return buildTreeFromContext(
      { users, projects, tasks, timeEntries, teams, currentUser },
      { searchQuery, teamFilter, roleFilter, projectFilter, categoryFilter, statusFilter }
    );
  }, [users, projects, tasks, timeEntries, teams, currentUser, searchQuery, teamFilter, roleFilter, projectFilter, categoryFilter, statusFilter]);

  const [selectedids, setselectedids] = useState([
    'dynamic-week-0',
    'dynamic-week-1',
    'dynamic-week-2',
    'dynamic-week-3'
  ]);
  const [currentidx, setcurrentidx] = useState(3);
  const [openmap, setopenmap] = useState({});
  const [customdate, setcustomdate] = useState("");

  const toggleweek = (id) =>
    setselectedids(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const visibleweeks = weeks.filter(w => selectedids.includes(w.id));
  const allvisibleids = visibleweeks.flatMap(w => collectids(w));

  const expandall = () => {
    const map = {};
    allvisibleids.forEach(id => { map[id] = true; });
    setopenmap(map);
  };

  const collapseall = () => {
    const map = {};
    allvisibleids.forEach(id => { map[id] = false; });
    setopenmap(map);
  };

  const focusedweekref = useRef(null);
  const onprev = () => setcurrentidx(i => Math.max(0, i - 1));
  const onnext = () => setcurrentidx(i => Math.min(weeks.length - 1, i + 1));

  useEffect(() => {
    const targetid = weeks[currentidx]?.id;
    if (!targetid) return;
    if (!selectedids.includes(targetid)) setselectedids(prev => [...prev, targetid]);
    setTimeout(() => {
      if (focusedweekref.current) focusedweekref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, [currentidx, weeks]);

  useEffect(() => {
    if (!customdate) return;
    const targetDate = new Date(customdate);
    if (isNaN(targetDate)) return;

    const foundIdx = weeks.findIndex(w => {
      const start = new Date(w.dateRange.start);
      const end = new Date(w.dateRange.end);
      return targetDate >= start && targetDate <= end;
    });

    if (foundIdx !== -1) {
      setcurrentidx(foundIdx);
    }
  }, [customdate, weeks]);

  return (
    <div className="timesheet-console font-sans border rounded-xl text-[13px] overflow-visible"
      style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
      <Toolbar
        weeks={weeks}
        selectedIds={selectedids}
        onToggleWeek={toggleweek}
        customDate={customdate}
        onCustomDate={setcustomdate}
        currentIdx={currentidx}
        onPrev={onprev}
        onNext={onnext}
        onExpandAll={expandall}
        onCollapseAll={collapseall}
        onAddClick={() => setShowManualModal(true)}
      />

      {/* ── Filter Bar ── */}
      <div className="px-5 py-4 border-b flex flex-wrap items-center gap-3"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 w-56 border transition-all"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <Search size={14} className="shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="text"
            placeholder={isEmployee ? "Search task..." : "Search staff or task..."}
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
        {!isEmployee && (
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
        {!isEmployee && (
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
        <div className="flex items-center gap-1.5">
          <Briefcase size={13} style={{ color: "var(--muted-foreground)" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Project:</span>
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.projectName || p.name}</option>)}
          </select>
        </div>

        {/* Category filter */}
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

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <Filter size={13} style={{ color: "var(--muted-foreground)" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Status:</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <Colheader />

      <div className="overflow-hidden rounded-b-xl">
        {visibleweeks.length === 0 && (
          <div className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--muted-foreground)" }}>
            No weeks selected. Use the dropdown to pick weeks.
          </div>
        )}
        {visibleweeks.map((week, i) => (
          <div
            key={week.id}
            ref={week.id === weeks[currentidx]?.id ? focusedweekref : null}
          >
            <Treenode
              node={week}
              depth={0}
              coloridx={i}
              openmap={openmap}
              setopenmap={setopenmap}
              extraProps={{ currentUser, navigate }}
            />
          </div>
        ))}
      </div>

      <ManualTimeEntryModal
        show={showManualModal}
        onClose={() => setShowManualModal(false)}
        defaultDate={new Date().toISOString().split('T')[0]}
      />
    </div>
  );
}