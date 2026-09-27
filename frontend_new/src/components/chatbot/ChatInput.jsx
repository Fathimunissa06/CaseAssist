import { useEffect, useRef, useState } from 'react';
import { Send, Square } from 'lucide-react';
import { cn } from '@/utils/cn';

const MAX_LENGTH = 2000;

/** Auto-growing textarea. Enter sends, Shift+Enter adds a new line. */
export default function ChatInput({ onSend, onStop, isSending, disabled }) {
  const [text, setText] = useState('');
  const ref = useRef(null);

  // Grow with content up to about four lines.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [text]);

  const canSend = text.trim().length > 0 && !isSending && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn(
        'flex items-end gap-2 rounded-xl border p-1.5 transition-colors',
        'border-ink-200/80 bg-white/65 focus-within:border-verdigris-500 focus-within:ring-4 focus-within:ring-verdigris-500/15',
        'dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:border-verdigris-400 dark:focus-within:ring-verdigris-400/15',
      )}
    >
      <label htmlFor="legal-mind-input" className="sr-only">
        Ask Legal Mind AI
      </label>
      <textarea
        id="legal-mind-input"
        ref={ref}
        rows={1}
        value={text}
        maxLength={MAX_LENGTH}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask Legal Mind AI..."
        className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm leading-snug text-ink-900 placeholder:text-ink-400 focus:outline-none dark:text-ink-50 dark:placeholder:text-ink-500"
      />

      {isSending ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop response"
          title="Stop response"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink-900/10 text-ink-800 transition-colors hover:bg-ink-900/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
        >
          <Square className="size-3.5 fill-current" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          title="Send"
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg transition-colors',
            'bg-verdigris-600 text-white hover:bg-verdigris-500',
            'dark:bg-verdigris-400 dark:text-ink-950 dark:hover:bg-verdigris-300',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
