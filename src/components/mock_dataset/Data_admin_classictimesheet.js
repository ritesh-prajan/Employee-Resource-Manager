export const EMPLOYEES = [
  { id: "emp-1", name: "Marcus Chen",   role: "Developer"  },
  { id: "emp-2", name: "Sarah Chen",    role: "Developer"  },
  { id: "emp-3", name: "David Miller",  role: "Employee"   },
  { id: "emp-4", name: "Vikram Mehta",  role: "Team Lead"  },
  { id: "emp-5", name: "James Okafor",  role: "Engineer"   },
];

export const PROJECT_COLORS = {
  "Project Alpha":   "#3B82F6",
  "Project Epsilon": "#EF4444",
  "Project Beta":    "#10B981",
  "Internal R&D":    "#8B5CF6",
};

// Entries keyed by employee id
export const ALL_ENTRIES = {
  "emp-1": [
    // Week May 11–17
    { id:"e-w1-1", weekId:"w1", date:"Fri 16/5", dayKey:"2026-05-16", type:"Story",  job:"Project Alpha",   task:"TASK-0010 Setup CI pipeline",         desc:"Configured GitHub Actions for staging",   start:"09:00", end:"12:00", totalHours:3,   paidBreak:0.25, unpaidBreak:0 },
    { id:"e-w1-2", weekId:"w1", date:"Fri 16/5", dayKey:"2026-05-16", type:"Story",  job:"Project Alpha",   task:"TASK-0011 Fix staging env vars",       desc:"Debugged dotenv loading issues",          start:"13:00", end:"15:30", totalHours:2.5, paidBreak:0,    unpaidBreak:0 },
    // Week May 18–24
    { id:"e-w2-1", weekId:"w2", date:"Tue 19/5", dayKey:"2026-05-19", type:"Bug",    job:"Internal R&D",    task:"TASK-0022 Fix memory leak",             desc:"Traced and resolved heap overflow",        start:"10:00", end:"13:00", totalHours:3,   paidBreak:0.25, unpaidBreak:0.25 },
    { id:"e-w2-2", weekId:"w2", date:"Thu 21/5", dayKey:"2026-05-21", type:"Review", job:"Project Beta",    task:"TASK-0025 Review PR #44",              desc:"Security audit for auth module",           start:"14:00", end:"16:00", totalHours:2,   paidBreak:0,    unpaidBreak:0 },
    // Week May 25–31
    { id:"e-w3-1", weekId:"w3", date:"Fri 29/5", dayKey:"2026-05-29", type:"Story",  job:"Project Alpha",   task:"TASK-0042 Implement JWT & OA...",      desc:"Configured tokens and cookie headers f...", start:"09:00", end:"13:30", totalHours:4.5, paidBreak:0.25, unpaidBreak:0 },
    { id:"e-w3-2", weekId:"w3", date:"Fri 29/5", dayKey:"2026-05-29", type:"Story",  job:"Project Alpha",   task:"TASK-0042 Implement JWT & OA...",      desc:"Debugging refresh token route issues",      start:"14:30", end:"16:30", totalHours:2,   paidBreak:0,    unpaidBreak:0 },
    { id:"e-w3-3", weekId:"w3", date:"Sat 30/5", dayKey:"2026-05-30", type:"R&D",    job:"Project Epsilon",  task:"TASK-0061 Migrate PostgreSQL t...",     desc:"Set up RDS connection strings and IAM ...", start:"09:00", end:"12:00", totalHours:3,   paidBreak:0,    unpaidBreak:0 },
    // Week Jun 1–7
    { id:"e-w4-1", weekId:"w4", date:"Mon 1/6",  dayKey:"2026-06-01", type:"Story",  job:"Project Alpha",   task:"TASK-0071 Build reports page",         desc:"Implemented chart components",              start:"09:00", end:"13:00", totalHours:4,   paidBreak:0.25, unpaidBreak:0 },
    { id:"e-w4-2", weekId:"w4", date:"Wed 3/6",  dayKey:"2026-06-03", type:"Bug",    job:"Project Epsilon",  task:"TASK-0074 Fix export CSV encoding",    desc:"UTF-8 BOM issue on Windows clients",         start:"10:00", end:"12:30", totalHours:2.5, paidBreak:0,    unpaidBreak:0.25 },
  ],
  "emp-2": [
    { id:"e2-1", weekId:"w3", date:"Mon 26/5", dayKey:"2026-05-26", type:"Feature", job:"Project Alpha",  task:"TASK-0031 Build dashboard",     desc:"Dashboard layout and widget grid",    start:"09:00", end:"12:00", totalHours:3,   paidBreak:0.25, unpaidBreak:0 },
    { id:"e2-2", weekId:"w3", date:"Tue 27/5", dayKey:"2026-05-27", type:"Bug",     job:"Project Alpha",  task:"TASK-0033 Fix chart render",     desc:"Canvas sizing on retina displays",    start:"14:00", end:"16:30", totalHours:2.5, paidBreak:0,    unpaidBreak:0 },
    { id:"e2-3", weekId:"w4", date:"Tue 2/6",  dayKey:"2026-06-02", type:"Story",   job:"Project Beta",   task:"TASK-0072 API pagination",       desc:"Cursor-based pagination on /events",  start:"09:00", end:"12:00", totalHours:3,   paidBreak:0.25, unpaidBreak:0 },
  ],
  "emp-3": [
    { id:"e3-1", weekId:"w3", date:"Fri 29/5", dayKey:"2026-05-29", type:"Bug",    job:"Internal R&D",  task:"TASK-0050 Audit Webpack Bundle",  desc:"Bundle size analysis and tree shaking", start:"15:00", end:"19:00", totalHours:4, paidBreak:0, unpaidBreak:0 },
    { id:"e3-2", weekId:"w3", date:"Thu 28/5", dayKey:"2026-05-28", type:"Feature",job:"Internal R&D",  task:"TASK-0048 Update dependencies",   desc:"Bumped 14 packages, resolved conflicts", start:"09:00", end:"11:00", totalHours:2, paidBreak:0, unpaidBreak:0 },
  ],
  "emp-4": [
    { id:"e4-1", weekId:"w3", date:"Fri 29/5", dayKey:"2026-05-29", type:"Review", job:"Project Alpha", task:"TASK-0049 Review auth PR",         desc:"Security review of OAuth flow",          start:"10:00", end:"12:00", totalHours:2, paidBreak:0, unpaidBreak:0 },
  ],
  "emp-5": [
    { id:"e5-1", weekId:"w3", date:"Wed 28/5", dayKey:"2026-05-28", type:"Feature",job:"Project Beta",  task:"TASK-0055 API integration",        desc:"Wired Stripe webhooks to order service",  start:"08:00", end:"16:00", totalHours:8, paidBreak:0.5, unpaidBreak:0 },
  ],
};

