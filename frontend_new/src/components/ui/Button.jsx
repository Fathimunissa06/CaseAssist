import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const VARIANTS = {
  primary: cn(
    'bg-verdigris-600 text-white shadow-[0_8px_20px_-8px_rgba(23,130,119,0.7)]',
    'hover:bg-verdigris-500 active:bg-verdigris-700',
    'dark:bg-verdigris-400 dark:text-ink-950 dark:hover:bg-verdigris-300 dark:active:bg-verdigris-500',
    'disabled:shadow-none',
  ),
  secondary: cn(
    'border border-ink-200/80 bg-white/60 text-ink-800 hover:bg-white/90',
    'dark:border-white/10 dark:bg-white/[0.05] dark:text-ink-100 dark:hover:bg-white/[0.09]',
  ),
  ghost: cn(
    'text-ink-600 hover:bg-ink-900/5 hover:text-ink-900',
    'dark:text-ink-300 dark:hover:bg-white/[0.07] dark:hover:text-white',
  ),
};

const SIZES = {
  md: 'h-11 gap-2 rounded-xl px-5 text-sm font-semibold',
  sm: 'h-9 gap-1.5 rounded-lg px-3 text-sm font-medium',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="size-4" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
