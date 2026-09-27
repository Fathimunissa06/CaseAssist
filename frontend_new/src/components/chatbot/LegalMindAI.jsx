import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Eraser, FileCheck2, Info, Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { useLegalMindChat } from '@/hooks/useLegalMindChat';
import { CHAT_MODE } from '@/api/chatService';
import { cn } from '@/utils/cn';

export const DISCLAIMER =
  'Legal Mind AI provides legal information for informational purposes only and is not a substitute for advice from a qualified lawyer.';

const SUGGESTIONS = [
  'What rights do I have?',
  'Explain the applicable law.',
  'What should I do next?',
  'What evidence would help my case?',
  'Explain the risk assessment.',
];

const MIN_WIDTH = 350;
const MAX_WIDTH = 850;
const MIN_HEIGHT = 420;
const MAX_HEIGHT = 900;

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 620;

function ContextBanner({ caseContext }) {
  if (!caseContext) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-snug text-amber-800 dark:text-amber-200">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p>Analyze your case first so Legal Mind AI can provide context-aware assistance.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-verdigris-500/10 px-3 py-2 text-xs text-verdigris-800 dark:text-verdigris-200">
      <FileCheck2 className="size-3.5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 truncate">
        <span className="font-medium">Using case context:</span> {caseContext.title}
        {caseContext.domain ? ` (${caseContext.domain})` : ''}
      </p>
    </div>
  );
}

function getSavedSize() {
  try {
    const saved = JSON.parse(localStorage.getItem('caseassist-legalmind-size'));

    if (
      saved &&
      typeof saved.width === 'number' &&
      typeof saved.height === 'number'
    ) {
      return {
        width: Math.min(Math.max(saved.width, MIN_WIDTH), MAX_WIDTH),
        height: Math.min(Math.max(saved.height, MIN_HEIGHT), MAX_HEIGHT),
      };
    }
  } catch {
    // Ignore invalid localStorage data.
  }

  return {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  };
}

/**
 * Permanent assistant panel.
 * Receives the current case context from the workspace
 * and talks to the service layer in api/chatService.js.
 */
