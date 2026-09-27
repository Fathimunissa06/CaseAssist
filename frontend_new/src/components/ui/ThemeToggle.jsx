import { Moon, Sun } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  const label = `Switch to ${isDark ? 'light' : 'dark'} mode`;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={cn(
        'relative grid size-10 place-items-center overflow-hidden rounded-xl border transition-colors',
        'border-ink-200/80 bg-white/60 text-ink-700 hover:bg-white/90',
        'dark:border-white/10 dark:bg-white/[0.05] dark:text-ink-100 dark:hover:bg-white/[0.1]',
      )}
    >
      <Sun
        aria-hidden="true"
        className={cn(
          'absolute size-[18px] transition-all duration-300',
          isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0',
        )}
      />
      <Moon
        aria-hidden="true"
        className={cn(
          'absolute size-[18px] transition-all duration-300',
          isDark ? '-rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100',
        )}
      />
    </button>
  );
}
