import { Scale } from 'lucide-react';
import { cn } from '@/utils/cn';

/** CASEASSIST wordmark with the Legal Mind AI product line beneath it. */
export default function Brand({ size = 'md', className }) {
  const large = size === 'lg';
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-xl bg-ink-900 text-brass-400 ring-1 ring-brass-400/30',
          'shadow-[0_6px_18px_-8px_rgba(15,24,48,0.8)] dark:bg-ink-800',
          large ? 'size-12' : 'size-10',
        )}
      >
        <Scale className={large ? 'size-6' : 'size-5'} aria-hidden="true" />
      </span>
      <div className="leading-none">
        <p
          className={cn(
            'font-sans font-semibold tracking-[0.24em]',
            large ? 'text-[15px]' : 'text-[13px]',
          )}
        >
          CASEASSIST
        </p>
        <p
          className={cn(
            'mt-1.5 font-serif text-ink-600 dark:text-ink-300',
            large ? 'text-xl' : 'text-base',
          )}
        >
          Legal Mind AI
        </p>
      </div>
    </div>
  );
}