export default function LegalMindAI({
  caseContext,
  collapsed = false,
  onToggleCollapse,
  className,
}) {
  const { messages, isSending, send, stop, retry, clear } =
    useLegalMindChat(caseContext);

  const scrollRef = useRef(null);

  const [panelSize, setPanelSize] = useState(getSavedSize);
  const [isResizing, setIsResizing] = useState(false);

  const resizeRef = useRef(null);

  const hasUserMessages = messages.some((m) => m.role === 'user');
  const lastErrorId = [...messages].reverse().find((m) => m.error)?.id;

  // Keep newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || collapsed) return;

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [messages, isSending, collapsed]);

  // Save size so it survives page refresh.
  useEffect(() => {
    try {
      localStorage.setItem(
        'caseassist-legalmind-size',
        JSON.stringify(panelSize),
      );
    } catch {
      // Ignore storage errors.
    }
  }, [panelSize]);

  // Resize using pointer movement.
  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event) => {
      if (!resizeRef.current) return;

      const {
        startX,
        startY,
        startWidth,
        startHeight,
      } = resizeRef.current;

      const newWidth = Math.min(
        Math.max(startWidth + (startX - event.clientX), MIN_WIDTH),
        MAX_WIDTH,
      );

      const newHeight = Math.min(
        Math.max(startHeight + (event.clientY - startY), MIN_HEIGHT),
        MAX_HEIGHT,
      );

      setPanelSize({
        width: newWidth,
        height: newHeight,
      });
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);

      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const startResize = (event) => {
    event.preventDefault();

    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: panelSize.width,
      startHeight: panelSize.height,
    };

    setIsResizing(true);
  };

  return (
    <GlassCard
      as="section"
      aria-label="Legal Mind AI"
      className={cn(
        'relative flex min-h-0 flex-col overflow-hidden',
        className,
      )}
      style={
        collapsed
          ? undefined
          : {
              width: `min(${panelSize.width}px, 100%)`,
              height: `${panelSize.height}px`,
              maxWidth: '100%',
            }
      }
    >
      <header className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-verdigris-400 to-verdigris-700 text-white shadow-[0_6px_16px_-6px_rgba(23,130,119,0.8)]">
          <Sparkles className="size-5" aria-hidden="true" />

          <span
            className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-ink-50 bg-emerald-500 dark:border-ink-900"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <h2 className="font-serif text-lg font-semibold">
            Legal Mind AI
          </h2>

          <p
            className="text-xs text-ink-500 dark:text-ink-400"
            aria-live="polite"
          >
            {isSending ? 'Reviewing your question...' : 'Ready'}
          </p>
        </div>

        {CHAT_MODE === 'demo' && (
          <span
            className="hidden rounded-full border border-brass-400/40 bg-brass-400/15 px-2.5 py-1 text-[11px] font-medium text-brass-500 dark:text-brass-300 sm:inline"
            title="No chat backend is connected. Replies are assembled from your analysis, not written by an AI model."
          >
            Demo mode
          </span>
        )}

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={clear}
            disabled={messages.length <= 1}
            aria-label="Clear conversation"
            title="Clear conversation"
            className="grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-ink-400 dark:hover:bg-white/[0.07] dark:hover:text-white"
          >
            <Eraser className="size-[18px]" aria-hidden="true" />
          </button>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={
                collapsed
                  ? 'Expand Legal Mind AI'
                  : 'Collapse Legal Mind AI'
              }
              aria-expanded={!collapsed}
              title={collapsed ? 'Expand' : 'Collapse'}
              className="grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/[0.07] dark:hover:text-white"
            >
              {collapsed ? (
                <ChevronUp
                  className="size-[18px]"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="size-[18px]"
                  aria-hidden="true"
                />
              )}
            </button>
          )}
        </div>
      </header>

      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col border-t border-ink-200/60 dark:border-white/[0.07]',
          collapsed && 'hidden',
        )}
      >
        <div className="px-4 pt-3 sm:px-5">
          <ContextBanner caseContext={caseContext} />
        </div>

        <div
          ref={scrollRef}
          role="log"
          aria-label="Conversation with Legal Mind AI"
          aria-live="polite"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5"
        >
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              onRetry={m.id === lastErrorId ? retry : undefined}
            />
          ))}

          {!hasUserMessages && !isSending && (
            <div className="flex flex-wrap gap-2 pl-9">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-ink-200/80 bg-white/60 px-3 py-1.5 text-xs text-ink-700 transition-colors hover:border-verdigris-500/60 hover:bg-verdigris-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-200 dark:hover:border-verdigris-400/50 dark:hover:bg-verdigris-400/10"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {isSending && (
            <div className="flex items-start gap-2.5">
              <span
                className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-verdigris-400 to-verdigris-700 text-white"
                aria-hidden="true"
              >
                <Sparkles className="size-3.5" />
              </span>

              <div className="rounded-2xl rounded-tl-md border border-ink-200/70 bg-white/65 px-4 py-3 dark:border-white/10 dark:bg-white/[0.06]">
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-3 sm:px-5">
          <ChatInput
            onSend={send}
            onStop={stop}
            isSending={isSending}
          />

          <p className="mt-2 text-[11px] leading-snug text-ink-500 dark:text-ink-400">
            {DISCLAIMER}
          </p>
        </div>
      </div>

      {/* Resize handle */}
      {!collapsed && (
        <button
          type="button"
          aria-label="Resize Legal Mind AI panel"
          title="Drag to resize"
          onPointerDown={startResize}
          className={cn(
            'absolute bottom-0 right-0 z-20 h-7 w-7 cursor-nwse-resize touch-none',
            'rounded-tl-lg border-l border-t border-ink-200/70',
            'bg-white/70 backdrop-blur-sm',
            'dark:border-white/10 dark:bg-ink-900/70',
            'transition-opacity',
            isResizing ? 'opacity-100' : 'opacity-70 hover:opacity-100',
          )}
        >
          <span className="absolute bottom-1.5 right-1.5 block h-3 w-3">
            <span className="absolute bottom-0 right-0 h-1 w-1 rounded-full bg-ink-500 dark:bg-ink-300" />
            <span className="absolute bottom-0 right-2 h-1 w-1 rounded-full bg-ink-500 dark:bg-ink-300" />
            <span className="absolute bottom-2 right-0 h-1 w-1 rounded-full bg-ink-500 dark:bg-ink-300" />
          </span>
        </button>
      )}
    </GlassCard>
  );
}

