import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import { Coffee, X, Clock, Tag, FileText } from "lucide-react";

const getDaySummaryStyle = (entries) => {
  if (entries.length === 0) return null;

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const completedHours = entries.filter(e => e.type === "completed").reduce((s, e) => s + e.hours, 0);
  const pendingHours = entries.filter(e => e.type === "pending").reduce((s, e) => s + e.hours, 0);
  const breakHours = entries.filter(e => e.type === "break").reduce((s, e) => s + e.hours, 0);

  const hasCompleted = completedHours > 0;
  const hasPending = pendingHours > 0;
  const hasBreak = breakHours > 0;

  if (hasCompleted && !hasPending && !hasBreak)
    return { background: "#dcfce7", borderWidth: "1px", borderStyle: "solid", borderColor: "#86efac", color: "#15803d", label: totalHours.toFixed(1) };

  if (hasPending && !hasCompleted && !hasBreak)
    return { background: "#dbeafe", borderWidth: "1px", borderStyle: "solid", borderColor: "#93c5fd", color: "#1d4ed8", label: totalHours.toFixed(1) };

  if (hasBreak && !hasCompleted && !hasPending)
    return { background: "#fef9c3", borderWidth: "1px", borderStyle: "solid", borderColor: "#fde047", color: "#854d0e", label: null };

  if (hasCompleted && hasPending) {
    const completedPct = Math.round((completedHours / (completedHours + pendingHours)) * 100);
    return {
      background: `linear-gradient(90deg, #dcfce7 0%, #dcfce7 ${completedPct}%, #dbeafe ${completedPct}%, #dbeafe 100%)`,
      borderWidth: "1px", borderStyle: "solid",
      borderColor: completedPct > 50 ? "#86efac" : "#93c5fd",
      color: completedPct > 50 ? "#15803d" : "#1d4ed8",
      label: totalHours.toFixed(1),
    };
  }

  if (hasCompleted && hasBreak && !hasPending)
    return { background: "#dcfce7", borderWidth: "1px", borderStyle: "solid", borderColor: "#86efac", color: "#15803d", label: totalHours.toFixed(1) };

  if (hasPending && hasBreak && !hasCompleted)
    return { background: "#dbeafe", borderWidth: "1px", borderStyle: "solid", borderColor: "#93c5fd", color: "#1d4ed8", label: totalHours.toFixed(1) };

  return { background: "#f1f5f9", borderWidth: "1px", borderStyle: "solid", borderColor: "#cbd5e1", color: "#475569", label: totalHours.toFixed(1) };
};

