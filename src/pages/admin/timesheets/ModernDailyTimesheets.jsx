import React, { useState } from "react";
import moment from "moment";
import Timeline, { TimelineHeaders, SidebarHeader, DateHeader } from "react-calendar-timeline";
import "react-calendar-timeline/style.css";
import "../../../timeline.css";
import TimelineData from "../../../components/mock dataset/Data_admin_moderntimesheet";
import ModernWeeklyTimesheets from "./ModernWeeklyTimesheets";
import {Coffee} from 'lucide-react'
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

const VIEW_MODES = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
};

const PER_PAGE_OPTIONS = [5, 10, 15, 20];

export default function Timesheets() {
  const { groups, items } = TimelineData(150);

  // ── View mode ──────────────────────────────────────
  const [viewMode, setViewMode] = useState(VIEW_MODES.DAY);

  // ── Current date (for navigation) ─────────────────
  const [currentDate, setCurrentDate] = useState(moment().startOf("day"));

  // ── Pagination ────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  // ── Derived time window based on view mode ─────────
  const getTimeWindow = (date, mode) => {
    if (mode === VIEW_MODES.DAY) {
      return {
        start: date.clone().hour(8).toDate(),
        end: date.clone().hour(19).toDate(),
      };
    }
    if (mode === VIEW_MODES.WEEK) {
      return {
        start: date.clone().startOf("week").toDate(),
        end: date.clone().endOf("week").toDate(),
      };
    }
    if (mode === VIEW_MODES.MONTH) {
      return {
        start: date.clone().startOf("month").toDate(),
        end: date.clone().endOf("month").toDate(),
      };
    }
  };

  const timeWindow = getTimeWindow(currentDate, viewMode);

  // ── Navigation ────────────────────────────────────
  const navigate = (direction) => {
    // direction: +1 or -1
    setCurrentDate((prev) => {
      const unit = viewMode === VIEW_MODES.DAY
        ? "day"
        : viewMode === VIEW_MODES.WEEK
        ? "week"
        : "month";
      return prev.clone().add(direction, unit);
    });
    setCurrentPage(1);
  };

  // ── Date label ────────────────────────────────────
  const getDateLabel = () => {
    if (viewMode === VIEW_MODES.DAY) return currentDate.format("MMM D, YYYY");
    if (viewMode === VIEW_MODES.WEEK) {
      const start = currentDate.clone().startOf("week").format("MMM D");
      const end = currentDate.clone().endOf("week").format("MMM D, YYYY");
      return `${start} – ${end}`;
    }
    return currentDate.format("MMMM YYYY");
  };

  const getSubLabel = () => {
    if (viewMode === VIEW_MODES.DAY) return "Daily hour-by-hour visual timeline";
    if (viewMode === VIEW_MODES.WEEK) return "Weekly overview";
    return "Monthly overview";
  };

  // ── Pagination logic ──────────────────────────────
  const totalGroups = groups.length;
  const totalPages = Math.ceil(totalGroups / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedGroups = groups.slice(startIndex, startIndex + perPage);

  // Filter items to only show for visible groups
  const visibleGroupIds = new Set(paginatedGroups.map((g) => g.id));
  const paginatedItems = items.filter((item) => visibleGroupIds.has(item.group));

  const ITEM_STYLES={
    completed:{
      background:"#dcfce7",
      border:"1px solid #86efac",
      color: "#15803d",
    },
    pending:{
      background:"#dbeafe",
      border:"1px solid #93c5fd",
      color : "#1d4ed8",
    },
    break :{
      background:"#fef9c3",
      border:"1px solid #fde047",
      color: "#854d0e",
    },
  };

  // ── Item renderer ─────────────────────────────────
  const itemRenderer = ({ item, getItemProps }) => {
    const { key, ...restProps } = getItemProps({
      style: {
        ...ITEM_STYLES[item.type] ?? ITEM_STYLES.pending,
        borderRadius: "8px",
        fontWeight: 600,
        boxShadow: "none",
      },
    });
    return (
      <div key={key} {...restProps}>
        <div className="h-full flex items-center justify-center text-sm">
          {item.type==="break"?(
            <Coffee size={14} strokeWidth={2.4}/>
          ):(
            item.title
          )}
        </div>
      </div>
    );
  };

  // ── Page number buttons ───────────────────────────
  const getPageNumbers = () => {
    // Show at most 3 page buttons around current
    const pages = [];
    const maxVisible = 3;
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 p-6 flex flex-col gap-4">
      {/* ── Date nav + view toggle card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          
          {/* Prev / Next */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
            >
              ‹
            </button>
            <button
              onClick={() => navigate(1)}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
            >
              ›
            </button>
          </div>
          
          <div>
            <div className="text-base font-bold text-slate-800">{getDateLabel()}</div>
            <div className="text-xs text-slate-400">{getSubLabel()}</div>
          </div>
        </div>
        

        {/* View mode toggles */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { label: "Day Timeline", value: VIEW_MODES.DAY },
            { label: "Week Grid", value: VIEW_MODES.WEEK },
            { label: "Month Map", value: VIEW_MODES.MONTH },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => { setViewMode(value); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                viewMode === value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
      </div>

      {/* ── Timeline card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {viewMode === VIEW_MODES.WEEK ? (
  <ModernWeeklyTimesheets
    groups={paginatedGroups}
    items={items}
    currentDate={currentDate}
  />

) : viewMode=== VIEW_MODES.MONTH ?(
  <ModernMonthlyTimesheets 
  groups={paginatedGroups}
  items={items}
  currentDate={currentDate}
  />
):(
  <Timeline
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
          <div className="text-xs font-semibold text-slate-800 leading-tight">
            {group.title}
          </div>
          <div className="text-[11px] text-slate-400 leading-tight">
            {group.subtitle}
          </div>
        </div>
      </div>
    )}
  >
    <TimelineHeaders>
      <SidebarHeader>
        {({ getRootProps }) => (
          <div
            {...getRootProps()}
            className="flex items-center px-4 h-full text-xs font-semibold text-slate-500 uppercase tracking-wide"
          >
            Staff Member
          </div>
        )}
      </SidebarHeader>
      <DateHeader unit="hour" labelFormat="h A" />
    </TimelineHeaders>
  </Timeline>   
)}
      </div>

      {/* ── Pagination bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 flex items-center justify-between shadow-sm">
        <span className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {startIndex + 1} – {Math.min(startIndex + perPage, totalGroups)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700">{totalGroups}</span> staff members
        </span>

        <div className="flex items-center gap-3">
          {/* Per page */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            Per page:
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 bg-white focus:outline-none"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-slate-200 text-sm text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Prev
            </button>
            {getPageNumbers().map((n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                  n === currentPage
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-slate-200 text-sm text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}