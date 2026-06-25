/**
 * @file useAdminSettings.js
 * @description Domain hook for Admin Settings and configuration thresholds (e.g. late times, overdue counts).
 */

import { useState } from 'react';

export function useAdminSettings() {
  const [adminSettings, setAdminSettings] = useState({
    lateClockInTime: "10:00",
    etaOverdueDays: 2,
    timesheetReviewDays: 7,
    highEtaRateThreshold: 3,
    missingTimesheetPolicy: "LOP",
    morningWebhookUrl: "",
    eodWebhookUrl: ""
  });

  return {
    adminSettings,
    setAdminSettings
  };
}
