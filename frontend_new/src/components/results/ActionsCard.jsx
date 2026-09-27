import { useState } from 'react';
import { Check, ListChecks } from 'lucide-react';
import ResultSection, { EmptyNote } from './ResultSection';
import { cn } from '@/utils/cn';

const PRIORITY_STYLES = {
  high: 'bg-rose-500/[0.12] text-rose-700 dark:text-rose-300',
  medium: 'bg-amber-500/[0.14] text-amber-700 dark:text-amber-300',
  low: 'bg-ink-900/[0.06] text-ink-600 dark:bg-white/[0.08] dark:text-ink-300',
};

function ActionItem({ action, done, onToggle }) {
  return (
    <li>
      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
          'border-ink-200/70 bg-white/45 hover:bg-white/70',
          'dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]',
          done && 'opacity-70',
        )}
      >
        <input type="checkbox" checked={done} onChange={onToggle} className="peer sr-only" />
        <span
          className={cn(
            'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verdigris-500',
            done
              ? 'border-verdigris-600 bg-verdigris-600 text-white dark:border-verdigris-400 dark:bg-verdigris-400 dark:text-ink-950'
              : 'border-ink-300 bg-white/70 dark:border-ink-500 dark:bg-white/[0.04]',
          )}
          aria-hidden="true"
        >
          {done && <Check className="size-3.5 animate-pop" strokeWidth={3} />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span
              className={cn(
                'text-sm font-medium leading-snug',
                done && 'text-ink-500 line-through dark:text-ink-400',
              )}
            >
              {action.title}
            </span>
            {action.priorityLabel && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  PRIORITY_STYLES[action.priority] ?? PRIORITY_STYLES.low,
                )}
              >
                {action.priorityLabel}
              </span>
            )}
          </span>
          {action.description && (
            <span className="mt-1 block text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              {action.description}
            </span>
          )}
        </span>
      </label>
    </li>
  );
}

export default function ActionsCard({ actions, delay }) {
  const [done, setDone] = useState(() => new Set());

  const toggle = (i) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <ResultSection
      icon={ListChecks}
      title="Recommended actions"
      count={done.size > 0 ? `${done.size} of ${actions.length} done` : actions.length}
      delay={delay}
    >
      {actions.length === 0 ? (
        <EmptyNote>No actions were recommended for this case.</EmptyNote>
      ) : (
        <ul className="space-y-2.5">
          {actions.map((action, i) => (
            <ActionItem key={i} action={action} done={done.has(i)} onToggle={() => toggle(i)} />
          ))}
        </ul>
      )}
    </ResultSection>
  );
}
