/** Three pulsing dots. */
export default function TypingIndicator({ label = 'Legal Mind AI is typing' }) {
  return (
    <span role="status" aria-label={label} className="flex h-5 items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-dot rounded-full bg-ink-500 dark:bg-ink-300"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}
