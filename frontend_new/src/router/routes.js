export const ROUTES = {
  login: '/login',
  signup: '/signup',
  app: '/app',
};

/** Map a pathname to a route key. */
export function resolveRoute(path) {
  switch (path) {
    case ROUTES.login:
      return 'login';
    case ROUTES.signup:
      return 'signup';
    case ROUTES.app:
      return 'app';
    default:
      return 'unknown';
  }
}

/**
 * Where should this visitor be sent instead of the requested route?
 * Returns null when the requested route can be shown as-is.
 */
export function getRedirect(route, isAuthenticated) {
  if (route === 'unknown') return isAuthenticated ? ROUTES.app : ROUTES.login;
  if (route === 'app' && !isAuthenticated) return ROUTES.login;
  if ((route === 'login' || route === 'signup') && isAuthenticated) return ROUTES.app;
  return null;
}
