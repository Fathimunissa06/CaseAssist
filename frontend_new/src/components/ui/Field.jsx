import { useId } from 'react';
import { cn } from '@/utils/cn';

/** Base classes shared by inputs and textareas. */
export const controlClass = cn(
  'w-full rounded-xl border px-3.5 py-2.5 text-sm text-ink-900 transition',
  'border-ink-200/80 bg-white/65 placeholder:text-ink-400',
  'focus:border-verdigris-500 focus:bg-white/90 focus:outline-none focus:ring-4 focus:ring-verdigris-500/15',
  'dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-50 dark:placeholder:text-ink-500',
  'dark:focus:border-verdigris-400 dark:focus:bg-white/[0.07] dark:focus:ring-verdigris-400/15',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

/**
 * Label + control + hint/error wrapper.
 * `children` is a render function receiving the accessibility props for the control.
 */
export default function Field({ label, hint, error, aside, className, children }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const controlProps = {
    id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': [hint && !error ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined,
    className: cn(controlClass, error && 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/15'),
  };

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink-800 dark:text-ink-100">
          {label}
        </label>
        {aside}
      </div>
      {children(controlProps)}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
