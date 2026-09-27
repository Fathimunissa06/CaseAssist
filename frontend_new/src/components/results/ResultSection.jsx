import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';

/** Shared frame for every result block: icon, serif title, optional count. */
export default function ResultSection({ icon: Icon, title, count, delay = 0, className, children }) {
  return (
    <GlassCard
      className={cn('animate-reveal p-5 sm:p-6', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="mb-4 flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-verdigris-500/[0.12] text-verdigris-700 dark:bg-verdigris-400/[0.12] dark:text-verdigris-300">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <h3 className="font-serif text-lg font-semibold leading-tight">{title}</h3>
        {count !== undefined && count !== null && (
          <span className="ml-auto rounded-full bg-ink-900/[0.06] px-2.5 py-0.5 text-xs font-medium text-ink-600 dark:bg-white/[0.08] dark:text-ink-300">
            {count}
          </span>
        )}
      </header>
      {children}
    </GlassCard>
  );
}

export function EmptyNote({ children }) {
  return <p className="text-sm text-ink-500 dark:text-ink-400">{children}</p>;
}
