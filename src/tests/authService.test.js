/**
 * authService tests — uses MSW to intercept fetch and test the service layer
 * against the real api.js client (no manual mock of fetch).
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { loginapi, refreshapi } from '../services/api.js';

// ─── MSW server ──────────────────────────────────────────────────────────────

const USER_FIXTURE = {
  id: 1,
  email: 'admin@company.com',
  roles: ['ADMIN'],
  permissions: ['READ_EMPLOYEES'],
  components: ['admin-dashboard'],
};

const server = setupServer(
  // Happy path: login
  http.post('/api/v1/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    if (email === 'admin@company.com' && password === 'secret') {
      return HttpResponse.json({ user: USER_FIXTURE }, { status: 200 });
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  // Happy path: refresh
  http.post('/api/v1/auth/refresh', () => {
    return HttpResponse.json({ user: USER_FIXTURE }, { status: 200 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── loginapi tests ───────────────────────────────────────────────────────────

describe('loginapi', () => {
  it('returns user object on successful login', async () => {
    const result = await loginapi('admin@company.com', 'secret');
    expect(result).toEqual({ user: USER_FIXTURE });
  });

  it('throws an error with status 401 on bad credentials', async () => {
    let caught;
    try {
      await loginapi('wrong@example.com', 'wrong');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught.status).toBe(401);
  });

  it('error message comes from server response body', async () => {
    let caught;
    try {
      await loginapi('wrong@example.com', 'wrong');
    } catch (err) {
      caught = err;
    }
    expect(caught.message).toMatch(/Invalid credentials/i);
  });
});

// ─── refreshapi tests ─────────────────────────────────────────────────────────

describe('refreshapi', () => {
  it('returns user object when refresh token is valid', async () => {
    const result = await refreshapi();
    expect(result).toEqual({ user: USER_FIXTURE });
  });

  it('throws when refresh endpoint returns 401', async () => {
    server.use(
      http.post('/api/v1/auth/refresh', () =>
        HttpResponse.json({ message: 'Refresh token expired' }, { status: 401 })
      )
    );
    let caught;
    try {
      await refreshapi();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught.status).toBe(401);
  });
});
