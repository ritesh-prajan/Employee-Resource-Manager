import React, { useState, useContext } from "react";
import moment from "moment";
import Timeline, { TimelineHeaders, SidebarHeader, DateHeader } from "react-calendar-timeline";
import "react-calendar-timeline/style.css";
import "../../../timeline.css";
import { useApp } from "../../../context/AppContext";
import ModernWeeklyTimesheets from "./ModernWeeklyTimesheets";
import { Coffee, X, Clock, Tag, FileText, CheckCircle, Search, Layers, Filter, Briefcase, Activity, Calendar, AlertTriangle } from "lucide-react";
import ModernMonthlyTimesheets from "./ModernMonthlyTimesheets";

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
  const { users, timeEntries, tasks, teams, projects } = useApp();

  const [popup, setPopup] = useState(null);
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

  const filteredUsers = users.filter((u) => {
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
    
    // Check for overlap on current day
    const userEntries = timeEntries.filter(e => e.userId === u.id && e.date === currentDate.format("YYYY-MM-DD"));
    const timeBlocks = userEntries.map(e => ({
      start: moment(`${e.date}T${e.startTime}:00`).valueOf(),
      end: moment(`${e.date}T${e.endTime}:00`).valueOf()
    })).sort((a, b) => a.start - b.start);
    
    let hasOverlap = false;
    for (let i = 1; i < timeBlocks.length; i++) {
      if (timeBlocks[i].start < timeBlocks[i-1].end) {
        hasOverlap = true;
        break;
      }
    }

    return {
      id: u.id,
      title: u.name,
      initials,
      subtitle: u.role || "Employee",
      hasOverlap,
    };
  });

  const filteredEntries = timeEntries.filter(e => {
    if (statusFilter !== "All Statuses") {
      if (e.status !== statusFilter) return false;
    }
    if (categoryFilter !== "All Categories" && e.workCategory !== categoryFilter) return false;
    if (projectFilter !== "All Projects" && e.projectId !== projectFilter) return false;
    return true;
  });

  const items = filteredEntries.map((e) => {
    const startStr = `${e.date}T${e.startTime}:00`;
    const endStr = `${e.date}T${e.endTime}:00`;
    let type = "pending";
    if (e.status === "Approved") type = "completed";
    
    const taskObj = tasks.find((t) => t.id === e.taskId);

    return {
      id: e.id,
      group: e.userId,
      title: `${e.duration}h`,
      start: moment(startStr).valueOf(),
      end: moment(endStr).valueOf(),
      type,
      taskTitle: taskObj?.name || "Manual Entry",
      category: e.workCategory || "General",
      description: e.description,
    };
  });

  const getTimeWindow = (date, mode) => {
    if (mode === VIEW_MODES.DAY)
      return { start: date.clone().hour(8).toDate(), end: date.clone().hour(19).toDate() };
    if (mode === VIEW_MODES.WEEK)
      return { start: date.clone().startOf("week").toDate(), end: date.clone().endOf("week").toDate() };
    if (mode === VIEW_MODES.MONTH)
      return { start: date.clone().startOf("month").toDate(), end: date.clone().endOf("month").toDate() };
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
    const { key, ...restProps } = getItemProps({
      style: {
        ...(ITEM_STYLES[item.type] ?? ITEM_STYLES.pending),
        borderRadius: "8px",
        fontWeight: 600,
        boxShadow: "none",
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
        <div className="h-full flex items-center justify-center text-sm">
          {item.type === "break" ? <Coffee size={14} strokeWidth={2.4} /> : item.title}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 p-6 flex flex-col gap-4 zoom:'0.8">

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Timesheets Console</h1>
          <p className="text-sm text-slate-500 mt-1">Review employee timesheets, audit hours, and track team compliance</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            <Layers size={16} /> Tree View
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            <Filter size={16} /> Classic
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-indigo-700 text-white shadow-sm">
            <Activity size={16} /> Modern
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
            <Search size={16} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search staff name..." 
              className="bg-transparent border-none outline-none text-sm text-slate-700 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Layers size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team:</span>
            <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium outline-none hover:border-slate-300 transition appearance-none min-w-[140px]">
              <option value="All Teams">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role:</span>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium outline-none hover:border-slate-300 transition appearance-none min-w-[120px]">
              <option value="All Staff">All Staff</option>
              <option value="Employee">Employee</option>
              <option value="Team Lead">Team Lead</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Briefcase size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project:</span>
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium outline-none hover:border-slate-300 transition appearance-none min-w-[150px]">
              <option value="All Projects">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Tag size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category:</span>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium outline-none hover:border-slate-300 transition appearance-none min-w-[150px]">
              <option value="All Categories">All Categories</option>
              <option value="Story">Story</option>
              <option value="Bug">Bug</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="flex items-center gap-2 mt-2 2xl:mt-0">
            <Clock size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium outline-none hover:border-slate-300 transition appearance-none min-w-[140px]">
              <option value="All Statuses">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending Review</option>
            </select>
          </div>

          <div className="flex items-center gap-2 mt-2 2xl:mt-0 ml-auto">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date:</span>
            <input 
              type="date" 
              value={currentDate.format("YYYY-MM-DD")}
              onChange={e => {
                if(e.target.value) setCurrentDate(moment(e.target.value).startOf("day"));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium outline-none hover:border-slate-300 transition appearance-none cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* Date nav + view toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition">‹</button>
            <button onClick={() => navigate(1)}  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition">›</button>
          </div>
          <div>
            <div className="text-base font-bold text-slate-800">{getDateLabel()}</div>
            <div className="text-xs text-slate-400">{getSubLabel()}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { label: "Day Timeline", value: VIEW_MODES.DAY },
            { label: "Week Grid",    value: VIEW_MODES.WEEK },
            { label: "Month Map",    value: VIEW_MODES.MONTH },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => { setViewMode(value); setCurrentPage(1); setPopup(null); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                viewMode === value ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
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
              lineHeight={56}
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
              canMove={false}
              canResize={false}
              groupRenderer={({ group }) => (
                <div className="flex items-center h-full px-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                    {group.initials}
                  </div>
                  <div className="ml-2 flex flex-col justify-center">
                    <div className="text-xs font-semibold text-slate-800 leading-tight flex items-center gap-1">
                      {group.title}
                      {group.hasOverlap && (
                        <div title="Warning: Overlapping time entries" className="text-amber-500 flex items-center cursor-help">
                          <AlertTriangle size={12} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight">{group.subtitle}</div>
                  </div>
                </div>
              )}
            >
              <TimelineHeaders>
                <SidebarHeader>
                  {({ getRootProps }) => (
                    <div {...getRootProps()} className="flex items-center px-4 h-full text-xs font-semibold text-slate-500 uppercase tracking-wide">
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

      {/* Pagination */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 flex items-center justify-between shadow-sm">
        <span className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{startIndex + 1} – {Math.min(startIndex + perPage, totalGroups)}</span> of <span className="font-semibold text-slate-700">{totalGroups}</span> staff members
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            Per page:
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 bg-white focus:outline-none">
              {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-lg border border-slate-200 text-sm text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition">Prev</button>
            {getPageNumbers().map((n) => (
              <button key={n} onClick={() => setCurrentPage(n)} className={`w-8 h-8 rounded-lg text-sm font-medium transition ${n === currentPage ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{n}</button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded-lg border border-slate-200 text-sm text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition">Next</button>
          </div>
        </div>
      </div>

      {/* Popup — fixed, outside all overflow containers */}
      {popup && (() => {
        const group = groups.find((g) => g.id === popup.item.group);
        const meta  = STATUS_META[popup.item.type] ?? STATUS_META.pending;
        return (
          <div className="fixed z-[999] bg-slate-50 rounded-2xl shadow-xl border border-slate-100 w-72 p-4" style={{ left: popup.x, top: popup.y }}>
            <button onClick={() => setPopup(null)} className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 transition"><X size={15} /></button>
            <div className="flex items-center gap-2.5 mb-3 pr-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0">{group?.initials}</div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">{group?.title}</div>
                <div className="text-sm font-bold text-slate-800 leading-tight">{popup.item.taskTitle ?? popup.item.title}</div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5"><Clock size={10} /> Time</div>
                <div className="text-sm text-slate-700">{formatTimeRange(popup.item)}</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5"><Tag size={10} /> Category</div>
                <div className="text-sm text-slate-700">{popup.item.category ?? "General"}</div>
              </div>
              {popup.item.description && (
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5"><FileText size={10} /> Description</div>
                  <div className="text-sm text-slate-600 leading-relaxed">{popup.item.description}</div>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5"><CheckCircle size={10} /> Status</div>
                <div className="text-sm text-slate-700">{meta.label}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry State</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.label}</span>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
