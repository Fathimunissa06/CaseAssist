import { cn } from '@/utils/cn';

/** Input with a leading icon and an optional trailing element (e.g. a show/hide button). */
export default function InputWithIcon({ icon: Icon, trailing, className, ...props }) {
  return (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-400 dark:text-ink-500"
        aria-hidden="true"
      />
      <input {...props} className={cn(className, 'pl-10', trailing && 'pr-11')} />
      {trailing}
    </div>
  );
}
