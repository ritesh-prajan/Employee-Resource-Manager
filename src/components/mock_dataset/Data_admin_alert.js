// ─────────────────────────────────────────────
// mockData.js
//
// This file holds all mock data for Teams and
// Announcements while Microsoft Graph API access
// isn't available yet.
//
// When you're ready to go live, you'll replace:
//   • MOCK_TEAMS   → GET /me/joinedTeams + GET /teams/{id}/channels
//   • MOCK_ANNOUNCEMENTS → your real database / API
// ─────────────────────────────────────────────

// ── Teams & Channels ─────────────────────────
// Shape mirrors what Microsoft Graph returns:
// { id, displayName, channels: [{ id, displayName }] }
// We use `name` here for brevity — rename to
// `displayName` when swapping to real Graph data.

export const MOCK_TEAMS = [
  {
    id: "eng",
    name: "Engineering",
    channels: [
      { id: "eng-general",  name: "General"  },
      { id: "eng-frontend", name: "Frontend" },
      { id: "eng-backend",  name: "Backend"  },
      { id: "eng-qa",       name: "QA"       },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    channels: [
      { id: "mkt-general",   name: "General"      },
      { id: "mkt-campaigns", name: "Campaigns"    },
      { id: "mkt-social",    name: "Social media" },
    ],
  },
  {
    id: "hr",
    name: "HR",
    channels: [
      { id: "hr-general",     name: "General"     },
      { id: "hr-recruitment", name: "Recruitment" },
    ],
  },
  {
    id: "product",
    name: "Product",
    channels: [
      { id: "prd-general", name: "General" },
      { id: "prd-design",  name: "Design"  },
      { id: "prd-roadmap", name: "Roadmap" },
    ],
  },
];

// ── Announcements ─────────────────────────────
// Each announcement stores:
//   teamId / channelId  → which Teams channel it was posted to
//   teamsMessageId      → returned by Graph after posting (null for now)
//
// Severity values: "info" | "warning" | "danger" | "success"

export const MOCK_ANNOUNCEMENTS = [
  {
    id: 1,
    title: "API downtime scheduled",
    content:
      "The API will be unavailable on Saturday from 2 AM to 4 AM for infrastructure upgrades. Plan accordingly and save any in-progress work beforehand.",
    severity: "warning",
    createdBy: "Alex Johnson",
    createdAt: "2026-06-15T08:00:00Z",
    // Teams destination
    teamId: "eng",
    channelId: "eng-backend",
    teamsMessageId: null, // populated after real Graph POST
  },
  {
    id: 2,
    title: "New design system shipped",
    content:
      "Version 2.0 of the component library is live. Check the Figma file for updated tokens and spacing guidelines before starting new work.",
    severity: "success",
    createdBy: "Priya Mehta",
    createdAt: "2026-06-14T10:30:00Z",
    teamId: "product",
    channelId: "prd-design",
    teamsMessageId: null,
  },
  {
    id: 3,
    title: "Office closed Monday",
    content:
      "The office will be closed on Monday for a public holiday. Remote access is available as normal — reach out on Teams if you need anything.",
    severity: "info",
    createdBy: "Sam Rivera",
    createdAt: "2026-06-13T09:00:00Z",
    // No Teams destination — internal feed only
    teamId: null,
    channelId: null,
    teamsMessageId: null,
  },
  {
    id: 4,
    title: "Security patch required",
    content:
      "All engineers must update their local dev environments with the latest security patch by end of day Friday. See the #eng-backend channel for the patch notes.",
    severity: "danger",
    createdBy: "Alex Johnson",
    createdAt: "2026-06-12T14:00:00Z",
    teamId: "eng",
    channelId: "eng-general",
    teamsMessageId: null,
  },
];
