const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const SESSION_KEY = 'caseassist-auth-session';

export const DEMO_ACCOUNT = Object.freeze({
  name: 'Demo User',
  email: 'demo@caseassist.app',
  password: 'Demo@1234',
});

export class AuthError extends Error {
  constructor(message, { code = 'auth_error', field } = {}) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.field = field;
  }
}

const normalizeEmail = (email) =>
  String(email || '').trim().toLowerCase();

/* ------------------------------ helpers ------------------------------ */

async function parseResponse(response) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail =
      data?.detail ||
      data?.message ||
      'Something went wrong. Please try again.';

    let code = 'auth_error';

    if (response.status === 401) {
      code = 'invalid_credentials';
    } else if (response.status === 409) {
      code = 'email_taken';
    }

    throw new AuthError(detail, { code });
  }

  return data;
}

function saveSession(data, remember = true) {
  const session = {
    accessToken: data.access_token,
    tokenType: data.token_type || 'bearer',
    user: data.user,
  };

  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);

    const storage = remember ? localStorage : sessionStorage;

    storage.setItem(
      SESSION_KEY,
      JSON.stringify(session),
    );
  } catch {
    throw new AuthError(
      'Unable to save your login session in this browser.',
      { code: 'storage' },
    );
  }

  return session;
}

function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------- session ------------------------------ */

export function getSession() {
  try {
    for (const storage of [localStorage, sessionStorage]) {
      const raw = storage.getItem(SESSION_KEY);

      if (!raw) continue;

      const session = JSON.parse(raw);

      if (
        session?.accessToken &&
        session?.user
      ) {
        return session;
      }
    }
  } catch {
    clearStoredSession();
  }

  return null;
}

/* ------------------------------- register ----------------------------- */

export async function signUp({
  name,
  email,
  password,
  remember = true,
}) {
  const response = await fetch(
    `${API_BASE_URL}/api/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: String(name || '').trim(),
        email: normalizeEmail(email),
        password,
      }),
    },
  );

  const data = await parseResponse(response);

  return saveSession(data, remember);
}

/* -------------------------------- login ------------------------------- */

export async function logIn({
  email,
  password,
  remember = true,
}) {
  const response = await fetch(
    `${API_BASE_URL}/api/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: normalizeEmail(email),
        password,
      }),
    },
  );

  const data = await parseResponse(response);

  return saveSession(data, remember);
}

/* -------------------------------- logout ------------------------------ */

export function logOut() {
  clearStoredSession();
}

/* ----------------------------- current user --------------------------- */

export async function getCurrentUser() {
  const session = getSession();

  if (!session?.accessToken) {
    return null;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/me`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    },
  );

  if (response.status === 401) {
    clearStoredSession();
    return null;
  }

  const data = await parseResponse(response);

  return data?.user || null;
}

/* ----------------------------- auth token ----------------------------- */

export function getAccessToken() {
  return getSession()?.accessToken || null;
}

/* -------------------------- password reset ---------------------------- */

export async function requestPasswordReset() {
  throw new AuthError(
    'Password reset is not available yet.',
    { code: 'not_implemented' },
  );
}
