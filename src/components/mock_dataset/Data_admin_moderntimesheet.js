import moment from "moment";
// Add to each item in your schedule array — update makeItem and the schedule:
function makeItem(groupId, day, startHour, startMin, endHour, endMin, type, label) {
  const d = day.clone();
  return {
    id: String(itemId++),
    group: groupId,
    title: label,
    type,
    start: d.clone().hour(startHour).minute(startMin).second(0).valueOf(),
    end:   d.clone().hour(endHour).minute(endMin).second(0).valueOf(),
    // ── Popup fields ──
    taskTitle: getTaskTitle(type),       // we'll define this below
    category: getCategory(groupId),
    description: getDescription(type),
  };
}

// Add these helpers above makeItem:
const TASK_TITLES = {
  completed: [
    "Set up CI/CD pipeline & Staging ENV",
    "Code review & merge PR #42",
    "Database schema migration",
    "Fix authentication bug",
    "Deploy hotfix to production",
    "Write unit tests for API layer",
    "Refactor payment module",
    "Update documentation",
  ],
  pending: [
    "Implement dashboard analytics",
    "Design new onboarding flow",
    "API integration with Stripe",
    "Performance audit & optimization",
    "Mobile responsive fixes",
    "Security vulnerability patch",
    "Feature flag implementation",
    "Load testing & benchmarks",
  ],
  break: ["Lunch break", "Coffee break", "Short break"],
};

const CATEGORIES = ["R&D", "Design", "DevOps", "QA", "Backend", "Frontend", "Management"];
const DESCRIPTIONS = {
  completed: [
    "Wrote Github actions and configured AWS ECS task definitions",
    "Reviewed 3 PRs, left comments, approved and merged to main",
    "Ran migration scripts across staging and production databases",
    "Traced and fixed token expiry bug in auth middleware",
  ],
  pending: [
    "Waiting on design assets before implementation can start",
    "Blocked by API credentials from third-party vendor",
    "In progress — ~60% complete, targeting end of sprint",
    "Scheduled for this afternoon after standup",
  ],
  break: ["Scheduled break", "Away from desk"],
};

function getRandom(arr, seed) {
  return arr[seed % arr.length];
}

function getTaskTitle(type) {
  const pool = TASK_TITLES[type] ?? TASK_TITLES.pending;
  return getRandom(pool, Math.floor(Math.random() * pool.length));
}

function getCategory(groupId) {
  return getRandom(CATEGORIES, parseInt(groupId));
}

function getDescription(type) {
  const pool = DESCRIPTIONS[type] ?? DESCRIPTIONS.pending;
  return getRandom(pool, Math.floor(Math.random() * pool.length));
}

// ─── Staff members ────────────────────────────────────────────────────────────
const STAFF = [
  { id: "1",  title: "Alex Rivera",    initials: "AR", role: "Team Lead" },
  { id: "2",  title: "Vikram Mehta",   initials: "VM", role: "Team Lead" },
  { id: "3",  title: "Marcus Chen",    initials: "MC", role: "Employee" },
  { id: "4",  title: "Elena Rostova",  initials: "ER", role: "Employee" },
  { id: "5",  title: "Liam O'Connor",  initials: "LO", role: "Employee" },
  { id: "6",  title: "Sarah Johnson",  initials: "SJ", role: "Employee" },
  { id: "7",  title: "Daniel Brown",   initials: "DB", role: "Employee" },
  { id: "8",  title: "Emma Wilson",    initials: "EW", role: "Senior Dev" },
  { id: "9",  title: "Michael Lee",    initials: "ML", role: "Senior Dev" },
  { id: "10", title: "Priya Sharma",   initials: "PS", role: "Designer" },
  { id: "11", title: "James Carter",   initials: "JC", role: "Designer" },
  { id: "12", title: "Nora Kim",       initials: "NK", role: "QA" },
  { id: "13", title: "Omar Hassan",    initials: "OH", role: "QA" },
  { id: "14", title: "Sophie Turner",  initials: "ST", role: "DevOps" },
  { id: "15", title: "Raj Patel",      initials: "RP", role: "DevOps" },
  { id: "16", title: "Chloe Martin",   initials: "CM", role: "Employee" },
  { id: "17", title: "Ben Nguyen",     initials: "BN", role: "Employee" },
  { id: "18", title: "Aisha Okafor",   initials: "AO", role: "Senior Dev" },
  { id: "19", title: "Luis Fernandez", initials: "LF", role: "Employee" },
  { id: "20", title: "Mei Zhang",      initials: "MZ", role: "Designer" },
];

// Task type controls the color in your itemRenderer
// "completed" → green   "pending" → blue   "break" → yellow
const TASK_TYPES = ["completed", "pending", "break"];

