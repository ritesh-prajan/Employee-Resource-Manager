# API Contract — Employee Resource Manager

> **Base URL (dev):** `http://localhost:8080/api/v1`  
> **Base URL (via Vite proxy):** `/api/v1`  
> **Auth:** HTTP-only JWT cookie (`access_token`) set on login. Refresh via `/auth/refresh`.  
> All requests that require authentication must send `credentials: 'include'`.

---

## Error Envelope

All error responses follow this shape:

```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "JWT token expired",
  "path": "/api/v1/employees",
  "timestamp": "2026-06-16T10:00:00Z"
}
```

Common status codes:
| Code | Meaning |
|------|---------|
| 400 | Validation error (body in `message`) |
| 401 | Not authenticated — call `/auth/refresh` |
| 403 | Authenticated but not authorised |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, code, etc.) |
| 500 | Internal server error |

---

## Auth

### `POST /auth/login`
Log in and receive an HTTP-only JWT cookie.

**Request**
```json
{ "email": "admin@company.com", "password": "secret" }
```

**Response 200**
```json
{
  "user": {
    "id": 1,
    "email": "admin@company.com",
    "roles": ["ADMIN"],
    "permissions": ["READ_EMPLOYEES", "WRITE_EMPLOYEES"],
    "components": ["admin-dashboard", "employees"]
  }
}
```

---

### `POST /auth/refresh`
Exchange the refresh cookie for a new access token.

**Request** — no body, uses cookie  
**Response 200** — same shape as `/auth/login`  
**Response 401** — refresh token expired; user must log in again

---

### `POST /auth/logout`
Invalidate session and clear cookies.

**Request** — empty body `{}`  
**Response 200** — plain text `"Logged out"`

---

### `POST /auth/forgot-password`
**Request** `{ "email": "user@company.com" }`  
**Response 200** — plain text `"Reset link sent"`

---

### `POST /auth/reset-password`
**Request** `{ "token": "<jwt-reset-token>", "newPassword": "NewPass123!" }`  
**Response 200** — plain text `"Password updated"`

---

## Employees

### `GET /employees`
Returns all employees.

**Response 200**
```json
[
  {
    "id": 1,
    "employeeCode": "EMP001",
    "name": "Jane Doe",
    "workEmail": "jane@company.com",
    "personalEmail": "jane@gmail.com",
    "phone": "+91 9876543210",
    "designation": "Senior Engineer",
    "status": "ACTIVE",
    "notificationPreference": "ALL",
    "profileImage": "https://...",
    "roles": ["EMPLOYEE"],
    "joiningDate": "2024-01-15"
  }
]
```

**Status enum:** `ACTIVE | INACTIVE | ON_LEAVE`

### `GET /employees/{id}` — single employee by ID
### `POST /employees` — create employee

**Request**
```json
{
  "employeeCode": "EMP042",
  "name": "John Smith",
  "workEmail": "john@company.com",
  "personalEmail": "john@gmail.com",
  "phone": "+91 9876543211",
  "designation": "Engineer",
  "status": "ACTIVE",
  "notificationPreference": "ALL",
  "profileImage": "",
  "joiningDate": "2026-06-16",
  "roles": ["EMPLOYEE"],
  "user": { "password": "TempPass123!" }
}
```

### `PUT /employees/{id}` — full update (same body, omit user.password unless resetting)
### `DELETE /employees/{id}` — soft-delete; body = plain-text reason string
### `GET /employees/{id}/teams` — teams the employee belongs to
### `GET /employees/{id}/projects` — projects the employee is assigned to
### `GET /employees/{id}/tasks` — tasks assigned to this employee

---

## Teams

