/**
 * @file leaveDetection.js
 * @description Helper functions to detect missing timesheet logs and auto-flag them as LOP or Leave.
 */

/**
 * Checks if a given date string is a weekend.
 * @param {string} dateStr - Date string in format YYYY-MM-DD
 * @returns {boolean} True if Saturday or Sunday
 */
export function isWeekend(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Returns a list of dates between startDateStr and endDateStr (inclusive) that are missing timesheet logs.
 * Excludes weekends.
 * @param {Array} timeEntries - List of all time entries
 * @param {string} employeeId - ID of the employee
 * @param {string} startDateStr - YYYY-MM-DD
 * @param {string} endDateStr - YYYY-MM-DD
 * @returns {Array<string>} List of missing date strings
 */
export function getMissingLogDays(timeEntries, employeeId, startDateStr, endDateStr) {
  const missing = [];
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const day = current.getDay();
    const isWeekendDay = (day === 0 || day === 6);
    
    if (!isWeekendDay) {
      const hasLog = timeEntries.some(
        e => String(e.userId) === String(employeeId) &&
        e.date === dateStr &&
        parseFloat(e.duration || 0) > 0
      );
      if (!hasLog) {
        missing.push(dateStr);
      }
    }
    current.setDate(current.getDate() + 1);
  }
  return missing;
}