// ─── Helper: create one item ──────────────────────────────────────────────────
let itemId = 1;


// ─── Helper: compute label from hours ────────────────────────────────────────
function hrs(startH, startM, endH, endM) {
  const h = (endH * 60 + endM - startH * 60 - startM) / 60;
  return `${h % 1 === 0 ? h.toFixed(1) : h.toFixed(1)}h`;
}

export default function TimelineData() {
  // Build groups with dynamic subtitle
  const groups = STAFF.map((s) => ({
    ...s,
    subtitle: s.role,
  }));

  const today = moment().startOf("day");
  const items = [];

  // ─── Spread data across ±15 days so all views have data ──────────────────
  // Format: [staffId, offsetDays, startH, startM, endH, endM, type]
  const schedule = [
    // ── Today (offset 0) ──────────────────────────────────────────────────
    ["1",  0,  10, 0,  14, 0,  "completed"],
    ["1",  0,  14, 30, 15, 30, "break"],
    ["1",  0,  15, 30, 18, 0,  "pending"],
    ["2",  0,  9,  0,  12, 0,  "completed"],
    ["2",  0,  13, 0,  16, 0,  "pending"],
    ["3",  0,  8,  30, 13, 0,  "completed"],
    ["3",  0,  14, 0,  16, 0,  "pending"],
    ["4",  0,  10, 0,  11, 0,  "break"],
    ["4",  0,  11, 0,  15, 30, "completed"],
    ["5",  0,  9,  30, 11, 30, "pending"],
    ["6",  0,  11, 0,  16, 0,  "completed"],
    ["7",  0,  13, 0,  16, 30, "pending"],
    ["8",  0,  8,  0,  12, 0,  "completed"],
    ["8",  0,  12, 0,  12, 30, "break"],
    ["8",  0,  12, 30, 15, 0,  "completed"],
    ["9",  0,  12, 0,  16, 30, "pending"],
    ["10", 0,  9,  0,  15, 0,  "completed"],
    ["11", 0,  10, 0,  14, 0,  "pending"],
    ["12", 0,  8,  0,  11, 0,  "completed"],
    ["12", 0,  11, 0,  11, 30, "break"],
    ["12", 0,  11, 30, 14, 0,  "pending"],
    ["13", 0,  9,  0,  13, 0,  "completed"],
    ["14", 0,  10, 30, 15, 30, "pending"],
    ["15", 0,  8,  0,  10, 0,  "completed"],
    ["15", 0,  10, 0,  10, 30, "break"],
    ["15", 0,  10, 30, 14, 0,  "pending"],
    ["16", 0,  11, 0,  17, 0,  "completed"],
    ["17", 0,  9,  0,  12, 30, "pending"],
    ["18", 0,  8,  30, 13, 30, "completed"],
    ["18", 0,  13, 30, 14, 0,  "break"],
    ["18", 0,  14, 0,  17, 0,  "pending"],
    ["19", 0,  10, 0,  15, 0,  "completed"],
    ["20", 0,  9,  30, 14, 30, "pending"],

    // ── Yesterday (-1) ────────────────────────────────────────────────────
    ["1",  -1, 9,  0,  13, 0,  "completed"],
    ["2",  -1, 10, 0,  14, 30, "completed"],
    ["3",  -1, 8,  0,  12, 0,  "completed"],
    ["3",  -1, 13, 0,  15, 0,  "pending"],
    ["4",  -1, 9,  30, 14, 30, "completed"],
    ["5",  -1, 10, 0,  13, 0,  "completed"],
    ["6",  -1, 8,  30, 11, 30, "completed"],
    ["6",  -1, 11, 30, 12, 0,  "break"],
    ["6",  -1, 12, 0,  16, 0,  "pending"],
    ["7",  -1, 9,  0,  14, 0,  "completed"],
    ["8",  -1, 8,  0,  16, 0,  "completed"],
    ["9",  -1, 11, 0,  15, 30, "pending"],
    ["10", -1, 9,  0,  13, 0,  "completed"],
    ["11", -1, 10, 30, 15, 0,  "pending"],
    ["12", -1, 8,  0,  12, 0,  "completed"],
    ["13", -1, 9,  30, 14, 0,  "pending"],
    ["14", -1, 10, 0,  16, 0,  "completed"],
    ["15", -1, 8,  30, 13, 30, "completed"],
    ["16", -1, 9,  0,  14, 0,  "pending"],
    ["17", -1, 10, 0,  15, 0,  "completed"],
    ["18", -1, 8,  0,  14, 0,  "completed"],
    ["19", -1, 9,  30, 13, 30, "pending"],
    ["20", -1, 10, 0,  15, 30, "completed"],

    // ── -2 days ───────────────────────────────────────────────────────────
    ["1",  -2, 10, 0,  15, 0,  "completed"],
    ["2",  -2, 9,  0,  12, 0,  "pending"],
    ["3",  -2, 8,  30, 11, 30, "completed"],
    ["4",  -2, 10, 0,  14, 0,  "completed"],
    ["5",  -2, 9,  0,  13, 30, "pending"],
    ["6",  -2, 11, 0,  15, 0,  "completed"],
    ["7",  -2, 8,  0,  12, 30, "break"],
    ["7",  -2, 12, 30, 16, 0,  "pending"],
    ["8",  -2, 9,  0,  14, 0,  "completed"],
    ["9",  -2, 10, 30, 15, 30, "completed"],
    ["10", -2, 8,  30, 13, 0,  "pending"],
    ["11", -2, 9,  0,  14, 0,  "completed"],
    ["12", -2, 10, 0,  15, 30, "pending"],
    ["13", -2, 8,  0,  13, 0,  "completed"],
    ["14", -2, 9,  30, 14, 30, "pending"],
    ["15", -2, 10, 0,  16, 0,  "completed"],
    ["16", -2, 8,  30, 12, 0,  "completed"],
    ["17", -2, 9,  0,  14, 30, "pending"],
    ["18", -2, 8,  0,  13, 0,  "completed"],
    ["19", -2, 10, 30, 15, 0,  "pending"],
    ["20", -2, 9,  0,  14, 0,  "completed"],

    // ── -3 days ───────────────────────────────────────────────────────────
    ["1",  -3, 9,  0,  14, 0,  "completed"],
    ["2",  -3, 10, 30, 15, 30, "completed"],
    ["3",  -3, 8,  0,  12, 30, "pending"],
    ["5",  -3, 9,  30, 13, 0,  "completed"],
    ["6",  -3, 10, 0,  15, 0,  "completed"],
    ["8",  -3, 8,  30, 14, 0,  "completed"],
    ["9",  -3, 11, 0,  16, 0,  "pending"],
    ["10", -3, 9,  0,  13, 30, "completed"],
    ["12", -3, 8,  0,  12, 0,  "completed"],
    ["14", -3, 10, 0,  15, 0,  "pending"],
    ["15", -3, 9,  30, 14, 30, "completed"],
    ["17", -3, 8,  30, 13, 0,  "pending"],
    ["18", -3, 9,  0,  15, 0,  "completed"],
    ["20", -3, 10, 30, 16, 0,  "pending"],

    // ── -4 days ───────────────────────────────────────────────────────────
    ["1",  -4, 10, 0,  15, 30, "completed"],
    ["2",  -4, 9,  0,  13, 0,  "pending"],
    ["3",  -4, 8,  30, 14, 0,  "completed"],
    ["4",  -4, 10, 0,  15, 0,  "completed"],
    ["6",  -4, 9,  0,  12, 30, "completed"],
    ["7",  -4, 10, 30, 16, 0,  "pending"],
    ["8",  -4, 8,  0,  13, 30, "completed"],
    ["9",  -4, 11, 0,  15, 0,  "completed"],
    ["11", -4, 9,  30, 14, 30, "pending"],
    ["13", -4, 8,  0,  12, 0,  "completed"],
    ["16", -4, 10, 0,  15, 30, "pending"],
    ["19", -4, 9,  0,  14, 0,  "completed"],

    // ── -5 days ───────────────────────────────────────────────────────────
    ["2",  -5, 10, 0,  14, 0,  "completed"],
    ["3",  -5, 9,  30, 13, 30, "pending"],
    ["5",  -5, 8,  0,  12, 30, "completed"],
    ["6",  -5, 10, 30, 15, 30, "completed"],
    ["8",  -5, 9,  0,  14, 0,  "completed"],
    ["10", -5, 8,  30, 13, 0,  "pending"],
    ["12", -5, 10, 0,  15, 0,  "completed"],
    ["14", -5, 9,  0,  13, 30, "pending"],
    ["15", -5, 10, 30, 16, 0,  "completed"],
    ["17", -5, 8,  0,  12, 0,  "pending"],
    ["18", -5, 9,  30, 15, 0,  "completed"],
    ["20", -5, 10, 0,  14, 30, "completed"],

    // ── -6 days ───────────────────────────────────────────────────────────
    ["1",  -6, 9,  0,  13, 30, "completed"],
    ["4",  -6, 10, 0,  15, 0,  "pending"],
    ["7",  -6, 8,  30, 14, 0,  "completed"],
    ["9",  -6, 9,  0,  13, 0,  "completed"],
    ["11", -6, 10, 30, 15, 30, "pending"],
    ["13", -6, 8,  0,  12, 30, "completed"],
    ["16", -6, 9,  30, 14, 30, "completed"],
    ["19", -6, 10, 0,  15, 0,  "pending"],

    // ── +1 day ────────────────────────────────────────────────────────────
    ["1",  1,  9,  0,  12, 0,  "pending"],
    ["2",  1,  10, 0,  14, 0,  "pending"],
    ["3",  1,  8,  30, 13, 0,  "pending"],
    ["4",  1,  9,  0,  12, 30, "pending"],
    ["5",  1,  10, 30, 15, 0,  "pending"],
    ["6",  1,  9,  0,  14, 0,  "pending"],
    ["7",  1,  8,  0,  12, 0,  "pending"],
    ["8",  1,  9,  30, 15, 30, "pending"],
    ["9",  1,  10, 0,  14, 30, "pending"],
    ["10", 1,  8,  30, 13, 30, "pending"],
    ["11", 1,  9,  0,  14, 0,  "pending"],
    ["12", 1,  10, 0,  15, 0,  "pending"],
    ["13", 1,  8,  0,  12, 30, "pending"],
    ["14", 1,  9,  30, 14, 30, "pending"],
    ["15", 1,  10, 0,  16, 0,  "pending"],

    // ── +2 days ───────────────────────────────────────────────────────────
    ["1",  2,  10, 0,  15, 0,  "pending"],
    ["3",  2,  9,  0,  13, 30, "pending"],
    ["5",  2,  8,  30, 12, 0,  "pending"],
    ["8",  2,  10, 0,  16, 0,  "pending"],
    ["10", 2,  9,  30, 14, 0,  "pending"],
    ["12", 2,  8,  0,  13, 0,  "pending"],
    ["15", 2,  10, 30, 15, 30, "pending"],
    ["18", 2,  9,  0,  14, 30, "pending"],
    ["20", 2,  10, 0,  15, 0,  "pending"],

    // ── +3 to +7 (lighter future data) ───────────────────────────────────
    ["1",  3,  9,  0,  14, 0,  "pending"],
    ["2",  3,  10, 0,  15, 0,  "pending"],
    ["4",  3,  9,  30, 13, 30, "pending"],
    ["6",  3,  8,  0,  12, 0,  "pending"],
    ["8",  3,  10, 30, 16, 0,  "pending"],
    ["10", 3,  9,  0,  14, 0,  "pending"],
    ["13", 3,  8,  30, 13, 0,  "pending"],
    ["16", 3,  10, 0,  15, 30, "pending"],

    ["2",  4,  9,  0,  13, 0,  "pending"],
    ["5",  4,  10, 0,  15, 0,  "pending"],
    ["7",  4,  8,  30, 14, 0,  "pending"],
    ["9",  4,  9,  30, 14, 30, "pending"],
    ["11", 4,  10, 0,  16, 0,  "pending"],
    ["14", 4,  8,  0,  13, 0,  "pending"],
    ["17", 4,  9,  0,  14, 0,  "pending"],
    ["20", 4,  10, 30, 15, 30, "pending"],

    ["1",  5,  10, 0,  15, 0,  "pending"],
    ["3",  5,  9,  0,  14, 0,  "pending"],
    ["6",  5,  8,  30, 13, 30, "pending"],
    ["8",  5,  10, 0,  16, 0,  "pending"],
    ["12", 5,  9,  0,  14, 0,  "pending"],
    ["15", 5,  8,  0,  12, 30, "pending"],
    ["18", 5,  10, 30, 15, 30, "pending"],

    ["2",  6,  9,  30, 14, 0,  "pending"],
    ["4",  6,  10, 0,  15, 0,  "pending"],
    ["7",  6,  8,  0,  13, 0,  "pending"],
    ["9",  6,  9,  0,  14, 30, "pending"],
    ["13", 6,  10, 30, 16, 0,  "pending"],
    ["16", 6,  8,  30, 13, 30, "pending"],
    ["19", 6,  9,  0,  14, 0,  "pending"],

    ["1",  7,  10, 0,  15, 0,  "pending"],
    ["3",  7,  9,  30, 14, 30, "pending"],
    ["5",  7,  8,  0,  12, 0,  "pending"],
    ["8",  7,  10, 0,  16, 30, "pending"],
    ["10", 7,  9,  0,  14, 0,  "pending"],
    ["14", 7,  8,  30, 13, 0,  "pending"],
    ["17", 7,  10, 30, 15, 30, "pending"],
    ["20", 7,  9,  0,  14, 0,  "pending"],
  ];

  // Build items from schedule
  schedule.forEach(([groupId, offset, sh, sm, eh, em, type]) => {
    const day = today.clone().add(offset, "days");
    const label = hrs(sh, sm, eh, em);
    items.push(makeItem(groupId, day, sh, sm, eh, em, type, label));
  });

  return { groups, items };
}