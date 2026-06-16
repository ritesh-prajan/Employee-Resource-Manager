const BASE_URL = '/api/v1';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

async function request(method, path, body = null) {
  const options = {
    method,
    headers: defaultHeaders,
    credentials: 'include',
  };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(errorText || `Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  // Some responses (like delete) return plain text, not JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path, body)  => request('DELETE', path, body),
};

/**
 * Standalone helpers used by AuthContext for login / refresh.
 * These intentionally go through the same relative BASE_URL so that
 * Vite's proxy (dev) and the reverse-proxy (prod) both route correctly.
 */
export async function loginapi(email, password) {
  return api.post('/auth/login', { email, password });
}

export async function refreshapi() {
  return api.post('/auth/refresh', {});
}