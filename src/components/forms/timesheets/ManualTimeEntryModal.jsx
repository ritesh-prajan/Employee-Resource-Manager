import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, AlertTriangle, Coffee, Briefcase, Calendar, Users } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import SearchableSelect from '../../ui/SearchableSelect';
import dayjs from 'dayjs';

export default function ManualTimeEntryModal({ show, onClose, defaultDate, editingEntry }) {
  const { currentUser, tasks, projects, addManualEntry, editTimeEntry, timeEntries, meetings } = useApp();
  const toast = useToast();
  const [entryType, setEntryType] = useState('work'); // 'work', 'break', or 'meeting'
  const [meetingId, setMeetingId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('1');
  const [endTime, setEndTime] = useState('10:00');
  const [taskId, setTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState('In Progress');
  const [workCategory, setWorkCategory] = useState('Story');
  const [justification, setJustification] = useState('');

  const getLocalDateString = (dObjOrStr) => {
    if (!dObjOrStr) return '';
    const d = new Date(dObjOrStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartTimeChange = (newStartVal) => {
    setStartTime(newStartVal);
    const startMatch = newStartVal.match(/^(\d{2}):(\d{2})$/);
    const endMatch = endTime.match(/^(\d{2}):(\d{2})$/);
    if (startMatch && endMatch) {
      const startMins = parseInt(startMatch[1], 10) * 60 + parseInt(startMatch[2], 10);
      let endMins = parseInt(endMatch[1], 10) * 60 + parseInt(endMatch[2], 10);
      if (endMins < startMins) {
        endMins += 24 * 60;
      }
      const diffHours = (endMins - startMins) / 60;
      setDuration(diffHours.toString());
    }
  };

  const handleEndTimeChange = (newEndVal) => {
    setEndTime(newEndVal);
    const startMatch = startTime.match(/^(\d{2}):(\d{2})$/);
    const endMatch = newEndVal.match(/^(\d{2}):(\d{2})$/);
    if (startMatch && endMatch) {
      const startMins = parseInt(startMatch[1], 10) * 60 + parseInt(startMatch[2], 10);
      let endMins = parseInt(endMatch[1], 10) * 60 + parseInt(endMatch[2], 10);
      if (endMins < startMins) {
        endMins += 24 * 60;
      }
      const diffHours = (endMins - startMins) / 60;
      setDuration(diffHours.toString());
    }
  };

  const handleDurationChange = (newDurationVal) => {
    setDuration(newDurationVal);
    const durNum = parseFloat(newDurationVal);
    const startMatch = startTime.match(/^(\d{2}):(\d{2})$/);
    if (!isNaN(durNum) && startMatch) {
      const startMins = parseInt(startMatch[1], 10) * 60 + parseInt(startMatch[2], 10);
      const endMinsTotal = startMins + Math.round(durNum * 60);
      const endHrs = Math.floor(endMinsTotal / 60) % 24;
      const endMins = endMinsTotal % 60;
      setEndTime(`${String(endHrs).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`);
    }
  };

  // Auto-set the start time to the end of the previous task on date change or open
  useEffect(() => {
    if (show && currentUser) {
      if (editingEntry) {
        setDate(editingEntry.date);
        setEntryType(editingEntry.workCategory === 'Break' ? 'break' : 'work');
        setStartTime(editingEntry.startTime);
        setDuration(editingEntry.duration);
        setEndTime(editingEntry.endTime);
        setTaskId(editingEntry.taskId);
        setDescription(editingEntry.description);
        setTaskStatus(editingEntry.taskStatus || 'In Progress');
        setWorkCategory(editingEntry.workCategory || 'Story');
        setJustification(editingEntry.justification || '');
        setMeetingId(editingEntry.meetingId || '');
        if (editingEntry.workCategory === 'Meeting') setEntryType('meeting');
      } else {
        const targetDate = new Date().toISOString().split('T')[0];
        setDate(targetDate);
        setEntryType('work');
        setDuration('1');
        setTaskId('');
        setDescription('');
        setTaskStatus('In Progress');
        setWorkCategory('Story');
        setJustification('');
        setMeetingId('');
        // Find last task on this date to set default start time
        const userEntriesOnDate = timeEntries.filter(
          e => e.userId === currentUser.id && e.date === targetDate
        );
        let start = '09:00';
        if (userEntriesOnDate.length > 0) {
          const sorted = [...userEntriesOnDate].sort((a, b) => a.endTime.localeCompare(b.endTime));
          start = sorted[sorted.length - 1].endTime;
        }
        setStartTime(start);
        const match = start.match(/^(\d{2}):(\d{2})$/);
        if (match) {
          const totalMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + 60;
          const endHrs = Math.floor(totalMinutes / 60) % 24;
          const endMins = totalMinutes % 60;
          setEndTime(`${String(endHrs).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`);
        } else {
          setEndTime('10:00');
        }
      }
    }
  }, [show, date, defaultDate, editingEntry, timeEntries, currentUser]);

  if (!show) return null;

  // Filter tasks to show only those explicitly assigned to the current user and not completed/submitted for review
  const relevantTasks = tasks.filter(t => t.assignedTo === currentUser?.id && t.status !== 'Completed' && t.status !== 'Pending Review');

  const taskOptions = relevantTasks.map(t => {
    const proj = projects.find(p => p.id === t.projectId);
    const projName = proj ? proj.name.split(' (')[0] : 'General';
    return {
      value: t.id,
      label: `[${projName}] ${t.taskNumber ? t.taskNumber + ': ' : ''}${t.name}`
    };
  });

  const selectedTask = tasks.find(t => t.id === taskId);
  const currentLogged = selectedTask ? (selectedTask.logged || 0) : 0;
  const eta = selectedTask ? parseFloat(selectedTask.eta || 0) : 0;
  const newDuration = parseFloat(duration) || 0;

  // Hours overrun — logged time (including this new entry) exceeds the ETA hours estimate
  const isHoursExceeded = selectedTask && eta > 0 && (currentLogged + newDuration > eta);

  // Date overrun — the task's etaDate deadline has already passed (same check used in Tasks.jsx)
  const completedStatuses = ['Completed', 'Pending Review'];
  const isDateExceeded = !!(
    selectedTask &&
    selectedTask.etaDate &&
    getLocalDateString(selectedTask.etaDate) < getLocalDateString(new Date()) &&
    !completedStatuses.includes(selectedTask.status)
  );

  const isEtaExceeded = isHoursExceeded || isDateExceeded;

  const handleSubmit = async (e) => {
      e.preventDefault();

    if (entryType === 'work' && !taskId) {
      toast.warning('Please select a task.');
      return;
    }

    if (entryType === 'meeting' && !meetingId) {
      toast.warning('Please select a meeting.');
      return;
    }

    if (entryType === 'work' && isEtaExceeded && !justification.trim()) {
      toast.warning('This task has exceeded its ETA. Please provide a justification before saving.');
      return;
    }

    const durationVal = parseFloat(duration);
    if (isNaN(durationVal) || durationVal <= 0) {
      toast.warning('Please enter a valid duration greater than 0.');
      return;
    }

    // Overlap validation (entries must not overlap)
    const newStart = dayjs(`${date}T${startTime}:00`);
    const newEnd = dayjs(`${date}T${endTime}:00`);

    if (newEnd.isBefore(newStart) || newEnd.isSame(newStart)) {
      toast.warning('End time must be after start time.');
      return;
    }

    const hasOverlap = timeEntries.some(e => {
      if (editingEntry && String(e.id) === String(editingEntry.id)) return false;
      const entryUserId = e.userId || e.employeeId || e.employee?.id;
      return (
        entryUserId &&
        String(entryUserId) === String(currentUser?.id) &&
        e.date === date &&
        dayjs(`${e.date}T${e.startTime}:00`).isBefore(newEnd) &&
        newStart.isBefore(dayjs(`${e.date}T${e.endTime}:00`))
      );
    });

    if (hasOverlap) {
      toast.warning('This time slot overlaps with an existing time entry on this date. Please enter a non-overlapping time range.');
      return;
    }

    let finalDescription = description.trim();
    if (entryType === 'meeting') {
      const selectedMeeting = (meetings || []).find(m => String(m.id) === String(meetingId));
      const meetingTitle = selectedMeeting ? selectedMeeting.title : 'Meeting';
      finalDescription = finalDescription || `Attended meeting: ${meetingTitle}`;
    } else if (entryType === 'break') {
      finalDescription = finalDescription || 'Break';
    }

    if (!finalDescription) {
      toast.warning('Please enter a description of the work done.');
      return;
    }

    let entryData = {
      userId: currentUser?.id,
      employeeId: currentUser?.id,
      date,
      startTime,
      endTime,
      duration: durationVal.toString(),
      description: finalDescription,
      workCategory: entryType === 'break' ? 'Break' : workCategory,
      justification
    };

    if (entryType === 'work') {
      entryData.taskId = taskId;
      entryData.projectId = selectedTask?.projectId || '';
      entryData.taskStatus = taskStatus;
      entryData.workCategory = workCategory;
    } else if (entryType === 'meeting') {
      entryData.taskId = null;
      entryData.projectId = null;
      entryData.meetingId = meetingId;
      entryData.workCategory = 'Meeting';
    } else {
      entryData.taskId = 'Break';
      entryData.projectId = 'Break';
      entryData.workCategory = 'Break';
    }

    try {
      if (editingEntry) {
        await editTimeEntry(editingEntry.id, entryData);
      } else {
        await addManualEntry(entryData);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save time entry:', err);
      toast.error(err?.message || 'Failed to save entry. Check console for details.');
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <motion.div
            className="modal-content liquid-glass-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ maxWidth: '540px', width: '100%', padding: '1.5rem' }}
          >
            {/* Header */}
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock className="text-primary" size={20} />
                <h3 className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
                  {editingEntry ? 'Edit Time Entry' : 'Log Time Entry'}
                </h3>
              </div>
              <button 
                type="button"
                className="modal-close" 
                onClick={onClose} 
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* LOP Policy Warning Note */}
              <div style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'color-mix(in srgb, var(--destructive) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
                borderRadius: '8px',
                fontSize: '0.72rem',
                color: 'var(--destructive)',
                fontWeight: 600,
                lineHeight: '1.2'
              }}>
                ⚠️ Note: Failing to submit timesheets will result in Loss of Pay (LOP) for those days. New entries can only be logged for today.
              </div>

              {/* Entry Type Toggle */}
              {/* Entry Type Toggle */}
              <div style={{ display: 'flex', gap: '8px', padding: '2px', background: 'var(--secondary)', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEntryType('work')}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={entryType === 'work'
                    ? { background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                    : { color: 'var(--muted-foreground)', background: 'transparent' }}
                >
                  <Briefcase size={13} /> Work Log
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('meeting')}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={entryType === 'meeting'
                    ? { background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                    : { color: 'var(--muted-foreground)', background: 'transparent' }}
                >
                  <Users size={13} /> Meeting
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('break')}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={entryType === 'break'
                    ? { background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                    : { color: 'var(--muted-foreground)', background: 'transparent' }}
                >
                  <Coffee size={13} /> Add Break
                </button>
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Date</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Calendar size={14} style={{ position: 'absolute', left: '10px', color: 'var(--muted-foreground)' }} />
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    disabled={true}
                    style={{ paddingLeft: '32px', width: '100%', opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'var(--secondary)' }}
                  />
                </div>
              </div>

              {/* Start Time & End Time */}
              <div className="keep-inline-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Start Time</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Clock size={14} style={{ position: 'absolute', left: '10px', color: 'var(--muted-foreground)' }} />
                    <input
                      type="time"
                      className="form-input"
                      value={startTime}
                      onChange={e => handleStartTimeChange(e.target.value)}
                      required
                      style={{ paddingLeft: '32px', width: '100%' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>End Time</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Clock size={14} style={{ position: 'absolute', left: '10px', color: 'var(--muted-foreground)' }} />
                    <input
                      type="time"
                      className="form-input"
                      value={endTime}
                      onChange={e => handleEndTimeChange(e.target.value)}
                      required
                      style={{ paddingLeft: '32px', width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Duration (Hours) */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Duration (Hours)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  className="form-input"
                  value={duration}
                  onChange={e => handleDurationChange(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>
              {/* Meeting Selection */}
              {entryType === 'meeting' && (() => {
                const myMeetings = (meetings || []).filter(m =>
                  m.attendees?.some(a => (a.id ?? a) === currentUser?.id)
                );
                return (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Select Meeting <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {myMeetings.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', padding: '8px 12px', background: 'var(--secondary)', borderRadius: '8px' }}>
                        No meetings found where you are an attendee.
                      </div>
                    ) : (
                      <select
                        className="form-input"
                        value={meetingId}
                        onChange={e => setMeetingId(e.target.value)}
                        style={{ width: '100%' }}
                        required
                      >
                        <option value="">— Select a meeting —</option>
                        {myMeetings.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.title} {m.date ? `(${m.date})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })()}
              
              {entryType === 'work' && (
                <>
                  {/* Task Selection */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Select Task</label>
                    <SearchableSelect
                      options={taskOptions}
                      value={taskId}
                      onChange={setTaskId}
                      placeholder="Search and select a task..."
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Task Status & Work Category */}
                  <div className="keep-inline-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Task Progress</label>
                      <select
                        className="form-input"
                        value={taskStatus}
                        onChange={e => setTaskStatus(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Category</label>
                      <select
                        className="form-input"
                        value={workCategory}
                        onChange={e => setWorkCategory(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="Story">Story</option>
                        <option value="Bug">Bug</option>
                        <option value="Feature">Feature</option>
                        <option value="Review">Review</option>
                        <option value="R&D">R&D</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                  </div>

                  {/* ETA breach warning banner */}
                  {isEtaExceeded && (
                    <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.75rem' }}>
                      <AlertTriangle size={16} style={{ shrink: 0, marginTop: '2px' }} />
                      <div>
                        <span style={{ fontWeight: 'bold' }}>ETA Limit Alert: </span>
                        {isDateExceeded && (
                          <>This task's ETA date ({new Date(selectedTask.etaDate).toLocaleDateString()}) has already passed. </>
                        )}
                        {isHoursExceeded && (
                          <>Adding {newDuration}h will bring the total logged time to {(currentLogged + newDuration).toFixed(2)}h, which exceeds the task's ETA of {eta}h. </>
                        )}
                        The task will be highlighted in red. Please provide a justification below.
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Description / Notes */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  {entryType === 'break' ? 'Break Details / Name' : 'Log Description'}
                </label>
                <textarea
                  className="form-input text-xs"
                  placeholder={entryType === 'break' ? 'e.g., Lunch Break, Coffee Break' : 'Provide details of the work done...'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows="3"
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              {/* Justification if ETA exceeded */}
              {entryType === 'work' && isEtaExceeded && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px', color: '#ef4444' }}>
                    Over-ETA Justification <span style={{ fontSize: '10px' }}>(Required)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Provide a brief explanation for exceeding the ETA..."
                    value={justification}
                    onChange={e => setJustification(e.target.value)}
                    required={isEtaExceeded}
                    style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer text-white transition-all"
                  style={{ background: 'var(--primary)', border: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Save Entry
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
