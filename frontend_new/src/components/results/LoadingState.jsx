import { useEffect, useState } from 'react';
import { BookOpen, Check, FileSearch, Landmark, ListChecks, Loader2, Scale, ShieldCheck } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';

const STAGES = [
  { icon: Landmark, label: 'Identifying the legal domain' },
  { icon: FileSearch, label: 'Extracting the key facts' },
  { icon: BookOpen, label: 'Retrieving relevant laws' },
  { icon: ShieldCheck, label: 'Analyzing your rights' },
  { icon: Scale, label: 'Assessing risk' },
  { icon: ListChecks, label: 'Preparing recommended actions' },
];

const STEP_MS = 1200;

export default function LoadingState({ request }) {
  const [active, setActive] = useState(0);

  // The server reports no progress, so this only paces the stages visually
  // and holds on the last one until the response arrives.
  useEffect(() => {
    const id = setInterval(() => setActive((a) => Math.min(a + 1, STAGES.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <GlassCard role="status" aria-live="polite" className="overflow-hidden p-6 sm:p-8">
      <div className="relative mb-6 h-1 overflow-hidden rounded-full bg-ink-900/10 dark:bg-white/10">
        <span className="absolute inset-y-0 left-0 w-1/3 animate-sweep rounded-full bg-verdigris-500 dark:bg-verdigris-400" />
      </div>

      <h2 className="font-serif text-3xl font-medium leading-tight">Analyzing your case</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600 dark:text-ink-300">
        {request?.caseId ? `${request.caseId} is being reviewed. ` : ''}
        Keep this tab open. Results appear here as soon as they are ready.
      </p>

      <ol className="mt-5 space-y-0.5">
        {STAGES.map(({ icon: Icon, label }, i) => {
          const state = i < active ? 'done' : i === active ? 'active' : 'pending';
          return (
            <li
              key={label}
              aria-current={state === 'active' ? 'step' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-300',
                state === 'active' && 'bg-white/60 dark:bg-white/[0.06]',
              )}
            >
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full transition-colors duration-300',
                  state === 'done' && 'bg-verdigris-600 text-white dark:bg-verdigris-400 dark:text-ink-950',
                  state === 'active' && 'bg-verdigris-500/[0.15] text-verdigris-700 dark:text-verdigris-300',
                  state === 'pending' && 'bg-ink-900/[0.05] text-ink-400 dark:bg-white/[0.05] dark:text-ink-500',
                )}
              >
                {state === 'done' ? (
                  <Check className="size-4 animate-pop" strokeWidth={3} aria-hidden="true" />
                ) : state === 'active' ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Icon className="size-3.5" aria-hidden="true" />
                )}
              </span>
              <span
                className={cn(
                  'text-sm transition-colors duration-300',
                  state === 'active' && 'font-medium text-ink-900 dark:text-white',
                  state === 'done' && 'text-ink-600 dark:text-ink-300',
                  state === 'pending' && 'text-ink-400 dark:text-ink-500',
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </GlassCard>
  );
}
