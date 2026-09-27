import { Info } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function Disclaimer({ text, delay = 0 }) {
  return (
    <GlassCard
      className="animate-reveal flex gap-3 p-4 sm:px-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-ink-500 dark:text-ink-400" aria-hidden="true" />
      <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300">{text}</p>
    </GlassCard>
  );
}
