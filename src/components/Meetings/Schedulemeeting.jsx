import React, { useState } from "react";
import { CirclePlus, Calendar, Clock, Video, FileText } from "lucide-react";
import { useApp } from "../../context/AppContext";
import MultiSearchSelect from "../ui/MultiSelectDropdown";

export default function Schedulemeeting({ onSchedule }) {
  const [open, setOpen] = useState(false);
  const { users, currentUser } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [selectedAttendees, setSelectedAttendees] = useState([]);

  const userOptions = users
    .filter(u => u.id !== currentUser?.id)
    .map(u => ({ value: u.id, label: `${u.name} (${u.role})` }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !dateTime) {
      alert("Please fill in meeting title and date/time.");
      return;
    }

    const attendeeInitials = selectedAttendees.map(id => {
      const u = users.find(user => user.id === id);
      if (!u) return "";
      const parts = u.name.trim().split(/\s+/);
      return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
    }).filter(Boolean);

    if (onSchedule) {
      onSchedule({
        id: `upcoming-${Date.now()}`,
        duration: parseInt(duration, 10),
        host: currentUser?.name || "Organizer",
        title: title.trim(),
        description: description.trim(),
        project: { label: "Project Alpha", color: "blue" },
        linkedTask: "TASK-0042",
        attendees: attendeeInitials,
        scheduledAt: dateTime,
        joinUrl: meetingLink.trim() || "#"
      });
    }

    // Reset Form & Close
    setTitle("");
    setDescription("");
    setMeetingLink("");
    setDateTime("");
    setDuration("30");
    setSelectedAttendees([]);
    setOpen(false);
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setMeetingLink("");
    setDateTime("");
    setDuration("30");
    setSelectedAttendees([]);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-primary"
        style={{ display: "flex", alignItems: "center", gap: "6px", borderRadius: "0.75rem", padding: "0.6rem 1.5rem" }}
      >
        <CirclePlus size={16} /> Schedule Meeting
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={handleClose}
        >
          {/* Prevent close when clicking inside modal */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xl text-blue-600 font-bold">+</span>
                <h2 className="text-2xl font-semibold text-slate-800">
                  Schedule Meeting
                </h2>
              </div>

              <button
                onClick={handleClose}
                className="rounded-full bg-gray-100 px-4 py-1.5 hover:bg-gray-200 text-sm font-medium transition"
              >
                Close
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-group">
                <label className="mb-2 block font-semibold text-sm text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500 transition"
                  placeholder="Meeting topic..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="mb-2 block font-semibold text-sm text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500 transition"
                  placeholder="Agenda..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="mb-2 block font-semibold text-sm text-slate-700">
                  Meeting Link (URL)
                </label>
                <input
                  type="url"
                  className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500 transition"
                  placeholder="https://..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="mb-2 block font-semibold text-sm text-slate-700">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500 transition"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="mb-2 block font-semibold text-sm text-slate-700">
                    Duration
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-blue-500 transition"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    <option value="15">15 mins</option>
                    <option value="30">30 mins</option>
                    <option value="45">45 mins</option>
                    <option value="60">60 mins</option>
                    <option value="90">90 mins</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="mb-2 block font-semibold text-sm text-slate-700">
                  Invite Attendees
                </label>
                <MultiSearchSelect
                  options={userOptions}
                  selectedValues={selectedAttendees}
                  onChange={setSelectedAttendees}
                  placeholder="Search and invite team members..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border px-5 py-2 hover:bg-slate-50 transition text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-white transition text-sm font-semibold shadow-sm"
                >
                  Create Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}