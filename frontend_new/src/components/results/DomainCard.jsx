import { useEffect, useState } from 'react';
import { Check, Copy, Hash, RotateCcw } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { formatReport } from '@/utils/formatReport';

export default function DomainCard({ request, analysis, onReset }) {
  const { domain } = analysis;
  const [copyState, setCopyState] = useState('idle'); // 'idle' | 'copied' | 'failed'

  useEffect(() => {
    if (copyState === 'idle') return undefined;
    const t = setTimeout(() => setCopyState('idle'), 2200);
    return () => clearTimeout(t);
  }, [copyState]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatReport(request, analysis));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <GlassCard className="animate-reveal p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-ink-900/[0.06] px-2 py-1 text-xs font-medium text-ink-700 dark:bg-white/[0.08] dark:text-ink-200">
          <Hash className="size-3.5" aria-hidden="true" />
          {request?.caseId}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={copyState === 'copied' ? Check : Copy}
            onClick={handleCopy}
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy summary'}
          </Button>
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={onReset}>
            Clear results
          </Button>
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-600 dark:text-ink-300">{request?.title}</p>

      <div className="mt-5">
        <p className="text-sm text-ink-500 dark:text-ink-400">Legal domain</p>
        {domain ? (
          <>
            <h2 className="mt-1 font-serif text-3xl font-medium leading-tight sm:text-4xl">
              {domain.name}
            </h2>

            {domain.confidence !== null && (
              <div className="mt-4 flex max-w-xs items-center gap-3">
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-900/10 dark:bg-white/10"
                  role="img"
                  aria-label={`Confidence ${domain.confidence} percent`}
                >
                  <div
                    className="h-full rounded-full bg-verdigris-500 dark:bg-verdigris-400"
                    style={{ width: `${domain.confidence}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums text-ink-600 dark:text-ink-300">
                  {domain.confidence}% confidence
                </span>
              </div>
            )}

            {domain.description && (
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                {domain.description}
              </p>
            )}
          </>
        ) : (
          <h2 className="mt-1 font-serif text-2xl font-medium text-ink-500 dark:text-ink-400">
            Domain not identified
          </h2>
        )}
      </div>
    </GlassCard>
  );
}
