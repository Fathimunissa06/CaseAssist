import { useEffect, useRef, useState } from 'react';
import Background from './Background';
import Header from './Header';
import Footer from './Footer';
import CaseForm from '@/components/case/CaseForm';
import ResultsPanel from '@/components/results/ResultsPanel';
import LegalMindAI from '@/components/chatbot/LegalMindAI';
import { useTheme } from '@/hooks/useTheme';
import { useAnalyzeCase } from '@/hooks/useAnalyzeCase';
import { buildCaseContext } from '@/utils/buildCaseContext';
import { cn } from '@/utils/cn';

/**
 * The signed-in CaseAssist screen.
 *
 *   desktop (lg+)                         mobile
 *   ┌────────────┬────────────┐           ┌────────────┐
 *   │            │  Analysis  │           │  Case form │
 *   │ Case form  │  results   │           ├────────────┤
 *   │            ├────────────┤           │  Results   │
 *   │            │ Legal Mind │           ├────────────┤
 *   │            │     AI     │           │ Legal Mind │
 *   └────────────┴────────────┘           └────────────┘
 *
 * Case analysis state lives here so the chatbot can be handed the current
 * case as context. Evidence Capture can later be added as another panel/tab
 * that reads the same case (request + analysis).
 */
export default function Workspace() {
  const { theme, toggleTheme } = useTheme();
  const { status, data, error, request, analyze, retry, reset } = useAnalyzeCase();
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const resultsScrollRef = useRef(null);

  // The chatbot keeps the last successful analysis while a re-analysis is loading
  // or fails, and drops it only when the results are cleared.
  const [caseContext, setCaseContext] = useState(null);
  useEffect(() => {
    if (status === 'success' && data) setCaseContext(buildCaseContext(request, data));
    else if (status === 'idle') setCaseContext(null);
  }, [status, data, request]);

  // On desktop the results scroll inside their half of the panel.
  useEffect(() => {
    resultsScrollRef.current?.scrollTo({ top: 0 });
  }, [status]);

  return (
    <div className="relative min-h-dvh">
      <Background />
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="mx-auto w-full max-w-[1600px] px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left half: case form */}
          <div className="flex flex-col lg:min-h-[calc(100dvh-7rem)]">
            <CaseForm
              className="flex-1"
              isLoading={status === 'loading'}
              onSubmit={analyze}
              onCancel={reset}
              onClear={reset}
            />
          </div>

          {/* Right half: results (upper) + Legal Mind AI (lower) */}
          <div
            className={cn(
              'grid gap-6 lg:sticky lg:top-[5.5rem] lg:h-[calc(100dvh-7rem)] lg:min-h-[600px] lg:self-start',
              chatCollapsed ? 'lg:grid-rows-[minmax(0,1fr)_auto]' : 'lg:grid-rows-2',
            )}
          >
            <div
              ref={resultsScrollRef}
              className="min-h-0 lg:-m-1 lg:overflow-y-auto lg:p-1 lg:pb-5 lg:[mask-image:linear-gradient(to_bottom,black_calc(100%-18px),transparent)]"
            >
              <ResultsPanel
                status={status}
                data={data}
                error={error}
                request={request}
                onRetry={retry}
                onReset={reset}
              />
            </div>

            <LegalMindAI
              caseContext={caseContext}
              collapsed={chatCollapsed}
              onToggleCollapse={() => setChatCollapsed((c) => !c)}
              className={chatCollapsed ? '' : 'h-[36rem] lg:h-auto'}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
