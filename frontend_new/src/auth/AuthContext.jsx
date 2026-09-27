import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import * as authService from './authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() =>
    authService.getSession(),
  );

  const [loading, setLoading] = useState(true);

  /*
   * On application startup, verify the stored JWT
   * with the FastAPI backend.
   */
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const existingSession = authService.getSession();

      if (!existingSession) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const user = await authService.getCurrentUser();

        if (!mounted) return;

        if (user) {
          setSession({
            ...existingSession,
            user,
          });
        } else {
          setSession(null);
        }
      } catch {
        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const logIn = useCallback(async (credentials) => {
    const next = await authService.logIn(credentials);

    setSession(next);

    return next.user;
  }, []);

  const signUp = useCallback(async (details) => {
    const next = await authService.signUp(details);

    setSession(next);

    return next.user;
  }, []);

  const logOut = useCallback(() => {
    authService.logOut();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      loading,
      logIn,
      signUp,
      logOut,
      requestPasswordReset:
        authService.requestPasswordReset,
    }),
    [
      session,
      loading,
      logIn,
      signUp,
      logOut,
    ],
  );

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used inside <AuthProvider>',
    );
  }

  return ctx;
}
