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
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  // Some responses (like delete) return plain text, not JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  delete: (path, body)   => request('DELETE', path, body),
};