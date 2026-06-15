export const Data=[
  {
    id: "week-1", type: "week", label: "Week of May 25–31",
    dateRange: { start: new Date(2025, 4, 25), end: new Date(2025, 4, 31) },
    children: [
      {
        id: "proj-1", type: "project", label: "Project: Internal R&D",
        children: [
          {
            id: "person-1", type: "person", label: "David Miller", role: "Employee",
            children: [
              { id: "e-1", type: "entry", date: "Fri 29/5", entryType: "Bug",     task: "TASK-0050 Audit Webpack Bundle",  start: "15:00", end: "19:00", hours: 4,   children: [] },
              { id: "e-2", type: "entry", date: "Thu 28/5", entryType: "Feature", task: "TASK-0048 Update dependencies",   start: "09:00", end: "11:00", hours: 2,   children: [] },
            ],
          },
          {
            id: "person-2", type: "person", label: "Vikram Mehta", role: "Team Lead",
            children: [
              { id: "e-3", type: "entry", date: "Fri 29/5", entryType: "Review",  task: "TASK-0049 Review auth PR",        start: "10:00", end: "12:00", hours: 2,   children: [] },
            ],
          },
        ],
      },
      {
        id: "proj-2", type: "project", label: "Project: Alpha",
        children: [
          {
            id: "person-3", type: "person", label: "Sarah Chen", role: "Developer",
            children: [
              { id: "e-4", type: "entry", date: "Mon 26/5", entryType: "Feature", task: "TASK-0031 Build dashboard",       start: "09:00", end: "12:00", hours: 3,   children: [] },
              { id: "e-5", type: "entry", date: "Tue 27/5", entryType: "Bug",     task: "TASK-0033 Fix chart render",      start: "14:00", end: "16:30", hours: 2.5, children: [] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "week-2", type: "week", label: "Week of Jun 1–7",
    dateRange: { start: new Date(2025, 5, 1), end: new Date(2025, 5, 7) },
    children: [
      {
        id: "proj-4", type: "project", label: "Project: Beta",
        children: [
          {
            id: "person-5", type: "person", label: "James Okafor", role: "Engineer",
            children: [
              { id: "e-6", type: "entry", date: "Wed 4/6", entryType: "Feature", task: "TASK-0055 API integration",        start: "08:00", end: "16:00", hours: 8,   children: [] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "week-3", type: "week", label: "Week of Jun 8–14",
    dateRange: { start: new Date(2025, 5, 8), end: new Date(2025, 5, 14) },
    children: [
      {
        id: "proj-5", type: "project", label: "Project: Internal R&D",
        children: [
          {
            id: "person-6", type: "person", label: "Priya Nair", role: "Developer",
            children: [
              { id: "e-7", type: "entry", date: "Mon 9/6",  entryType: "Review",  task: "TASK-0060 Code review sprint",   start: "10:00", end: "12:00", hours: 2,   children: [] },
              { id: "e-8", type: "entry", date: "Tue 10/6", entryType: "Bug",     task: "TASK-0062 Fix login redirect",   start: "09:00", end: "11:30", hours: 2.5, children: [] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "week-4", type: "week", label: "Week of Jun 15–21",
    dateRange: { start: new Date(2025, 5, 15), end: new Date(2025, 5, 21) },
    children: [
      {
        id: "proj-6", type: "project", label: "Project: Alpha",
        children: [
          {
            id: "person-7", type: "person", label: "Sarah Chen", role: "Developer",
            children: [
              { id: "e-9",  type: "entry", date: "Wed 18/6", entryType: "Feature", task: "TASK-0070 Build reports page",  start: "09:00", end: "13:00", hours: 4,   children: [] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "week-5", type: "week", label: "Week of Jun 22–28",
    dateRange: { start: new Date(2025, 5, 22), end: new Date(2025, 5, 28) },
    children: [
      {
        id: "proj-7", type: "project", label: "Project: Beta",
        children: [
          {
            id: "person-8", type: "person", label: "David Miller", role: "Employee",
            children: [
              { id: "e-10", type: "entry", date: "Thu 26/6", entryType: "Bug",    task: "TASK-0075 Fix broken pipeline",  start: "14:00", end: "18:00", hours: 4,   children: [] },
            ],
          },
        ],
      },
    ],
  },
];
