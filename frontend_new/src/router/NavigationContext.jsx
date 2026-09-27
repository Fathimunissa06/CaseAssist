import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Minimal History-API router. CaseAssist only has three screens, so a
 * dependency like react-router would be more weight than it is worth.
 * Note: static hosting must serve index.html for unknown paths (SPA fallback).
 */
const NavigationContext = createContext(null);

const normalize = (p) => {
  const clean = String(p || '/').split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase();
  return clean || '/';
};

export function NavigationProvider({ children }) {
  const [path, setPath] = useState(() => normalize(window.location.pathname));

  useEffect(() => {
    const sync = () => setPath(normalize(window.location.pathname));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    const next = normalize(to);
    if (normalize(window.location.pathname) !== next) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', to);
      window.scrollTo(0, 0);
    }
    setPath(next);
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used inside <NavigationProvider>');
  return ctx;
}

/** Client-side link that still works with middle-click / open-in-new-tab. */
export function Link({ to, onClick, children, ...rest }) {
  const { navigate } = useNavigation();

  const handleClick = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
