import { useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Accessible custom checkbox. `children` is the label content. */
export default function Checkbox({ checked, onChange, error, children, className, ...props }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verdigris-500',
            checked
              ? 'border-verdigris-600 bg-verdigris-600 text-white dark:border-verdigris-400 dark:bg-verdigris-400 dark:text-ink-950'
              : 'border-ink-300 bg-white/70 dark:border-ink-500 dark:bg-white/[0.04]',
            error && !checked && 'border-rose-500',
          )}
        >
          {checked && <Check className="size-3.5 animate-pop" strokeWidth={3} />}
        </span>
        <span className="text-sm leading-snug text-ink-700 dark:text-ink-200">{children}</span>
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 pl-8 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
