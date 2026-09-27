import axios from 'axios';

/**
 * Empty string is valid: it makes requests relative, which lets the Vite dev
 * proxy forward /api to the backend (no CORS setup needed).
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 120_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/** Error with a category the UI can use to pick copy and icons. */
export class ApiError extends Error {
  constructor(message, { kind = 'unknown', status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind; // 'network' | 'timeout' | 'validation' | 'server' | 'client' | 'empty' | 'unknown'
    this.status = status;
    this.details = details;
  }
}

/** FastAPI returns `detail` as a string or as a list of { loc, msg } objects. */
function readDetail(data) {
  const detail = data?.detail ?? data?.message ?? data?.error;
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d?.loc) ? d.loc.filter((p) => p !== 'body').join('.') : '';
        const msg = d?.msg ?? (typeof d === 'string' ? d : '');
        return field ? `${field}: ${msg}` : msg;
      })
      .filter(Boolean)
      .join('; ');
  }
  try {
    return JSON.stringify(detail);
  } catch {
    return '';
  }
}

export function toApiError(error) {
  if (error instanceof ApiError) return error;

  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return new ApiError(
      'The server did not answer in time. Try again, or shorten the description.',
      { kind: 'timeout' },
    );
  }

  if (!error?.response) {
    const target = API_BASE_URL || 'the API proxy (localhost:8000)';
    return new ApiError(
      `Could not connect to ${target}. Make sure the backend is running and that it allows requests from this origin (CORS).`,
      { kind: 'network', details: error?.message },
    );
  }

  const { status, data } = error.response;
  const detail = readDetail(data);

  if (status === 400 || status === 422) {
    return new ApiError(
      detail
        ? `The server rejected the request. ${detail}`
        : 'The server rejected the request. Check the case ID, title and description, then try again.',
      { kind: 'validation', status, details: detail },
    );
  }
  if (status === 404) {
    return new ApiError(
      'The analysis endpoint was not found. Confirm the backend exposes POST /api/analyze.',
      { kind: 'client', status, details: detail },
    );
  }
  if (status === 429) {
    return new ApiError('Too many requests. Wait a moment, then try again.', {
      kind: 'client',
      status,
      details: detail,
    });
  }
  if (status >= 500) {
    return new ApiError(
      'The server hit a problem while analyzing this case. Try again in a moment.',
      { kind: 'server', status, details: detail },
    );
  }
  return new ApiError(detail || `Request failed with status ${status}.`, {
    kind: 'client',
    status,
    details: detail,
  });
}

apiClient.interceptors.request.use(
  (config) => {
    try {
      const rawSession =
        localStorage.getItem('caseassist-auth-session') ||
        sessionStorage.getItem('caseassist-auth-session');

      if (rawSession) {
        const session = JSON.parse(rawSession);

        if (session?.accessToken) {
          config.headers.Authorization =
            `Bearer ${session.accessToken}`;
        }
      }
    } catch {
      // Ignore invalid stored session.
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Let cancellations pass through untouched so callers can ignore them.
    if (axios.isCancel(error)) return Promise.reject(error);
    return Promise.reject(toApiError(error));
  },
);

export const isAbortError = (err) =>
  axios.isCancel(err) || err?.name === 'AbortError' || err?.name === 'CanceledError';
