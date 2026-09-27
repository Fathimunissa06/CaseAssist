import { useEffect } from 'react';
import Workspace from '@/components/layout/Workspace';
import Login from '@/components/auth/Login';
import Signup from '@/components/auth/Signup';
import { useAuth } from '@/auth/AuthContext';
import { useNavigation } from '@/router/NavigationContext';
import { getRedirect, resolveRoute } from '@/router/routes';

/**
 * Route shell.
 *   /login  -> Login          (redirects to /app when signed in)
 *   /signup -> Sign Up        (redirects to /app when signed in)
 *   /app    -> Workspace      (redirects to /login when signed out)
 *   anything else -> /app or /login depending on the session
 */
export default function App() {
  const { path, navigate } = useNavigation();
  const { isAuthenticated } = useAuth();

  const route = resolveRoute(path);
  const redirectTo = getRedirect(route, isAuthenticated);

  useEffect(() => {
    if (redirectTo) navigate(redirectTo, { replace: true });
  }, [redirectTo, navigate]);

  if (redirectTo) return null;
  if (route === 'app') return <Workspace />;
  if (route === 'signup') return <Signup />;
  return <Login />;
}
