const base_url = "http://localhost:8080/api/v1";

export async function loginapi(email, password) {
    const response = await fetch(`${base_url}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            email: email,
            password: password
        })
    });
    if (!response.ok) {
        const error = new Error();
        error.status = response.status;
        throw error;
    }
    return await response.json();
}

export async function refreshapi() {
    const response = await fetch(`${base_url}/auth/refresh`, {
        method: "POST",
        
        credentials: "include"
    });
    if (!response.ok) throw new Error("refresh token failed");
    return await response.json();
}

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
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  patch:  (path, body)   => request('PATCH',  path, body),
  delete: (path, body)   => request('DELETE', path, body),
};