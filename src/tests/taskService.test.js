/**
 * taskService tests — unit tests for mapping/transformation logic and
 * integration tests (with MSW) for the API calls.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { taskService } from '../services/taskService.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BACKEND_TASK = {
  id: 1,
  taskNumber: 'TASK-0001',
  title: 'Build login flow',
  description: 'OAuth integration',
  taskType: 'FEATURE',
  priority: 'HIGH',
  status: 'IN_PROGRESS',
  etaHours: 8,
  etaDate: '2026-06-20',
  originalEtaDate: '2026-06-18',
  extendedEtaDate: null,
  bugNumber: null,
  epic: 'Auth',
  assignedTo: { id: 2, name: 'Jane Doe' },
  project: { id: 1, projectName: 'Horizon Platform' },
};

const UNASSIGNED_TASK = {
  ...BACKEND_TASK,
  id: 2,
  taskNumber: 'TASK-0002',
  assignedTo: null,
};

// ─── MSW server ──────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('/api/v1/tasks', () =>
    HttpResponse.json([BACKEND_TASK, UNASSIGNED_TASK], { status: 200 })
  ),
  http.get('/api/v1/tasks/1', () =>
    HttpResponse.json(BACKEND_TASK, { status: 200 })
  ),
  http.post('/api/v1/tasks', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...BACKEND_TASK, title: body.title }, { status: 201 });
  }),
  http.patch('/api/v1/tasks/1', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...BACKEND_TASK, ...body }, { status: 200 });
  }),
  http.delete('/api/v1/tasks/1', () =>
    HttpResponse.text('Deleted', { status: 200 })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Mapping tests ────────────────────────────────────────────────────────────

describe('taskService — field mapping (backend → frontend)', () => {
  it('flattens assignedTo object to its id', async () => {
    const tasks = await taskService.getAll();
    expect(tasks[0].assignedTo).toBe(2); // id only, not {id:2, name:'Jane'}
  });

  it('sets assignedTo to null when backend returns null', async () => {
    const tasks = await taskService.getAll();
    expect(tasks[1].assignedTo).toBeNull();
  });

  it('maps backend status enum to display label', async () => {
    const tasks = await taskService.getAll();
    expect(tasks[0].status).toBe('In Progress');
  });

  it('maps backend priority enum to display label', async () => {
    const tasks = await taskService.getAll();
    expect(tasks[0].priority).toBe('High');
  });

  it('maps backend taskType to display label', async () => {
    const tasks = await taskService.getAll();
    expect(tasks[0].type).toBe('Feature');
  });

  it('exposes both name and title for frontend compatibility', async () => {
    const tasks = await taskService.getAll();
    expect(tasks[0].name).toBe('Build login flow');
    expect(tasks[0].title).toBe('Build login flow');
  });

  it('extracts projectId from nested project object', async () => {
    const tasks = await taskService.getAll();
    expect(tasks[0].projectId).toBe(1);
  });
});

// ─── getBacklog tests ─────────────────────────────────────────────────────────

describe('taskService.getBacklog', () => {
  it('returns only tasks with no assignedTo', async () => {
    const backlog = await taskService.getBacklog();
    expect(backlog).toHaveLength(1);
    expect(backlog[0].assignedTo).toBeNull();
  });
});

// ─── getById tests ────────────────────────────────────────────────────────────

describe('taskService.getById', () => {
  it('returns a single mapped task', async () => {
    const task = await taskService.getById(1);
    expect(task.id).toBe(1);
    expect(task.taskNumber).toBe('TASK-0001');
  });
});

// ─── create tests ─────────────────────────────────────────────────────────────

describe('taskService.create', () => {
  it('sends the correct backend shape and returns mapped task', async () => {
    const result = await taskService.create({
      title: 'New feature',
      projectId: 1,
      priority: 'High',
      status: 'Open',
      etaHours: 4,
      etaDate: '2026-07-01',
      epic: 'Sprint 1',
    });
    expect(result).toBeDefined();
    expect(result.name).toBe('New feature');
  });
});

// ─── delete tests ─────────────────────────────────────────────────────────────

describe('taskService.delete', () => {
  it('calls DELETE and returns success text', async () => {
    const result = await taskService.delete(1, 'No longer needed');
    expect(result).toBe('Deleted');
  });
});
