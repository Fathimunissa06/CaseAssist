import { BookOpen, FileSearch, Landmark, ListChecks, Scale, ShieldCheck } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const OUTPUTS = [
  { icon: Landmark, label: 'Legal domain' },
  { icon: FileSearch, label: 'Key facts' },
  { icon: ShieldCheck, label: 'Your rights' },
  { icon: BookOpen, label: 'Relevant laws' },
  { icon: Scale, label: 'Risk rating' },
  { icon: ListChecks, label: 'Next steps' },
];

export default function EmptyState() {
  return (
    <GlassCard className="p-6 sm:p-8">
      <h2 className="max-w-md font-serif text-2xl font-medium leading-tight sm:text-3xl">
        Your analysis will appear here
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-600 dark:text-ink-300">
        Fill in the case details and select Analyze case. No case ready? Use an example to see how
        it works. Your analysis will include:
      </p>

      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {OUTPUTS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-xl border border-ink-200/60 bg-white/35 px-3.5 py-2.5 dark:border-white/[0.07] dark:bg-white/[0.02]"
          >
            <Icon className="size-[18px] shrink-0 text-verdigris-700 dark:text-verdigris-300" aria-hidden="true" />
            <span className="text-sm text-ink-700 dark:text-ink-200">{label}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
