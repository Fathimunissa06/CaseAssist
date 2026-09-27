import { useEffect, useRef } from 'react';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import DomainCard from './DomainCard';
import FactsCard from './FactsCard';
import RightsCard from './RightsCard';
import LawsCard from './LawsCard';
import RiskCard from './RiskCard';
import ActionsCard from './ActionsCard';
import Disclaimer from './Disclaimer';

function Results({ request, analysis, onReset }) {
  return (
    <div className="space-y-5">
      <p className="sr-only" role="status">
        Analysis complete.
      </p>

      <DomainCard request={request} analysis={analysis} onReset={onReset} />

      <div className="grid gap-5 2xl:grid-cols-2">
        <FactsCard facts={analysis.facts} delay={90} />
        <RightsCard rights={analysis.rights} delay={150} />
      </div>

      <LawsCard laws={analysis.laws} delay={210} />

      <div className="grid gap-5 2xl:grid-cols-2">
        <RiskCard risk={analysis.risk} delay={270} />
        <ActionsCard actions={analysis.actions} delay={330} />
      </div>

      <Disclaimer text={analysis.disclaimer} delay={390} />
    </div>
  );
}

export default function ResultsPanel({ status, data, error, request, onRetry, onReset }) {
  const ref = useRef(null);

  // On narrow screens the results sit below the form, so bring them into view.
  useEffect(() => {
    if (status !== 'loading') return;
    if (!window.matchMedia('(max-width: 1023px)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [status]);

  return (
    <section ref={ref} aria-label="Case analysis" aria-busy={status === 'loading'} className="min-w-0 scroll-mt-20">
      {status === 'idle' && <EmptyState />}
      {status === 'loading' && <LoadingState request={request} />}
      {status === 'error' && <ErrorState error={error} onRetry={onRetry} />}
      {status === 'success' && data && (
        <Results request={request} analysis={data} onReset={onReset} />
      )}
    </section>
  );
}
