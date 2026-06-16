import React from 'react';
import { Video, Calendar, Clock, Link2, User } from 'lucide-react';

export default function Part({ data }) {
  if (!data) return null;

  // Helper to format ISO time string: e.g. "02:50 PM (Jun 16)"
  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      
      // Format time: e.g. "02:50 PM"
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minStr = minutes < 10 ? '0' + minutes : minutes;
      const hourStr = hours < 10 ? '0' + hours : hours;
      const timeStr = `${hourStr}:${minStr} ${ampm}`;
      
      // Format date: e.g. "Jun 16"
      const monthStr = date.toLocaleDateString("en-US", { month: 'short' });
      const dayStr = date.getDate();
      
      return `${timeStr} (${monthStr} ${dayStr})`;
    } catch (e) {
      return isoString;
    }
  };

  // Helper to map project color to left border and badge colors
  const getProjectStyles = (color) => {
    switch (color) {
      case 'blue':
        return {
          border: 'border-l-[#0010AE]',
          badge: 'bg-blue-50 text-[#0010AE] border-blue-200'
        };
      case 'red':
        return {
          border: 'border-l-red-500',
          badge: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'green':
        return {
          border: 'border-l-green-500',
          badge: 'bg-green-50 text-green-700 border-green-200'
        };
      case 'purple':
        return {
          border: 'border-l-purple-500',
          badge: 'bg-purple-50 text-purple-700 border-purple-200'
        };
      case 'orange':
        return {
          border: 'border-l-orange-500',
          badge: 'bg-orange-50 text-orange-700 border-orange-200'
        };
      case 'gray':
      default:
        return {
          border: 'border-l-slate-400',
          badge: 'bg-slate-50 text-slate-700 border-slate-200'
        };
    }
  };

  const projectStyle = getProjectStyles(data.project?.color);

  return (
    <div className={`w-full bg-white rounded-xl border border-slate-200 border-l-[3px] ${projectStyle.border} p-6 shadow-sm hover:shadow transition duration-200 flex flex-col gap-3`}>
      {/* Row 1: Duration, Host, and Join Button */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {/* Duration Badge */}
          <div className="flex items-center gap-1 bg-blue-50 text-[#0010AE] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-100">
            <Clock size={12} />
            <span>{data.duration} mins</span>
          </div>
          {/* Host Name */}
          <span className="text-slate-400 text-xs font-medium ml-1">
            {data.host}
          </span>
        </div>

        {/* Join Button on far right */}
        {data.joinUrl ? (
          <a
            href={data.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#0010AE] hover:bg-blue-800 text-white text-xs font-semibold px-4 py-1.5 rounded-md transition active:scale-95 shadow-sm"
          >
            <Video size={14} />
            Join
          </a>
        ) : (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-400 text-xs px-4 py-1.5 rounded-md font-semibold">
            Completed
          </span>
        )}
      </div>

      {/* Row 2: Title */}
      <h3 className="text-base font-bold text-slate-800 tracking-tight leading-snug">
        {data.title}
      </h3>

      {/* Row 3: Description */}
      {data.description && (
        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
          {data.description}
        </p>
      )}

      {/* Row 4: Project and Task Badges */}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        {data.project && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md border ${projectStyle.badge}`}>
            Project: {data.project.label}
          </span>
        )}
        {data.linkedTask && (
          <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-semibold px-2.5 py-1 rounded-md">
            <Link2 size={12} className="text-slate-400" />
            Linked Task: {data.linkedTask}
          </span>
        )}
      </div>

      {/* Divider */}
      <hr className="border-t border-slate-100 mt-2" />

      {/* Row 5: Attendees & Time */}
      <div className="flex items-center justify-between w-full pt-1">
        {/* Attendees */}
        <div className="flex items-center gap-2">
          <User size={14} className="text-slate-400" />
          <div className="flex -space-x-1">
            {data.attendees && data.attendees.map((attendee, index) => (
              <div
                key={index}
                className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-[10px] font-semibold text-[#0010AE] border border-white shadow-sm"
                title={attendee}
              >
                {attendee}
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Time */}
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
          <Calendar size={13} className="text-slate-400" />
          <span>{formatDateTime(data.scheduledAt)}</span>
        </div>
      </div>
    </div>
  );
}
