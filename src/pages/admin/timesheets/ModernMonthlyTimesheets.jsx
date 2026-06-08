import React from "react";
import moment from "moment";

// ── Color based on total hours that day ───────────────────────────────────────
const getDayColor = (hours) => {
  if (hours === 0) return null;
  if (hours < 4) return {
    background: "#febbbbbe",
    borderWidth: "1px", borderStyle: "solid", borderColor: "#bfdbfe",
  };
  if (hours < 8) return {
    background: "#006cf948",
    borderWidth: "1px", borderStyle: "solid", borderColor: "#93c5fd",
  };
  return {
    background: "#dcfce7",
    borderWidth: "1px", borderStyle: "solid", borderColor: "#86efac",
  };
};

const LEGEND = [
  
  { label: "1–4h (Partial)",        style: { background: "#febbbbbe", borderWidth:"1px", borderStyle:"solid", borderColor:"#bfdbfe" } },
  { label: "4–8h (Standard)",       style: { background: "#006cf948", borderWidth:"1px", borderStyle:"solid", borderColor:"#93c5fd" } },
  { label: "≥ 8h (Full / Overrun)", style: { background: "#dcfce7", borderWidth:"1px", borderStyle:"solid", borderColor:"#86efac" } },
];

export default function ModernMonthlyTimesheets({ groups, items, currentDate }) {
  if (!currentDate || !currentDate.clone) {
    return <div className="p-6 text-sm text-slate-400">No date selected.</div>;
  }

  const monthStart = currentDate.clone().startOf("month");
  const daysInMonth = monthStart.daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    monthStart.clone().add(i, "days")
  );

  // Total hours for a staff member on a given day
  const getDayHours = (groupId, day) => {
    const dayStart = day.clone().startOf("day").valueOf();
    const dayEnd   = day.clone().endOf("day").valueOf();
    return items
      .filter(
        (item) =>
          item.group === groupId &&
          item.start < dayEnd &&
          item.end > dayStart
      )
      .reduce((sum, item) => {
        const clampedStart = Math.max(item.start, dayStart);
        const clampedEnd   = Math.min(item.end, dayEnd);
        return sum + (clampedEnd - clampedStart) / 3600000;
      }, 0);
  };

  const getMonthTotal = (groupId) =>
    days.reduce((sum, day) => sum + getDayHours(groupId, day), 0);

  // Is this day a weekend?
  const isWeekend = (day) => day.day() === 0 || day.day() === 6;
  const isToday = (day) => day.isSame(moment(), "day");

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">

        {/* ── Header ── */}
        <thead>
          <tr className="border-b border-slate-200">
            {/* Staff column */}
            <th className="sticky left-0 bg-white z-10 text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest min-w-[200px]">
              Staff Member
            </th>
            {/* Monthly total */}
            <th className="py-3 px-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-right min-w-[52px]">
              Total
            </th>
            {/* Day columns */}
            {days.map((day) => (
              <th
                key={day.valueOf()}
                className={`py-2 text-center min-w-[32px] ${
                  isWeekend(day) ? "bg-slate-50" : ""
                }`}
              >
                <div className={`text-[10px] font-bold uppercase tracking-wide ${
                  isToday(day) ? "text-indigo-600" : "text-slate-400"
                }`}>
                  {day.format("ddd")[0]}
                </div>
                <div className={`text-xs font-semibold mt-0.5 w-6 h-6 rounded-full flex items-center justify-center mx-auto ${
                  isToday(day)
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500"
                }`}>
                  {day.format("D")}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Rows ── */}
        <tbody>
          {groups.map((group, idx) => {
            const monthTotal = getMonthTotal(group.id);
            return (
              <tr
                key={group.id}
                className={`border-b border-slate-100 ${
                  idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"
                }`}
              >
                {/* Staff name */}
                <td className="sticky left-0 z-10 py-2.5 px-4 bg-inherit">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                      {group.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {group.title}
                      </div>
                      <div className="text-[11px] text-slate-400">{group.subtitle}</div>
                    </div>
                  </div>
                </td>

                {/* Monthly total */}
                <td className="py-2.5 px-3 text-right">
                  <span className="text-sm font-bold text-slate-600 whitespace-nowrap">
                    {monthTotal > 0 ? `${Math.round(monthTotal)}h` : "—"}
                  </span>
                </td>

                {/* Day cells */}
                {days.map((day) => {
                  const hours = getDayHours(group.id, day);
                  const cellStyle = getDayColor(hours);
                  return (
                    <td
                      key={day.valueOf()}
                      className={`py-2 px-0.5 text-center ${
                        isWeekend(day) ? "bg-slate-50/70" : ""
                      }`}
                    >
                      {cellStyle ? (
                        <div
                          className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center cursor-default"
                          style={cellStyle}
                          title={`${group.title} · ${day.format("MMM D")} · ${hours.toFixed(1)}h`}
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

      {/* ── Legend ── */}
      <div className="flex items-center justify-center gap-6 py-4 border-t border-slate-100">
        {LEGEND.map(({ label, style }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={style}
            />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}