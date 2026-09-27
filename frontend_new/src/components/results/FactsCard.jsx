import { FileSearch } from 'lucide-react';
import ResultSection, { EmptyNote } from './ResultSection';

export default function FactsCard({ facts, delay }) {
  return (
    <ResultSection icon={FileSearch} title="Extracted facts" count={facts.length} delay={delay}>
      {facts.length === 0 ? (
        <EmptyNote>No facts were extracted from the description.</EmptyNote>
      ) : (
        <ul className="space-y-3">
          {facts.map((fact, i) => (
            <li
              key={i}
              className="border-l-2 border-verdigris-500/40 pl-3.5 dark:border-verdigris-400/40"
            >
              {fact.label && (
                <p className="text-xs font-medium text-ink-500 dark:text-ink-400">{fact.label}</p>
              )}
              <p className="text-sm leading-relaxed text-ink-800 dark:text-ink-100">{fact.text}</p>
            </li>
          ))}
        </ul>
      )}
    </ResultSection>
  );
}