export const WEEKS = [
  { id:"w1", label:"May 11 - May 17", from:"2026-05-11", to:"2026-05-17",
    days:["Mon 11/5","Tue 12/5","Wed 13/5","Thu 14/5","Fri 15/5","Sat 16/5","Sun 17/5"],
    dayKeys:["2026-05-11","2026-05-12","2026-05-13","2026-05-14","2026-05-15","2026-05-16","2026-05-17"] },
  { id:"w2", label:"May 18 - May 24", from:"2026-05-18", to:"2026-05-24",
    days:["Mon 18/5","Tue 19/5","Wed 20/5","Thu 21/5","Fri 22/5","Sat 23/5","Sun 24/5"],
    dayKeys:["2026-05-18","2026-05-19","2026-05-20","2026-05-21","2026-05-22","2026-05-23","2026-05-24"] },
  { id:"w3", label:"May 25 - May 31", from:"2026-05-25", to:"2026-05-31",
    days:["Mon 25/5","Tue 26/5","Wed 27/5","Thu 28/5","Fri 29/5","Sat 30/5","Sun 31/5"],
    dayKeys:["2026-05-25","2026-05-26","2026-05-27","2026-05-28","2026-05-29","2026-05-30","2026-05-31"] },
  { id:"w4", label:"Jun 1 - Jun 7",   from:"2026-06-01", to:"2026-06-07",
    days:["Mon 1/6","Tue 2/6","Wed 3/6","Thu 4/6","Fri 5/6","Sat 6/6","Sun 7/6"],
    dayKeys:["2026-06-01","2026-06-02","2026-06-03","2026-06-04","2026-06-05","2026-06-06","2026-06-07"] },
];


