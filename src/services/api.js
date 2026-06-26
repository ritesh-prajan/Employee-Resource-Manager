const PROD_URL = 'https://api.elitecorp.in/api/v1';
const LOCAL_URL = 'http://localhost:8080/api/v1';
let activeBaseUrl = import.meta.env.VITE_API_URL || LOCAL_URL;

const defaultHeaders = {
  'Content-Type': 'application/json',
};

async function request(method, path, body = null, isRaw = false, contentType = 'application/json') {
  const options = {
    method,
    headers: isRaw ? { 'Content-Type': contentType } : defaultHeaders,
    credentials: 'include',
  };

  if (body !== null) {
    options.body = isRaw ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${activeBaseUrl}${path}`, options);

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(errorText || `Request failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const responseContentType = response.headers.get('content-type');
    if (responseContentType && responseContentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  } catch (err) {
    // If the local backend is not running/unreachable, switch to production API and retry
    if (
      activeBaseUrl === LOCAL_URL &&
      (err.name === 'TypeError' ||
        err.message?.includes('Failed to fetch') ||
        err.status === 502 ||
        err.status === 504)
    ) {
      console.warn('Local API on 8080 is unreachable. Falling back to Production API...');
      activeBaseUrl = PROD_URL;
      return request(method, path, body, isRaw, contentType);
    }
    throw err;
  }
}

export const api = {
  get:     (path)        => request('GET',    path),
  post:    (path, body)  => request('POST',   path, body),
  postRaw: (path, body, contentType) => request('POST', path, body, true, contentType),
  put:     (path, body)  => request('PUT',    path, body),
  patch:   (path, body)  => request('PATCH',  path, body),
  delete:  (path, body)  => request('DELETE', path, body),
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