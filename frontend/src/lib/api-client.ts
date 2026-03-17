// Centralized API client with JWT token management and auto-refresh

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ─── Token Storage ────────────────────────────────────────────────────────────
// Access token in memory (XSS-safe), refresh token in localStorage (survives reload)

let accessToken: string | null = null;

export function getRefreshToken(): string | null {
  return localStorage.getItem('carshares_refresh_token');
}

export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  localStorage.setItem('carshares_refresh_token', refresh);
}

export function clearTokens(): void {
  accessToken = null;
  localStorage.removeItem('carshares_refresh_token');
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ─── Error Class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(statusCode: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// ─── Token Refresh with Queue ─────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

function processRefreshQueue(error: Error | null, token: string | null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError(401, 'No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const json = await response.json();
  // Backend wraps responses in { success, data, timestamp }
  const data = json.data ?? json;
  const { accessToken: newAccess, refreshToken: newRefresh } = data;
  setTokens(newAccess, newRefresh);
  return newAccess;
}

// ─── Core Fetch Function ──────────────────────────────────────────────────────

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { body, skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Attach access token
  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchInit: RequestInit = {
    ...rest,
    headers,
  };

  // Serialize body
  if (body !== undefined) {
    fetchInit.body = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response = await fetch(url, fetchInit);

  // Handle 401 with token refresh
  if (response.status === 401 && !skipAuth && getRefreshToken()) {
    if (isRefreshing) {
      // Wait for the in-flight refresh
      try {
        const newToken = await new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        });
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...fetchInit, headers });
      } catch {
        throw new ApiError(401, 'Session expired');
      }
    } else {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        processRefreshQueue(null, newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...fetchInit, headers });
      } catch (err) {
        processRefreshQueue(err as Error, null);
        throw err;
      } finally {
        isRefreshing = false;
      }
    }
  }

  // Parse response
  const contentType = response.headers.get('content-type');
  let json: unknown;
  if (contentType?.includes('application/json')) {
    json = await response.json();
  }

  if (!response.ok) {
    const errorData = json as { message?: string | string[] } | undefined;
    let errorMessage = response.statusText;
    if (errorData?.message) {
      errorMessage = Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message;
    }
    throw new ApiError(response.status, errorMessage, json);
  }

  // Unwrap the backend's { success, data, timestamp } envelope
  const wrapped = json as { success?: boolean; data?: T } | undefined;
  if (wrapped && typeof wrapped === 'object' && 'success' in wrapped && 'data' in wrapped) {
    return wrapped.data as T;
  }

  return json as T;
}

// ─── Type-Safe HTTP Methods ───────────────────────────────────────────────────

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),

  /** Upload a file using multipart/form-data (bypasses JSON serialization) */
  uploadFile: async <T>(endpoint: string, file: File, fieldName = 'file'): Promise<T> => {
    const formData = new FormData();
    formData.append(fieldName, file);

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    // Do NOT set Content-Type — browser sets it with boundary automatically

    const url = `${API_BASE_URL}${endpoint}`;
    let response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    // Handle 401 with token refresh
    if (response.status === 401 && getRefreshToken()) {
      try {
        const newToken = await refreshAccessToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { method: 'POST', headers, body: formData });
      } catch {
        throw new ApiError(401, 'Session expired');
      }
    }

    const contentType = response.headers.get('content-type');
    let json: unknown;
    if (contentType?.includes('application/json')) {
      json = await response.json();
    }

    if (!response.ok) {
      const errorData = json as { message?: string | string[] } | undefined;
      let errorMessage = response.statusText;
      if (errorData?.message) {
        errorMessage = Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message;
      }
      throw new ApiError(response.status, errorMessage, json);
    }

    const wrapped = json as { success?: boolean; data?: T } | undefined;
    if (wrapped && typeof wrapped === 'object' && 'success' in wrapped && 'data' in wrapped) {
      return wrapped.data as T;
    }
    return json as T;
  },
};