### `GET /teams`
```json
[
  {
    "id": 1,
    "teamName": "Platform Team",
    "description": "Core infrastructure",
    "lead": { "id": 3, "name": "Alice" },
    "subLead": { "id": 5, "name": "Bob" },
    "teamsChannelId": "19:abc@thread.tacv2",
    "status": "ACTIVE",
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

**Status enum:** `ACTIVE | INACTIVE`

### `GET /teams/{id}` | `POST /teams` | `PUT /teams/{id}` | `DELETE /teams/{id}`
### `GET /teams/{id}/employees` — list members
### `POST /teams/{id}/employees/{employeeId}` — add member
### `DELETE /teams/{id}/employees/{employeeId}` — remove member

---

## Projects

### `GET /projects`
```json
[
  {
    "id": 1,
    "projectName": "Horizon Platform",
    "description": "...",
    "clientName": "Acme Corp",
    "colorHex": "#3B82F6",
    "startDate": "2025-06-01",
    "endDate": "2026-12-31",
    "status": "ACTIVE",
    "progressPercentage": 42
  }
]
```

**Status enum:** `ACTIVE | ON_HOLD | COMPLETED | CANCELLED`

### `GET /projects/{id}` | `POST /projects` | `PUT /projects/{id}` | `DELETE /projects/{id}`
### `GET /projects/{id}/employees` | `POST /projects/{id}/employees/{employeeId}` | `DELETE /projects/{id}/employees/{employeeId}`

---

## Tasks

### `GET /tasks`
```json
[
  {
    "id": 1,
    "taskNumber": "TASK-0001",
    "title": "Implement login flow",
    "description": "",
    "taskType": "FEATURE",
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "etaHours": 8,
    "etaDate": "2026-06-20",
    "originalEtaDate": "2026-06-18",
    "extendedEtaDate": null,
    "bugNumber": null,
    "epic": "Auth",
    "assignedTo": { "id": 2, "name": "Jane Doe" },
    "project": { "id": 1, "projectName": "Horizon Platform" }
  }
]
```

**Task type enum:** `FEATURE | BUG | STORY | RND | CRC | COC | SUPPORT | TASK | POC`  
**Priority enum:** `LOW | MEDIUM | HIGH | CRITICAL`  
**Status enum:** `OPEN | IN_PROGRESS | PENDING_REVIEW | COMPLETED | OVER_ETA | TRANSFERRED | ETA_EXTENDED | REJECTED`

### `GET /tasks/{id}` | `POST /tasks` | `PATCH /tasks/{id}` | `DELETE /tasks/{id}`
### `PATCH /tasks/{id}/unassign` — remove assignee

---

## Task Comments

### `GET /tasks/{taskId}/comments`
```json
[{ "id": 10, "commentText": "Started working on this.", "author": { "id": 2, "name": "Jane" }, "createdAt": "2026-06-15T09:30:00Z" }]
```

### `POST /task-comments`
```json
{ "task": { "id": 1 }, "author": { "id": 2 }, "commentText": "Blocked by infra issue." }
```

### `DELETE /task-comments/{id}`

---

## Task Progress

### `GET /tasks/{taskId}/progress`
```json
[{ "id": 5, "progressPercentage": 60, "notes": "UI done, wiring backend", "employee": { "id": 2 }, "createdAt": "2026-06-15T11:00:00Z" }]
```

### `POST /task-progress`
```json
{ "task": { "id": 1 }, "employee": { "id": 2 }, "progressPercentage": 75, "notes": "Almost done" }
```

### `DELETE /task-progress/{id}`

---

## Timesheets *(Planned — Sprint 2)*

A timesheet entry = one clock-in/out session logged against a task.

### `GET /timesheets` — query params: `?employeeId=&date=&status=`
```json
[{
  "id": 1,
  "employee": { "id": 2 },
  "task": { "id": 5 },
  "project": { "id": 1 },
  "date": "2026-06-16",
  "startTime": "09:00",
  "endTime": "11:30",
  "durationHours": 2.5,
  "workCategory": "STORY",
  "description": "Implemented search filter",
  "justification": "",
  "status": "PENDING"
}]
```

**Status enum:** `PENDING | APPROVED | REJECTED`  
**Work category enum:** `STORY | BUG | FEATURE | SUPPORT | MEETING | ADMIN`

### `POST /timesheets` — body matches shape above (without id/status)
### `PATCH /timesheets/{id}/status` — body: `{ "status": "APPROVED", "managerComment": "" }`
### `DELETE /timesheets/{id}`

---

## Attendance *(Planned — Sprint 2)*

### `GET /attendance` — query params: `?employeeId=&date=`
```json
[{
  "id": 1,
  "employee": { "id": 2 },
  "date": "2026-06-16",
  "clockIn": "2026-06-16T09:02:00Z",
  "clockOut": "2026-06-16T18:05:00Z",
  "totalWorkHours": 8.5,
  "totalBreakHours": 0.75,
  "status": "PRESENT",
  "clockStatus": "OFFLINE"
}]
```

**Status enum:** `PRESENT | ABSENT | HALF_DAY | ON_LEAVE`  
**Clock status enum:** `CLOCKED_IN | ON_BREAK | OFFLINE`

### `POST /attendance/clock-in` — body: `{ "employee": { "id": 2 } }`
### `PATCH /attendance/clock-out` — body: `{ "employee": { "id": 2 } }`
### `GET /attendance/employee/{employeeId}` — all records for one employee

---

## Meetings *(Planned — Sprint 2)*

### `GET /meetings` — query params: `?organizerId=&status=&date=`
```json
[{
  "id": 1,
  "title": "Sprint Planning",
  "description": "Q3 Sprint 1",
  "startTime": "2026-06-17T10:00:00Z",
  "endTime": "2026-06-17T11:00:00Z",
  "organizer": { "id": 3, "name": "Alice" },
  "attendees": [{ "id": 2 }, { "id": 5 }],
  "meetingLink": "https://teams.microsoft.com/...",
  "status": "SCHEDULED"
}]
```

**Status enum:** `SCHEDULED | COMPLETED | CANCELLED`

### `POST /meetings` — body: title, description, startTime, endTime, organizer `{id}`, meetingLink, status
### `PUT /meetings/{id}` — full update
### `DELETE /meetings/{id}` — soft-delete
### `POST /meetings/{id}/attendees/{employeeId}` — add attendee
### `DELETE /meetings/{id}/attendees/{employeeId}` — remove attendee
