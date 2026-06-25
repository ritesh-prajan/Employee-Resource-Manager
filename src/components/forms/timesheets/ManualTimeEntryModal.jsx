import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, AlertTriangle, Coffee, Briefcase, Calendar } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../ui/Toast';
import SearchableSelect from '../../ui/SearchableSelect';
import dayjs from 'dayjs';

export default function ManualTimeEntryModal({ show, onClose, defaultDate, editingEntry }) {
  const { currentUser, tasks, projects, addManualEntry, editTimeEntry, timeEntries } = useApp();
  const toast = useToast();

  const [entryType, setEntryType] = useState('work'); // 'work' or 'break'
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('1');
  const [taskId, setTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState('In Progress');
  const [workCategory, setWorkCategory] = useState('Story');
  const [justification, setJustification] = useState('');

  // Auto-set the start time to the end of the previous task on date change or open
  useEffect(() => {
    if (show && currentUser) {
      if (editingEntry) {
        setDate(editingEntry.date);
        setEntryType(editingEntry.workCategory === 'Break' ? 'break' : 'work');
        setStartTime(editingEntry.startTime);
        setDuration(editingEntry.duration);
        setTaskId(editingEntry.taskId);
        setDescription(editingEntry.description);
        setTaskStatus(editingEntry.taskStatus || 'In Progress');
        setWorkCategory(editingEntry.workCategory || 'Story');
        setJustification(editingEntry.justification || '');
      } else {
        const targetDate = date || defaultDate || new Date().toISOString().split('T')[0];
        setDate(targetDate);
        setEntryType('work');
        setDuration('1');
        setTaskId('');
        setDescription('');
        setTaskStatus('In Progress');
        setWorkCategory('Story');
        setJustification('');

        // Find last task on this date to set default start time
        const userEntriesOnDate = timeEntries.filter(
          e => e.userId === currentUser.id && e.date === targetDate
        );
        if (userEntriesOnDate.length > 0) {
          const sorted = [...userEntriesOnDate].sort((a, b) => a.endTime.localeCompare(b.endTime));
          setStartTime(sorted[sorted.length - 1].endTime);
        } else {
          setStartTime('09:00');
        }
      }
    }
  }, [show, date, defaultDate, editingEntry, timeEntries, currentUser]);

  if (!show) return null;

  // Filter tasks to show only those explicitly assigned to the current user
  const relevantTasks = tasks.filter(t => t.assignedTo === currentUser?.id);

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
    new Date(selectedTask.etaDate) < new Date() &&
    !completedStatuses.includes(selectedTask.status)
  );

  const isEtaExceeded = isHoursExceeded || isDateExceeded;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (entryType === 'work' && !taskId) {
      toast.warning('Please select a task.');
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
    const newEnd = newStart.add(durationVal, 'hour');

    const hasOverlap = timeEntries.some(e => {
      if (editingEntry && e.id === editingEntry.id) return false;
      return (
        e.userId === currentUser?.id &&
        e.date === date &&
        dayjs(`${e.date}T${e.startTime}:00`).isBefore(newEnd) &&
        newStart.isBefore(dayjs(`${e.date}T${e.endTime}:00`))
      );
    });

    if (hasOverlap) {
      toast.warning('This time slot overlaps with an existing time entry on this date. Please enter a non-overlapping time range.');
      return;
    }

    const calculatedEndTime = newEnd.format('HH:mm');

    let entryData = {
      date,
      startTime,
      endTime: calculatedEndTime,
      duration: durationVal.toString(),
      description: entryType === 'break' ? (description || 'Break') : description,
      workCategory: entryType === 'break' ? 'Break' : workCategory,
      justification
    };

    if (entryType === 'work') {
      entryData.taskId = taskId;
      entryData.projectId = selectedTask?.projectId || '';
      entryData.taskStatus = taskStatus;
    } else {
      entryData.taskId = 'Break';
      entryData.projectId = 'Break';
    }

    if (editingEntry) {
      editTimeEntry(editingEntry.id, entryData);
    } else {
      addManualEntry(entryData);
    }
    onClose();
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
                  onClick={() => setEntryType('break')}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={entryType === 'break' 
                    ? { background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } 
                    : { color: 'var(--muted-foreground)', background: 'transparent' }}
                >
                  <Coffee size={13} /> Add Break
                </button>
              </div>

              {/* Date & Start Time */}
              <div className="keep-inline-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                      style={{ paddingLeft: '32px', width: '100%' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Start Time</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Clock size={14} style={{ position: 'absolute', left: '10px', color: 'var(--muted-foreground)' }} />
                    <input
                      type="time"
                      className="form-input"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
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
                  onChange={e => setDuration(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

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
