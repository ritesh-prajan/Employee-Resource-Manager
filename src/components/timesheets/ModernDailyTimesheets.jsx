import React, { useState, useContext } from "react";
import moment from "moment";
import Timeline, { TimelineHeaders, SidebarHeader, DateHeader } from "react-calendar-timeline";
import "react-calendar-timeline/style.css";
import "../../timeline.css";
import { useApp } from "../../context/AppContext";
import ModernWeeklyTimesheets from "./ModernWeeklyTimesheets";
import { Coffee, X, Clock, Tag, FileText, CheckCircle, Search, Layers, Filter, Briefcase, Activity, Calendar, AlertTriangle, Plus } from "lucide-react";
import ModernMonthlyTimesheets from "./ModernMonthlyTimesheets";
import ManualTimeEntryModal from "../forms/timesheets/ManualTimeEntryModal";

const keys = {
  groupIdKey: "id",
  groupTitleKey: "title",
  groupRightTitleKey: "rightTitle",
  itemIdKey: "id",
  itemTitleKey: "title",
  itemDivTitleKey: "title",
  itemGroupKey: "group",
  itemTimeStartKey: "start",
  itemTimeEndKey: "end",
  groupLabelKey: "title",
};

const VIEW_MODES = { DAY: "day", WEEK: "week", MONTH: "month" };
const PER_PAGE_OPTIONS = [5, 10, 15, 20];

const ITEM_STYLES = {
  completed: { background: "#dcfce7", border: "1px solid #86efac", color: "#15803d" },
  pending:   { background: "#dbeafe", border: "1px solid #93c5fd", color: "#1d4ed8" },
  break:     { background: "#fef9c3", border: "1px solid #fde047", color: "#854d0e" },
};

