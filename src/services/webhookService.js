/**
 * @file webhookService.js
 * @description Client-side service to dispatch morning briefing and EOD status cards to MS Teams Webhooks.
 */

/**
 * Sends a message card to the specified MS Teams Webhook URL.
 * Handles CORS and network errors gracefully.
 */
async function sendTeamsMessage(webhookUrl, payload) {
  if (!webhookUrl) {
    throw new Error("Webhook URL is empty. Please configure it in Administration Settings.");
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Teams webhooks often don't return CORS headers, so no-cors allows sending without expecting a readable response
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Since mode is 'no-cors', we won't get status code or response body, but the promise resolves if it sends successfully.
    return { success: true, message: "Webhook payload dispatched successfully." };
  } catch (error) {
    console.error("Teams webhook dispatch failed:", error);
    throw new Error(error.message || "Failed to dispatch Teams Webhook.");
  }
}

/**
 * Format and dispatch the Morning Briefing.
 */
export async function dispatchMorningBriefing(webhookUrl, data) {
  const { staffCount, onlineCount, activeTasksCount, upcomingMeetings = [] } = data;

  const meetingLines = upcomingMeetings.length > 0 
    ? upcomingMeetings.slice(0, 5).map(m => `- **${m.title}** (${m.host}) at ${new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`).join('\n')
    : "- No meetings scheduled for today.";

  const payload = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0010AE",
    "summary": "Morning Status Briefing",
    "sections": [{
      "activityTitle": "☀️ Morning Status Briefing",
      "activitySubtitle": "Employee Resource Manager",
      "facts": [
        { "name": "Date", "value": new Date().toLocaleDateString() },
        { "name": "Online Staff", "value": `${onlineCount} / ${staffCount}` },
        { "name": "Active Tasks", "value": `${activeTasksCount} in progress` }
      ],
      "text": `### Today's Schedule:\n${meetingLines}`,
      "markdown": true
    }]
  };

  return sendTeamsMessage(webhookUrl, payload);
}

/**
 * Format and dispatch the End-of-Day (EOD) Report.
 */
export async function dispatchEodReport(webhookUrl, data) {
  const { totalHours, completedTasksCount, pendingApprovalsCount } = data;

  const payload = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0010AE",
    "summary": "🌙 End-of-Day Operations Report",
    "sections": [{
      "activityTitle": "🌙 End-of-Day Operations Report",
      "activitySubtitle": "Employee Resource Manager",
      "facts": [
        { "name": "Date", "value": new Date().toLocaleDateString() },
        { "name": "Total Hours Logged", "value": `${totalHours.toFixed(1)} hrs` },
        { "name": "Tasks Completed Today", "value": `${completedTasksCount}` },
        { "name": "Pending Approvals", "value": `${pendingApprovalsCount}` }
      ],
      "text": "Daily operations summary has been compiled and synchronized.",
      "markdown": true
    }]
  };

  return sendTeamsMessage(webhookUrl, payload);
}
