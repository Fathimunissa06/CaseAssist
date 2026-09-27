import { getPasswordStrength } from '@/utils/validators';
import { cn } from '@/utils/cn';

const TONES = {
  1: { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  2: { bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  3: { bar: 'bg-verdigris-500', text: 'text-verdigris-700 dark:text-verdigris-300' },
  4: { bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
};

export default function PasswordStrength({ password }) {
  const { score, label, missing } = getPasswordStrength(password);
  const tone = TONES[score];

  return (
    <div className="mt-2.5" aria-live="polite">
      <div className="flex items-center gap-3">
        <div
          className="flex flex-1 gap-1.5"
          role="img"
          aria-label={score ? `Password strength: ${label}` : 'Password strength: not entered'}
        >
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                i <= score ? tone.bar : 'bg-ink-900/10 dark:bg-white/10',
              )}
            />
          ))}
        </div>
        <span className={cn('w-12 text-right text-xs font-medium', tone?.text ?? 'text-ink-500')}>
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
        {!password
          ? 'Use 8 or more characters with letters, numbers and a symbol.'
          : missing.length
            ? `To strengthen it: ${missing.join(', ')}.`
            : 'This password meets every recommendation.'}
      </p>
    </div>
  );
}