const STATUS_META = {
  completed: { label: "Approved",    bg: "#dcfce7", color: "#15803d", border: "#86efac" },
  pending:   { label: "In Progress", bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
  break:     { label: "Break",       bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
};

export default function Timesheets() {
  const { users, timeEntries, tasks, teams, projects, currentUser, editTimeEntry } = useApp();

  const [popup, setPopup] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODES.DAY);
  const [currentDate, setCurrentDate] = useState(moment().startOf("day"));
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [roleFilter, setRoleFilter] = useState("All Staff");
  const [projectFilter, setProjectFilter] = useState("All Projects");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const isEmployee = currentUser?.role === 'Employee';

  const filteredUsers = users.filter((u) => {
    if (isEmployee && u.id !== currentUser.id) return false;
    if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (teamFilter !== "All Teams") {
      const team = teams.find(t => t.id === teamFilter);
      if (team && !team.members.includes(u.id) && team.leadId !== u.id) return false;
    }
    if (roleFilter !== "All Staff" && u.role !== roleFilter) return false;
    return true;
  });

  const groups = filteredUsers.map((u) => {
    const nameParts = u.name.split(" ");
    const initials = nameParts.map((n) => n[0]).join("").substring(0, 2).toUpperCase();

    const userEntries = timeEntries.filter(e => e.userId === u.id && e.date === currentDate.format("YYYY-MM-DD"));
    const timeBlocks = userEntries.map(e => ({
      start: moment(`${e.date}T${e.startTime}:00`).valueOf(),
      end: moment(`${e.date}T${e.endTime}:00`).valueOf()
    })).sort((a, b) => a.start - b.start);

    let hasOverlap = false;
    for (let i = 1; i < timeBlocks.length; i++) {
      if (timeBlocks[i].start < timeBlocks[i-1].end) { hasOverlap = true; break; }
    }

    return { id: u.id, title: u.name, initials, subtitle: u.role || "Employee", hasOverlap };
  });

  const filteredEntries = timeEntries.filter(e => {
    if (isEmployee && e.userId !== currentUser.id) return false;
    if (statusFilter !== "All Statuses" && e.status !== statusFilter) return false;
    if (categoryFilter !== "All Categories" && e.workCategory !== categoryFilter) return false;
    if (projectFilter !== "All Projects" && e.projectId !== projectFilter) return false;
    return true;
  });

  const items = filteredEntries.map((e) => {
    const startStr = `${e.date}T${e.startTime}:00`;
    const endStr   = `${e.date}T${e.endTime}:00`;
    let type = "pending";
    if (e.status === "Approved") type = "completed";
    if (e.workCategory === "Break") type = "break";
    const taskObj = tasks.find((t) => t.id === e.taskId);

    // Check if task exceeds ETA
    const isOverEta = taskObj && parseFloat(taskObj.logged || 0) > parseFloat(taskObj.eta || 0);
    const isOwnItem = e.userId === currentUser?.id;

    return {
      id: e.id,
      group: e.userId,
      title: `${e.duration}h`,
      start: moment(startStr).valueOf(),
      end: moment(endStr).valueOf(),
      type,
      taskTitle: taskObj ? `${taskObj.taskNumber ? taskObj.taskNumber + ': ' : ''}${taskObj.name}` : (e.description || "Manual Entry"),
      category: e.workCategory || "General",
      description: e.description,
      isOverEta,
      canMove: isOwnItem,
      canResize: isOwnItem ? "both" : false
    };
  });

  const getTimeWindow = (date, mode) => {
    if (mode === VIEW_MODES.DAY)   return { start: date.clone().hour(8).toDate(), end: date.clone().hour(19).toDate() };
    if (mode === VIEW_MODES.WEEK)  return { start: date.clone().startOf("week").toDate(), end: date.clone().endOf("week").toDate() };
    if (mode === VIEW_MODES.MONTH) return { start: date.clone().startOf("month").toDate(), end: date.clone().endOf("month").toDate() };
  };

  const timeWindow = getTimeWindow(currentDate, viewMode);

  const formatTimeRange = (item) => {
    const start = moment(item.start).format("HH:mm");
    const end   = moment(item.end).format("HH:mm");
    const hours = ((item.end - item.start) / 3600000).toFixed(1);
    return `${start} – ${end} (${hours} hrs)`;
  };

  const calcPopupPosition = (rect) => {
    const POPUP_HEIGHT = 320, POPUP_WIDTH = 288, MARGIN = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const y = spaceBelow < POPUP_HEIGHT ? rect.top - POPUP_HEIGHT - MARGIN : rect.bottom + MARGIN;
    let x = rect.left;
    if (x + POPUP_WIDTH > window.innerWidth - MARGIN) x = window.innerWidth - POPUP_WIDTH - MARGIN;
    if (x < MARGIN) x = MARGIN;
    return { x, y, flipped: spaceBelow < POPUP_HEIGHT };
  };

  const navigate = (direction) => {
    setCurrentDate((prev) => {
      const unit = viewMode === VIEW_MODES.DAY ? "day" : viewMode === VIEW_MODES.WEEK ? "week" : "month";
      return prev.clone().add(direction, unit);
    });
    setCurrentPage(1);
  };

  const onItemMove = (itemId, dragTime, newGroupOrder) => {
    const entry = timeEntries.find(e => e.id === itemId);
    if (!entry || entry.userId !== currentUser?.id) return;

    const durationHrs = parseFloat(entry.duration) || 0.5;
    const newStart = moment(dragTime);
    const newEnd = newStart.clone().add(durationHrs, 'hours');

    editTimeEntry(itemId, {
      date: newStart.format("YYYY-MM-DD"),
      startTime: newStart.format("HH:mm"),
      endTime: newEnd.format("HH:mm"),
      duration: durationHrs.toString()
    });
  };

  const onItemResize = (itemId, newResizeTime, edge) => {
    const entry = timeEntries.find(e => e.id === itemId);
    if (!entry || entry.userId !== currentUser?.id) return;

    const startVal = moment(`${entry.date}T${entry.startTime}:00`).valueOf();
    const endVal = moment(`${entry.date}T${entry.endTime}:00`).valueOf();

    const newStart = edge === "left" ? moment(newResizeTime) : moment(startVal);
    const newEnd = edge === "right" ? moment(newResizeTime) : moment(endVal);
    
    const durationMs = newEnd.valueOf() - newStart.valueOf();
    if (durationMs < 900000) return; // Min 15 minutes

    const durationHrs = parseFloat((durationMs / 3600000).toFixed(2));

    editTimeEntry(itemId, {
      date: newStart.format("YYYY-MM-DD"),
      startTime: newStart.format("HH:mm"),
      endTime: newEnd.format("HH:mm"),
      duration: durationHrs.toString()
    });
  };

  const getDateLabel = () => {
    if (viewMode === VIEW_MODES.DAY) return currentDate.format("MMM D, YYYY");
    if (viewMode === VIEW_MODES.WEEK) {
      const start = currentDate.clone().startOf("isoWeek").format("MMM D");
      const end   = currentDate.clone().endOf("isoWeek").format("MMM D, YYYY");
      return `${start} – ${end}`;
    }
    return currentDate.format("MMMM YYYY");
  };

  const getSubLabel = () => {
    if (viewMode === VIEW_MODES.DAY)  return "Daily hour-by-hour visual timeline";
    if (viewMode === VIEW_MODES.WEEK) return "Weekly overview";
    return "Monthly overview";
  };

  const totalGroups     = groups.length;
  const totalPages      = Math.ceil(totalGroups / perPage);
  const startIndex      = (currentPage - 1) * perPage;
  const paginatedGroups = groups.slice(startIndex, startIndex + perPage);
  const visibleGroupIds = new Set(paginatedGroups.map((g) => g.id));
  const paginatedItems  = items.filter((item) => visibleGroupIds.has(item.group));

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;
    let start = Math.max(1, currentPage - 1);
    let end   = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const itemRenderer = ({ item, getItemProps }) => {
    const baseStyle = ITEM_STYLES[item.type] ?? ITEM_STYLES.pending;
    const { key, ...restProps } = getItemProps({
      style: {
        ...baseStyle,
        borderRadius: "8px",
        fontWeight: 600,
        boxShadow: "none",
        ...(item.isOverEta ? {
          background: "#fee2e2",
          border: "2px solid #ef4444",
          color: "#b91c1c"
        } : {})
      },
    });
    return (
      <div
        key={key}
        {...restProps}
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const { x, y, flipped } = calcPopupPosition(rect);
          setPopup((prev) => {
            if (prev?.item?.id === item.id) return null;
            return { item, x, y, flipped };
          });
        }}
      >
        <div className="h-full flex items-center justify-center gap-1 text-sm">
          {item.isOverEta && <AlertTriangle size={12} className="shrink-0 text-red-600 animate-pulse" />}
          {item.type === "break" ? <Coffee size={14} strokeWidth={2.4} /> : item.title}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* ── Filter Bar ── */}
      <div className="rounded-2xl border p-4 shadow-sm flex flex-wrap items-center gap-3"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}>

        {/* Search */}
        {!isEmployee && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 w-56 border transition"
            style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
            <Search size={15} style={{ color: "var(--muted-foreground)" }} className="shrink-0" />
            <input
              type="text"
              placeholder="Search staff name..."
              className="bg-transparent border-none outline-none text-sm w-full"
              style={{ color: "var(--foreground)" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="cursor-pointer hover:opacity-70" style={{ color: "var(--muted-foreground)" }}>
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Team */}
        {!isEmployee && (
          <div className="flex items-center gap-1.5">
            <Layers size={14} style={{ color: "var(--muted-foreground)" }} />
            <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
              <option value="All Teams">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {/* Role */}
        {!isEmployee && (
          <div className="flex items-center gap-1.5">
            <Filter size={14} style={{ color: "var(--muted-foreground)" }} />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="All Staff">All Staff</option>
              <option value="Employee">Employee</option>
              <option value="Team Lead">Team Lead</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        )}

        {/* Project */}
        <div className="flex items-center gap-1.5">
          <Briefcase size={14} style={{ color: "var(--muted-foreground)" }} />
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
            <option value="All Projects">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Category */}
        <div className="flex items-center gap-1.5">
          <Tag size={14} style={{ color: "var(--muted-foreground)" }} />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="All Categories">All Categories</option>
            <option value="Story">Story</option>
            <option value="Bug">Bug</option>
            <option value="General">General</option>
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <Clock size={14} style={{ color: "var(--muted-foreground)" }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All Statuses">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending Review</option>
          </select>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-1.5">
          <Calendar size={14} style={{ color: "var(--muted-foreground)" }} />
          <input
            type="date"
            value={currentDate.format("YYYY-MM-DD")}
            onChange={e => {
              if (e.target.value) setCurrentDate(moment(e.target.value).startOf("day"));
              setCurrentPage(1);
            }}
            className="input-control text-sm cursor-pointer"
          />
        </div>

      </div>

      {/* ── Date nav + view toggle ── */}
      <div className="rounded-2xl border px-5 py-4 flex items-center justify-between shadow-sm"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>‹</button>
            <button onClick={() => navigate(1)}
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>›</button>
          </div>
          <div>
            <div className="text-base font-bold" style={{ color: "var(--foreground)" }}>{getDateLabel()}</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{getSubLabel()}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition text-white hover:opacity-90 cursor-pointer"
            style={{ background: "var(--primary)", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
          >
            <Plus size={14} /> Add Time Log
          </button>
          <div className="flex items-center gap-1 p-1" style={{ background: "var(--secondary)", borderRadius: "0.75rem" }}>
            {[
              { label: "Day Timeline", value: VIEW_MODES.DAY },
              { label: "Week Grid",    value: VIEW_MODES.WEEK },
              { label: "Month Map",    value: VIEW_MODES.MONTH },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => { setViewMode(value); setCurrentPage(1); setPopup(null); }}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition"
                style={viewMode === value
                ? { background: "var(--primary)", color: "var(--primary-foreground)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                : { color: "var(--muted-foreground)", background: "transparent" }}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main card ── */}
      <div className="rounded-2xl border shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        {viewMode === VIEW_MODES.WEEK ? (
          <ModernWeeklyTimesheets groups={paginatedGroups} items={items} currentDate={currentDate} />
        ) : viewMode === VIEW_MODES.MONTH ? (
          <ModernMonthlyTimesheets groups={paginatedGroups} items={items} currentDate={currentDate} />
        ) : (
          <div className="relative timeline-container">
            <Timeline
              onCanvasClick={() => setPopup(null)}
              groups={paginatedGroups}
              items={paginatedItems}
              keys={keys}
              lineHeight={72}
              sidebarWidth={220}
              visibleTimeStart={timeWindow.start}
              visibleTimeEnd={timeWindow.end}
              onTimeChange={() => {}}
              itemsSorted
              itemRenderer={itemRenderer}
              itemTouchSendsClick={false}
              stackItems
              itemHeightRatio={0.6}
              showCursorLine={false}
              canMove={true}
              canResize="both"
              onItemMove={onItemMove}
              onItemResize={onItemResize}
              groupRenderer={({ group }) => (
                <div className="flex items-center h-full px-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: "var(--accent)", color: "var(--primary)" }}>
                    {group.initials}
                  </div>
                  <div className="ml-2 flex flex-col justify-center">
                    <div className="text-xs font-semibold leading-tight flex items-center gap-1"
                      style={{ color: "var(--foreground)" }}>
                      {group.title}
                      {group.hasOverlap && (
                        <div title="Warning: Overlapping time entries" className="flex items-center cursor-help" style={{ color: "#f59e0b" }}>
                          <AlertTriangle size={12} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] leading-tight" style={{ color: "var(--muted-foreground)" }}>{group.subtitle}</div>
                  </div>
                </div>
              )}
            >
              <TimelineHeaders>
                <SidebarHeader>
                  {({ getRootProps }) => (
                    <div {...getRootProps()} className="flex items-center px-4 h-full text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--muted-foreground)" }}>
                      Staff Member
                    </div>
                  )}
                </SidebarHeader>
                <DateHeader unit="hour" labelFormat="h A" />
              </TimelineHeaders>
            </Timeline>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      <div className="rounded-2xl border px-5 py-3 flex items-center justify-between shadow-sm"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Showing{" "}
          <span className="font-semibold" style={{ color: "var(--foreground)" }}>{startIndex + 1} – {Math.min(startIndex + perPage, totalGroups)}</span>
          {" "}of{" "}
          <span className="font-semibold" style={{ color: "var(--foreground)" }}>{totalGroups}</span>
          {" "}staff members
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Per page:
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}>
              {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 transition"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>Prev</button>
            {getPageNumbers().map((n) => (
              <button key={n} onClick={() => setCurrentPage(n)}
                className="w-8 h-8 rounded-lg text-sm font-medium transition"
                style={n === currentPage
                  ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                  : { border: "1px solid var(--border)", color: "var(--foreground)" }}>
                {n}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 transition"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>Next</button>
          </div>
        </div>
      </div>

      {/* ── Popup ── */}
      {popup && (() => {
        const group = groups.find((g) => g.id === popup.item.group);
        const meta  = STATUS_META[popup.item.type] ?? STATUS_META.pending;
        return (
          <div className="fixed z-[999] rounded-2xl shadow-xl w-72 p-4"
            style={{ left: popup.x, top: popup.y, background: "var(--card)", border: "1px solid var(--border)" }}>
            <button onClick={() => setPopup(null)}
              className="absolute top-3 right-3 transition cursor-pointer hover:opacity-70"
              style={{ color: "var(--muted-foreground)" }}>
              <X size={15} />
            </button>
            <div className="flex items-center gap-2.5 mb-3 pr-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: "var(--accent)", color: "var(--primary)" }}>
                {group?.initials}
              </div>
              <div>
                <div className="text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>{group?.title}</div>
                <div className="text-sm font-bold leading-tight" style={{ color: "var(--foreground)" }}>{popup.item.taskTitle ?? popup.item.title}</div>
              </div>
            </div>
            <div className="pt-3 flex flex-col gap-2.5" style={{ borderTop: "1px solid var(--border)" }}>
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                  <Clock size={10} /> Time
                </div>
                <div className="text-sm" style={{ color: "var(--foreground)" }}>{formatTimeRange(popup.item)}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                  <Tag size={10} /> Category
                </div>
                <div className="text-sm" style={{ color: "var(--foreground)" }}>{popup.item.category ?? "General"}</div>
              </div>
              {popup.item.description && (
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                    <FileText size={10} /> Description
                  </div>
                  <div className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{popup.item.description}</div>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                  <CheckCircle size={10} /> Status
                </div>
                <div className="text-sm" style={{ color: "var(--foreground)" }}>{meta.label}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Entry State</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                {meta.label}
              </span>
            </div>
          </div>
        );
      })()}

      <ManualTimeEntryModal
        show={showManualModal}
        onClose={() => setShowManualModal(false)}
        defaultDate={currentDate.format("YYYY-MM-DD")}
      />

    </div>
  );
}