import React, { useState, useRef, useEffect } from "react";
import moment from "moment";
import { X, Clock, Tag, FileText } from "lucide-react";

const getDayColor = (hours) => {
  if (hours === 0) return null;
  if (hours < 4) return { background: "#febbbbbe", borderWidth: "1px", borderStyle: "solid", borderColor: "#bfdbfe" };
  if (hours < 8) return { background: "#006cf948", borderWidth: "1px", borderStyle: "solid", borderColor: "#93c5fd" };
  return { background: "#dcfce7", borderWidth: "1px", borderStyle: "solid", borderColor: "#86efac" };
};

const LEGEND = [
  { label: "1–4h (Partial)",        style: { background: "#febbbbbe", borderWidth: "1px", borderStyle: "solid", borderColor: "#bfdbfe" } },
  { label: "4–8h (Standard)",       style: { background: "#006cf948", borderWidth: "1px", borderStyle: "solid", borderColor: "#93c5fd" } },
  { label: "≥ 8h (Full / Overrun)", style: { background: "#dcfce7",   borderWidth: "1px", borderStyle: "solid", borderColor: "#86efac" } },
];

// ✅ Bug 3 fixed — defined here
const STATUS_META = {
  completed: { label: "Approved",    bg: "#dcfce7", color: "#15803d", border: "#86efac" },
  pending:   { label: "In Progress", bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
  break:     { label: "Break",       bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
};

export default function ModernMonthlyTimesheets({ groups, items, currentDate }) {
  // ✅ Bug 1 fixed — all hooks before any early return
  const [popup, setPopup] = useState(null);  // ✅ Bug 2 fixed — consistent casing
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentDate || !currentDate.clone) {
    return <div className="p-6 text-sm text-slate-400">No date selected.</div>;
  }

  const monthStart = currentDate.clone().startOf("month");
  const daysInMonth = monthStart.daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => monthStart.clone().add(i, "days"));

  const getDayHours = (groupId, day) => {
    const dayStart = day.clone().startOf("day").valueOf();
    const dayEnd   = day.clone().endOf("day").valueOf();
    return items
      .filter((item) => item.group === groupId && item.start < dayEnd && item.end > dayStart)
      .reduce((sum, item) => {
        const clampedStart = Math.max(item.start, dayStart);
        const clampedEnd   = Math.min(item.end, dayEnd);
        return sum + (clampedEnd - clampedStart) / 3600000;
      }, 0);
  };

  // ✅ Bug 4 fixed — returns full entry objects for popup
  const getDayItems = (groupId, day) => {
    const dayStart = day.clone().startOf("day").valueOf();
    const dayEnd   = day.clone().endOf("day").valueOf();
    return items
      .filter((item) => item.group === groupId && item.start < dayEnd && item.end > dayStart)
      .map((item) => {
        const clampedStart = Math.max(item.start, dayStart);
        const clampedEnd   = Math.min(item.end, dayEnd);
        return { hours: (clampedEnd - clampedStart) / 3600000, type: item.type, raw: item };
      });
  };

  const getMonthTotal = (groupId) => days.reduce((sum, day) => sum + getDayHours(groupId, day), 0);
  const isWeekend = (day) => day.day() === 0 || day.day() === 6;
  const isToday   = (day) => day.isSame(moment(), "day");

  const handlecellclick = (e, group, day, entries) => {
    if (entries.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const POPUP_HEIGHT = 300, POPUP_WIDTH = 320, MARGIN = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const y = spaceBelow < POPUP_HEIGHT ? rect.top - POPUP_HEIGHT - MARGIN : rect.bottom + MARGIN;
    let x = rect.left;
    if (x + POPUP_WIDTH > window.innerWidth - MARGIN) x = window.innerWidth - POPUP_WIDTH - MARGIN;
    if (x < MARGIN) x = MARGIN;
    setPopup((prev) => {
      if (prev?.group?.id === group.id && prev?.day?.valueOf() === day.valueOf()) {
        return null;
      }
      return { group, day, entries, x, y };
    });
  };

  return (
    // ✅ Bug 5 fixed — fragment so popup is outside overflow div
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 bg-white z-10 text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest min-w-[200px]">
                Staff Member
              </th>
              <th className="py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-right min-w-[52px]">
                Total
              </th>
              {days.map((day) => (
                <th key={day.valueOf()} className={`py-2 text-center min-w-[32px] ${isWeekend(day) ? "bg-slate-50" : ""}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wide ${isToday(day) ? "text-indigo-600" : "text-slate-400"}`}>
                    {day.format("ddd")[0]}
                  </div>
                  <div className={`text-xs font-semibold mt-0.5 w-6 h-6 rounded-full flex items-center justify-center mx-auto ${isToday(day) ? "bg-indigo-600 text-white" : "text-slate-500"}`}>
                    {day.format("D")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {groups.map((group, idx) => {
              const monthTotal = getMonthTotal(group.id);
              return (
                <tr key={group.id} className={`border-b border-slate-100 ${idx % 2 === 1 ? "bg-slate-50" : "bg-white"}`}>
                  <td className="sticky left-0 z-10 py-2.5 px-4 bg-inherit">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                        {group.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 whitespace-nowrap">{group.title}</div>
                        <div className="text-[11px] text-slate-400">{group.subtitle}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <span className="text-sm font-bold text-slate-600 whitespace-nowrap">
                      {monthTotal > 0 ? `${Math.round(monthTotal)}h` : "—"}
                    </span>
                  </td>

                  {/* ✅ Bug 4 fixed — onClick added, uses getDayItems */}
                  {days.map((day) => {
                    const dayItems = getDayItems(group.id, day);
                    const hours = dayItems.reduce((s, e) => s + e.hours, 0);
                    const cellStyle = getDayColor(hours);
                    const isActive = popup?.group?.id === group.id && popup?.day?.valueOf() === day.valueOf();

                    return (
                      <td
                        key={day.valueOf()}
                        className={`py-2 px-0.5 text-center ${isWeekend(day) ? "bg-slate-50/70" : ""}`}
                        onClick={(e) => handlecellclick(e, group, day, dayItems)}
                      >
                        {cellStyle ? (
                          <div
                            className={`w-7 h-7 rounded-lg mx-auto flex items-center justify-center cursor-pointer transition-all ${
                              isActive ? "ring-2 ring-indigo-400 ring-offset-1" : "hover:brightness-95"
                            }`}
                            style={cellStyle}
                          >
                            <span className="text-[9px] font-bold" style={{ color: cellStyle.color }}>
                              {Math.round(hours)}h
                            </span>
                          </div>
                        ) : (
                          <div className="w-7 h-7 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-center gap-6 py-4 border-t border-slate-100">
          {LEGEND.map(({ label, style }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={style} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Bug 5 fixed — outside overflow div */}
      {popup && (
        <div
          ref={popupRef}
          className="fixed z-50 bg-slate-50 rounded-2xl shadow-xl border border-slate-100 w-80 p-4"
          style={{ left: popup.x, top: popup.y }}
        >
          <button onClick={() => setPopup(null)} className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 transition">
            <X size={15} />
          </button>

          <div className="flex items-center gap-2.5 mb-3 pr-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0">
              {popup.group.initials}
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">{popup.group.title}</div>
              <div className="text-sm font-bold text-slate-800">
                Logs for {popup.day.format("MMMM DD")}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
            {popup.entries.map((entry, i) => {
              const meta = STATUS_META[entry.type] ?? STATUS_META.pending;
              const start = moment(entry.raw.start).format("HH:mm");
              const end   = moment(entry.raw.end).format("HH:mm");
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Log #{i + 1}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock size={11} />
                    {start} – {end}
                    <span className="text-slate-300 mx-1">·</span>
                    <span className="font-semibold text-slate-700">{entry.hours.toFixed(1)}h</span>
                  </div>
                  {entry.raw.taskTitle && (
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <FileText size={11} className="shrink-0" />{entry.raw.taskTitle}
                    </div>
                  )}
                  {entry.raw.category && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Tag size={11} />{entry.raw.category}
                    </div>
                  )}
                  {i < popup.entries.length - 1 && <div className="border-b border-slate-100 mt-1" />}
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Day Total</span>
            <span className="text-sm font-bold text-slate-700">
              {popup.entries.reduce((s, e) => s + e.hours, 0).toFixed(1)}h
            </span>
          </div>
        </div>
      )}
    </>
  );
}