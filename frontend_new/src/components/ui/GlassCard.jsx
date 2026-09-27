import { cn } from '@/utils/cn';

/** Frosted-glass surface. Works on both themes; needs a colorful backdrop behind it. */
export default function GlassCard({ as: Tag = 'section', className, children, ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border backdrop-blur-xl',
        'border-white/80 bg-white/55 ring-1 ring-inset ring-white/50',
        'shadow-[0_10px_40px_-16px_rgba(15,24,48,0.28)]',
        'dark:border-white/10 dark:bg-white/[0.045] dark:ring-white/[0.04]',
        'dark:shadow-[0_10px_44px_-16px_rgba(0,0,0,0.7)]',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
