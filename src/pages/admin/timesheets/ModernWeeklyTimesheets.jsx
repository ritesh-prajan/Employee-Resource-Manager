import React from "react";
import moment from "moment";
import { Coffee } from "lucide-react";

// ── Moved OUTSIDE the component so it's always in scope ──────────────────────
// ── Add this helper OUTSIDE the component, near getCellStyle ─────────────────

const getDaySummaryStyle = (entries) => {
  if (entries.length === 0) return null;

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const completedHours = entries.filter(e => e.type === "completed").reduce((s, e) => s + e.hours, 0);
  const pendingHours = entries.filter(e => e.type === "pending").reduce((s, e) => s + e.hours, 0);
  const breakHours = entries.filter(e => e.type === "break").reduce((s, e) => s + e.hours, 0);

  const hasCompleted = completedHours > 0;
  const hasPending = pendingHours > 0;
  const hasBreak = breakHours > 0;

  // All completed → solid green
  if (hasCompleted && !hasPending && !hasBreak) {
    return {
      background: "#dcfce7",
      borderWidth: "1px", borderStyle: "solid", borderColor: "#86efac",
      color: "#15803d",
      label: totalHours.toFixed(1),
    };
  }

  // All pending → solid blue
  if (hasPending && !hasCompleted && !hasBreak) {
    return {
      background: "#dbeafe",
      borderWidth: "1px", borderStyle: "solid", borderColor: "#93c5fd",
      color: "#1d4ed8",
      label: totalHours.toFixed(1),
    };
  }

  // Only break → solid yellow
  if (hasBreak && !hasCompleted && !hasPending) {
    return {
      background: "#fef9c3",
      borderWidth: "1px", borderStyle: "solid", borderColor: "#fde047",
      color: "#854d0e",
      label: null, // shows coffee icon
    };
  }

  // Mix of completed + pending → green-to-blue gradient
  // The gradient split point reflects proportion of completed work
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

  // Mix includes break → just show total with a neutral style
  // Replace the last fallback with this:

// Mix of completed + pending + break → gradient but ignore break hours in ratio
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

// completed + break (no pending) → solid green
if (hasCompleted && hasBreak && !hasPending) {
  return {
    background: "#dcfce7",
    borderWidth: "1px", borderStyle: "solid", borderColor: "#86efac",
    color: "#15803d",
    label: totalHours.toFixed(1),
  };
}

// pending + break (no completed) → solid blue
if (hasPending && hasBreak && !hasCompleted) {
  return {
    background: "#dbeafe",
    borderWidth: "1px", borderStyle: "solid", borderColor: "#93c5fd",
    color: "#1d4ed8",
    label: totalHours.toFixed(1),
  };
}
};

export default function ModernWeeklyTimesheets({ groups, items, currentDate }) {
  const weekStart = currentDate.clone().startOf("isoWeek");
  const days = Array.from({ length: 7 }, (_, i) => weekStart.clone().add(i, "days"));

  const getDayEntries = (groupId, day) => {
    const dayStart = day.clone().startOf("day").valueOf();
    const dayEnd   = day.clone().endOf("day").valueOf();

    return items
      .filter(
        (item) =>
          item.group === groupId &&
          item.start < dayEnd &&
          item.end > dayStart
      )
      .map((item) => {
        const clampedStart = Math.max(item.start, dayStart);
        const clampedEnd   = Math.min(item.end, dayEnd);
        const hours = (clampedEnd - clampedStart) / 3600000;
        return { hours, type: item.type };
      });
  };

  const getTotalHours = (groupId) =>
    days.reduce((sum, day) => {
      return sum + getDayEntries(groupId, day).reduce((s, e) => s + e.hours, 0);
    }, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-64">
              Staff Member
            </th>
            {days.map((day) => (
              <th
                key={day.valueOf()}
                className="py-3 px-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                <div>{day.format("ddd")}</div>
                <div className="text-slate-400 font-normal">{day.format("D")}</div>
              </th>
            ))}
            <th className="py-3 px-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">
              Total
            </th>
          </tr>
        </thead>

        {/* Rows */}
        <tbody>
          {groups.map((group, idx) => {
            const total = getTotalHours(group.id);
            return (
              <tr
                key={group.id}
                className={`border-b border-slate-100 ${
                  idx % 2 === 1 ? "bg-slate-50" : "bg-white"
                }`}
              >
                {/* Staff name cell */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                      {group.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {group.title}
                      </div>
                      <div className="text-xs text-slate-400">{group.subtitle}</div>
                    </div>
                  </div>
                </td>

                {/* Day cells */}
                {days.map((day) => {
                  const entries = getDayEntries(group.id, day);
                  const summary =getDaySummaryStyle(entries);
                  return (
                    <td key={day.valueOf()} className="py-3 px-2 text-center">
                      {!summary ? (
                        <span className="text-slate-300 text-sm">—</span>
                      ) : (
                        
                        
                            <span
                            
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg min-w-[44px] text-xs font-semibold"
                              style={summary}
                            >
                              {summary.label=null?(
                                <Coffee size={13} strokeWidth={2.5}/>
                              ):(
                                `${summary.label}h`
                              )}
                            </span>
                        
                      )}
                    </td>
                  );
                })}

                {/* Total */}
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
  );
}