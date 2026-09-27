import { ShieldCheck } from 'lucide-react';
import ResultSection, { EmptyNote } from './ResultSection';

export default function RightsCard({ rights, delay }) {
  const { summary, items } = rights;
  const empty = !summary && items.length === 0;

  return (
    <ResultSection
      icon={ShieldCheck}
      title="Your rights"
      count={items.length || undefined}
      delay={delay}
    >
      {empty ? (
        <EmptyNote>No specific rights were identified for this case.</EmptyNote>
      ) : (
        <>
          {summary && (
            <p className="mb-4 text-sm leading-relaxed text-ink-700 dark:text-ink-200">{summary}</p>
          )}
          <ul className="space-y-3.5">
            {items.map((item, i) => (
              <li key={i} className="flex gap-3">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-verdigris-600 dark:text-verdigris-300"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug text-ink-900 dark:text-ink-50">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                      {item.description}
                    </p>
                  )}
                  {item.source && (
                    <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">Basis: {item.source}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </ResultSection>
  );
}
