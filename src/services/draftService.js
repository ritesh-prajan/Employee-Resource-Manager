import { api } from './api';

const STORAGE_KEY = 'erm_task_drafts';

/**
 * Draft persistence service.
 *
 * Persists the staged tasks to the backend /api/v1/task-drafts endpoint
 * by formatting the HTML message required by Teams and embedding the structured
 * JSON metadata as an HTML comment.
 */
export const draftService = {
  /** Save the current staged-tasks array. */
  saveDrafts: async (stagedTasks, projectId, users) => {
    if (!stagedTasks || stagedTasks.length === 0) {
      await draftService.deleteDrafts();
      return;
    }

    // 1. Build the pre-formatted HTML string for Teams as specified in 17.1
    const htmlLines = stagedTasks.map(task => {
      const assignee = users.find(u => String(u.id) === String(task.assignedTo));
      const assigneeName = assignee ? assignee.name : 'Unassigned';
      
      const taskNum = task.taskNumber || (task.isNew ? 'NEW' : 'BACKLOG');
      
      const d = new Date(task.etaDate);
      const formattedDate = !isNaN(d.getTime()) 
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'N/A';
        
      return `<b>${taskNum}:</b> ${task.name} | Assigned to: ${assigneeName} (ETA: ${formattedDate})`;
    });
    
    const teamsMessage = htmlLines.join('<br/>');
    
    // 2. Embed the metadata in an HTML comment at the end so it survives refresh
    const metadata = { tasks: stagedTasks, projectId };
    const rawHtml = `${teamsMessage}<!--DRAFT_METADATA:${JSON.stringify(metadata)}-->`;
    
    try {
      await api.postRaw('/task-drafts', rawHtml, 'text/plain');
    } catch (err) {
      console.warn('Backend draft save failed, saving to localStorage:', err);
    }
    // Always keep localStorage updated as an extra layer/fallback
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
  },

  /** Load the current user's draft batch (if any). */
  loadDrafts: async () => {
    let rawDraft = null;
    try {
      // 17.2: Returns current user's active OPEN draft batch (200 OK or 204 No Content)
      const res = await api.get('/task-drafts');
      if (res && res.teamsMessage) {
        rawDraft = res;
      }
    } catch (err) {
      console.warn('Failed to load drafts from backend:', err);
    }
    
    if (rawDraft && rawDraft.teamsMessage) {
      // Extract metadata from HTML comment
      const match = rawDraft.teamsMessage.match(/<!--DRAFT_METADATA:(.*?)-->/);
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1]);
          return {
            tasks: parsed.tasks || [],
            projectId: parsed.projectId || '',
            id: rawDraft.id
          };
        } catch (e) {
          console.error('Failed to parse metadata from backend teamsMessage:', e);
        }
      }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          tasks: parsed.tasks || [],
          projectId: parsed.projectId || '',
          id: null
        };
      } catch {
        /* corrupt data — ignore */
      }
    }
    return null;
  },

  /** Delete the current user's draft (discard / abandon). */
  deleteDrafts: async () => {
    try {
      await api.delete('/task-drafts');
    } catch (err) {
      console.warn('Failed to discard draft on backend:', err);
    }
    localStorage.removeItem(STORAGE_KEY);
  },

  /** Send draft summary to Microsoft Teams. */
  sendDraftToTeams: async () => {
    const res = await api.post('/task-drafts/send');
    localStorage.removeItem(STORAGE_KEY);
    return res;
  }
};
