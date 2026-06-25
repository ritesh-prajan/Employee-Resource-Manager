import React, { useState, useEffect, useRef } from "react";
import { CirclePlus, ChevronUp, Search } from "lucide-react";
import { useApp } from "../../context/AppContext";
import SearchableSelect from "../ui/SearchableSelect";
import { useToast } from "../../context/ToastContext";

export default function Schedulemeeting({ onSchedule }) {
  const [open, setOpen] = useState(false);
  const { users = [], currentUser = null, projects = [], tasks = [] } = useApp() || {};
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [duration, setDuration] = useState("45");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState([]);

  const checkboxRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !dateTime) {
      toast.warning("Please fill in meeting title and date/time.");
      return;
    }

    const attendeeInitials = selectedAttendees.map(id => {
      const u = users.find(user => user.id === id);
      if (!u) return "";
      const parts = u.name.trim().split(/\s+/);
      return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
    }).filter(Boolean);

    const projectObj = selectedProject ? projects.find(p => String(p.id) === String(selectedProject)) : null;
    const taskObj = selectedTask ? tasks.find(t => String(t.id) === String(selectedTask)) : null;

    if (onSchedule) {
      onSchedule({
        id: `upcoming-${Date.now()}`,
        duration: parseInt(duration, 10),
        host: currentUser?.name || "Organizer",
        title: title.trim(),
        description: description.trim(),
        project: projectObj ? { label: projectObj.name, color: "blue" } : null,
        linkedTask: taskObj ? taskObj.taskNumber || "TASK-0000" : null,
        attendees: attendeeInitials,
        scheduledAt: dateTime,
        joinUrl: meetingLink.trim() || "#",
        isRecurring,
        recurrenceDays: isRecurring ? recurrenceDays : []
      });
    }

    // Reset Form & Close
    setTitle("");
    setDescription("");
    setMeetingLink("");
    setDateTime("");
    setDuration("45");
    setSelectedProject("");
    setSelectedTask("");
    setSelectedAttendees([]);
    setParticipantSearch("");
    setIsRecurring(false);
    setRecurrenceDays([]);
    setOpen(false);
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setMeetingLink("");
    setDateTime("");
    setDuration("45");
    setSelectedProject("");
    setSelectedTask("");
    setSelectedAttendees([]);
    setParticipantSearch("");
    setIsRecurring(false);
    setRecurrenceDays([]);
    setOpen(false);
  };

  const filteredUsers = users.filter(u => u.id !== currentUser?.id);

  const matchingUsers = filteredUsers.filter(u => {
    const roleText = u.role === 'User' || !u.role ? 'employee' : String(u.role).toLowerCase();
    const searchVal = participantSearch.toLowerCase();
    return u.name.toLowerCase().includes(searchVal) || roleText.includes(searchVal);
  });

  const isAllSelected = matchingUsers.length > 0 && matchingUsers.every(u => selectedAttendees.includes(u.id));
  const isSomeSelected = matchingUsers.length > 0 && !isAllSelected && matchingUsers.some(u => selectedAttendees.includes(u.id));

  const handleSelectAllToggle = (checked) => {
    if (checked) {
      const toAdd = matchingUsers.filter(u => !selectedAttendees.includes(u.id)).map(u => u.id);
      setSelectedAttendees(prev => [...prev, ...toAdd]);
    } else {
      const matchingIds = matchingUsers.map(u => u.id);
      setSelectedAttendees(prev => prev.filter(id => !matchingIds.includes(id)));
    }
  };

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const projectOptions = projects.map(p => ({
    value: String(p.id),
    label: p.name
  }));

  const taskOptions = tasks.map(t => ({
    value: String(t.id),
    label: t.taskNumber ? `${t.taskNumber}: ${t.name || t.title}` : (t.name || t.title)
  }));

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
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[6px] p-4"
          onClick={handleClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-content max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between modal-header">
              <div className="flex items-center gap-2">
                <CirclePlus size={20} className="text-[#0010AE]" />
                <h2 className="text-lg font-semibold text-slate-800">
                  Schedule Meeting
                </h2>
              </div>

              <button
                onClick={handleClose}
                className="rounded-full bg-slate-100 px-4 py-1.5 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 text-slate-700 transition cursor-pointer"
              >
                <ChevronUp size={14} /> Close
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              <div className="form-group">
                <label className="mb-1 block font-semibold text-sm text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
                  placeholder="Meeting topic..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="mb-1 block font-semibold text-sm text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800 resize-none"
                  placeholder="Agenda..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="mb-1 block font-semibold text-sm text-slate-700">
                  Meeting Link (URL) *
                </label>
                <input
                  type="url"
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
                  placeholder="E.g. teams.microsoft.com/l/meetup-join/... or zoom.us/..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="mb-1 block font-semibold text-sm text-slate-700">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="mb-1 block font-semibold text-sm text-slate-700">
                    Duration
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-[#F0F2F5] text-slate-800 cursor-pointer"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="mb-1 block font-semibold text-sm text-slate-700">
                    Link Project (Optional)
                  </label>
                  <SearchableSelect
                    options={projectOptions}
                    value={selectedProject}
                    onChange={setSelectedProject}
                    placeholder="None / General Sync"
                    style={{ width: '100%' }}
                    className="w-full rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition text-sm bg-[#F0F2F5] text-slate-800 cursor-pointer"
                    inputStyle={{
                      padding: '0.625rem 0.875rem',
                      fontSize: '0.875rem',
                      backgroundColor: '#F0F2F5',
                      borderRadius: '0.75rem',
                      border: '1px solid #E2E8F0',
                      height: 'auto',
                      minHeight: '40px'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="mb-1 block font-semibold text-sm text-slate-700">
                    Link Task (Optional)
                  </label>
                  <SearchableSelect
                    options={taskOptions}
                    value={selectedTask}
                    onChange={setSelectedTask}
                    placeholder="None"
                    style={{ width: '100%' }}
                    className="w-full rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition text-sm bg-[#F0F2F5] text-slate-800 cursor-pointer"
                    inputStyle={{
                      padding: '0.625rem 0.875rem',
                      fontSize: '0.875rem',
                      backgroundColor: '#F0F2F5',
                      borderRadius: '0.75rem',
                      border: '1px solid #E2E8F0',
                      height: 'auto',
                      minHeight: '40px'
                    }}
                  />
                </div>
              </div>

              <div className="form-group border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#0010AE] focus:ring-[#0010AE] cursor-pointer"
                  />
                  <span>Recurring Meeting</span>
                </label>
                
                {isRecurring && (
                  <div className="mt-3">
                    <label className="mb-2 block font-semibold text-xs text-slate-600 uppercase tracking-wider">
                      Repeat on (Days of the week)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                        const isSelected = recurrenceDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setRecurrenceDays(prev => prev.filter(d => d !== day));
                              } else {
                                setRecurrenceDays(prev => [...prev, day]);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer select-none"
                            style={{
                              backgroundColor: isSelected ? '#0010AE' : 'white',
                              color: isSelected ? 'white' : '#475569',
                              borderColor: isSelected ? '#0010AE' : '#CBD5E1',
                            }}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-semibold text-sm text-slate-700">
                    Participants
                  </label>
                  {matchingUsers.length > 0 && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                      <input
                        type="checkbox"
                        ref={checkboxRef}
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAllToggle(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      Select All
                    </label>
                  )}
                </div>

                {/* Participant Search Input */}
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-within:border-blue-500 focus-within:bg-white transition">
                  <Search size={14} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search participants..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-slate-800 text-xs"
                  />
                  {participantSearch && (
                    <button
                      type="button"
                      onClick={() => setParticipantSearch("")}
                      className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Scrollable Checklist */}
                <div className="rounded-xl border border-slate-200 p-3 max-h-28 overflow-y-auto space-y-2 bg-white">
                  {matchingUsers.length === 0 ? (
                    <span className="text-slate-400 text-xs block text-center py-2">No matching employees found.</span>
                  ) : (
                    matchingUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={selectedAttendees.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAttendees(prev => [...prev, user.id]);
                            } else {
                              setSelectedAttendees(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`user-${user.id}`}
                          className="text-xs font-normal text-slate-700 cursor-pointer select-none"
                        >
                          {user.name} ({user.role === 'User' || !user.role ? 'Employee' : user.role})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#0010AE] hover:bg-blue-800 py-3 text-white font-bold text-center transition shadow-md text-sm tracking-wide cursor-pointer"
                >
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}