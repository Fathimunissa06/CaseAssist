import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { cn } from '@/utils/cn';

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

/** Profile button with a dropdown containing the signed-in user and Log out. */
export default function UserMenu() {
  const { user, logOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const logoutRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    logoutRef.current?.focus();

    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={cn(
          'flex h-10 items-center gap-2 rounded-xl border pl-1.5 pr-2.5 transition-colors',
          'border-ink-200/80 bg-white/60 hover:bg-white/90',
          'dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.1]',
        )}
      >
        <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-verdigris-400 to-verdigris-700 text-xs font-semibold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden max-w-[9rem] truncate text-sm font-medium md:block">{user.name}</span>
        <ChevronDown
          className={cn('size-4 text-ink-500 transition-transform dark:text-ink-400', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className={cn(
            'absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border backdrop-blur-xl',
            'border-white/80 bg-white/90 shadow-[0_18px_50px_-18px_rgba(15,24,48,0.45)]',
            'dark:border-white/10 dark:bg-ink-900/90 dark:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.8)]',
          )}
        >
          <div className="border-b border-ink-200/70 px-4 py-3 dark:border-white/10">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user.email}</p>
          </div>
          <div className="p-1.5">
            <button
              ref={logoutRef}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-900/5 dark:text-ink-200 dark:hover:bg-white/[0.07]"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
