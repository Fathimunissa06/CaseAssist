import { CircleAlert, Clock, FileWarning, RefreshCw, ServerCrash, WifiOff } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

const COPY = {
  network: { icon: WifiOff, title: 'Cannot reach the server' },
  timeout: { icon: Clock, title: 'The analysis timed out' },
  validation: { icon: FileWarning, title: 'The server rejected the request' },
  server: { icon: ServerCrash, title: 'The server hit a problem' },
  empty: { icon: FileWarning, title: 'No analysis was returned' },
  client: { icon: CircleAlert, title: 'The request failed' },
  unknown: { icon: CircleAlert, title: 'Something went wrong' },
};

export default function ErrorState({ error, onRetry }) {
  const { icon: Icon, title } = COPY[error?.kind] ?? COPY.unknown;
  const hasTechnical = error?.status || error?.details;

  return (
    <GlassCard
      role="alert"
      className="border-rose-300/60 p-6 dark:border-rose-400/25 sm:p-8"
    >
      <span className="grid size-12 place-items-center rounded-xl bg-rose-500/[0.12] text-rose-600 dark:text-rose-300">
        <Icon className="size-6" aria-hidden="true" />
      </span>

      <h2 className="mt-5 font-serif text-3xl font-medium leading-tight">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-700 dark:text-ink-200">
        {error?.message ?? 'The analysis could not be completed. Try again.'}
      </p>

      <div className="mt-6">
        <Button icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      </div>

      {hasTechnical && (
        <details className="mt-6 max-w-lg text-xs text-ink-500 dark:text-ink-400">
          <summary className="cursor-pointer select-none font-medium hover:text-ink-700 dark:hover:text-ink-200">
            Technical details
          </summary>
          <dl className="mt-2 space-y-1 break-words rounded-lg bg-ink-900/[0.04] p-3 dark:bg-white/[0.04]">
            {error.status && (
              <div className="flex gap-2">
                <dt className="font-medium">Status</dt>
                <dd>{error.status}</dd>
              </div>
            )}
            {error.details && (
              <div className="flex gap-2">
                <dt className="font-medium">Detail</dt>
                <dd>{String(error.details)}</dd>
              </div>
            )}
          </dl>
        </details>
      )}
    </GlassCard>
  );
}
