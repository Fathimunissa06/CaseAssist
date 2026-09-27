import { useState } from 'react';
import { BookOpen, ExternalLink, Landmark } from 'lucide-react';
import ResultSection, { EmptyNote } from './ResultSection';
import { cn } from '@/utils/cn';

const isHttpUrl = (s) => /^https?:\/\//i.test(s);

function Relevance({ value }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <span className="text-xs font-medium tabular-nums text-ink-600 dark:text-ink-300">
        {value}% match
      </span>
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-900/10 dark:bg-white/10"
        role="img"
        aria-label={`Relevance ${value} percent`}
      >
        <div
          className="h-full rounded-full bg-verdigris-500 dark:bg-verdigris-400"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function LawItem({ law }) {
  const [open, setOpen] = useState(false);
  const isLong = law.excerpt.length > 260;

  return (
    <li className="rounded-xl border border-ink-200/70 bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="font-serif text-base font-semibold leading-snug sm:text-lg">{law.title}</h4>
          {law.section && (
            <p className="mt-0.5 text-sm font-medium text-verdigris-700 dark:text-verdigris-300">
              {law.section}
            </p>
          )}
        </div>
        {law.score !== null && <Relevance value={law.score} />}
      </div>

      {law.excerpt && (
        <p
          className={cn(
            'mt-3 max-w-prose text-sm leading-relaxed text-ink-700 dark:text-ink-200',
            isLong && !open && 'line-clamp-3',
          )}
        >
          {law.excerpt}
        </p>
      )}

      {isLong && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-1.5 text-sm font-medium text-verdigris-700 hover:underline dark:text-verdigris-300"
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}

      {law.source && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
          {isHttpUrl(law.source) ? (
            <a
              href={law.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-1.5 hover:text-verdigris-700 hover:underline dark:hover:text-verdigris-300"
            >
              <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{law.source}</span>
            </a>
          ) : (
            <>
              <Landmark className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{law.source}</span>
            </>
          )}
        </p>
      )}
    </li>
  );
}

export default function LawsCard({ laws, delay }) {
  return (
    <ResultSection icon={BookOpen} title="Retrieved laws" count={laws.length} delay={delay}>
      {laws.length === 0 ? (
        <EmptyNote>No matching laws or precedents were retrieved for this case.</EmptyNote>
      ) : (
        <ul className="space-y-3">
          {laws.map((law, i) => (
            <LawItem key={i} law={law} />
          ))}
        </ul>
      )}
    </ResultSection>
  );
}