const STATUS_META = {
  completed: { label: "Approved",    bg: "#dcfce7", color: "#15803d", border: "#86efac" },
  pending:   { label: "In Progress", bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
  break:     { label: "Break",       bg: "#fef9c3", color: "#854d0e", border: "#fde047" },
};

export default function ModernWeeklyTimesheets({ groups, items, currentDate }) {
  const [popup, setPopup] = useState(null);

  // ✅ Guard before any hooks that use currentDate
  if (!currentDate || !currentDate.clone) return null;

  const weekStart = currentDate.clone().startOf("isoWeek");
  const days = Array.from({ length: 7 }, (_, i) => weekStart.clone().add(i, "days"));

  // ✅ Bug 3 fixed — raw field added
  const getDayEntries = (groupId, day) => {
    const dayStart = day.clone().startOf("day").valueOf();
    const dayEnd   = day.clone().endOf("day").valueOf();
    return items
      .filter((item) => item.group === groupId && item.start < dayEnd && item.end > dayStart)
      .map((item) => {
        const clampedStart = Math.max(item.start, dayStart);
        const clampedEnd   = Math.min(item.end, dayEnd);
        return {
          hours: (clampedEnd - clampedStart) / 3600000,
          type: item.type,
          raw: item,  // ✅ included
        };
      });
  };

  const getTotalHours = (groupId) =>
    days.reduce((sum, day) =>
      sum + getDayEntries(groupId, day).reduce((s, e) => s + e.hours, 0), 0);

  const handlecellclick = (e, group, day, entries) => {
    if (entries.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const POPUP_HEIGHT = 300;
    const POPUP_WIDTH = 320;
    const MARGIN = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const y = spaceBelow < POPUP_HEIGHT ? rect.top - POPUP_HEIGHT - MARGIN : rect.bottom + MARGIN;
    let x = rect.left;
    if (x + POPUP_WIDTH > window.innerWidth - MARGIN) x = window.innerWidth - POPUP_WIDTH - MARGIN;
    if (x < MARGIN) x = MARGIN;
    setPopup((prev) => {
      if (prev?.group?.id === group.id && prev?.day?.valueOf() === day.valueOf()) {
        return null;
      }
      return { group, day, entries, x, y, flipped: spaceBelow < POPUP_HEIGHT };
    });
  };
  const popupref=useRef(null);
  useEffect(()=>{
    const handleclickoutside=(e)=>{
        if(popupref.current&&!popupref.current.countains(e.target)){
            setPopup(null);
        }
    };
    document.addEventListener("mousedown",handleclickoutside);

    return ()=> document.removeEventListener("mousedown",handleclickoutside);
  },[]);

  return (
    <>
      
     

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-64">
                Staff Member
              </th>
              {days.map((day) => (
                <th key={day.valueOf()} className="py-3 px-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div>{day.format("ddd")}</div>
                  <div className="text-slate-400 font-normal">{day.format("D")}</div>
                </th>
              ))}
              <th className="py-3 px-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Total</th>
            </tr>
          </thead>

          <tbody>
            {groups.map((group, idx) => {
              const total = getTotalHours(group.id);
              return (
                <tr key={group.id} className={`border-b border-slate-100 ${idx % 2 === 1 ? "bg-slate-50" : "bg-white"}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                        {group.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{group.title}</div>
                        <div className="text-xs text-slate-400">{group.subtitle}</div>
                      </div>
                    </div>
                  </td>

                  {days.map((day) => {
                    const entries = getDayEntries(group.id, day);
                    const summary = getDaySummaryStyle(entries);
                    const isActive = popup?.group?.id === group.id && popup?.day?.valueOf() === day.valueOf();

                    return (
                      // ✅ Bug 5 fixed — onClick added
                      <td
                        key={day.valueOf()}
                        className="py-3 px-2 text-center"
                        onClick={(e) => handlecellclick(e, group, day, entries)}
                      >
                        {!summary ? (
                          <span className="text-slate-300 text-sm">—</span>
                        ) : (
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg min-w-[44px] text-xs font-semibold cursor-pointer transition-all ${
                              isActive ? "ring-2 ring-indigo-400 ring-offset-1" : "hover:brightness-95"
                            }`}
                            style={summary}
                          >
                            {/* ✅ Bug 2 fixed — === not = */}
                            {summary.label === null ? (
                              <Coffee size={13} strokeWidth={2.5} />
                            ) : (
                              `${summary.label}h`
                            )}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-bold text-slate-700">
                      {total > 0 ? `${total.toFixed(1)}h` : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

     
      {popup && (
        <div
          ref={popupref}
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
                    Logs for {popup.day.format("dddd (YYYY-MM-DD)")}
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                {popup.entries.map((entry, i) => {
                  // ✅ Bug 4 fixed — label not lable, break value fixed
                  const meta = STATUS_META[entry.type] ?? STATUS_META.pending;
                  const start = moment(entry.raw.start).format("HH:mm");
                  const end   = moment(entry.raw.end).format("HH:mm");
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Log #{i + 1}</span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                        >
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
                          <FileText size={11} className="shrink-0" />
                          {entry.raw.taskTitle}
                        </div>
                      )}
                      {entry.raw.category && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Tag size={11} />
                          {entry.raw.category}
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