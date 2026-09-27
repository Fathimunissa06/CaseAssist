import { Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import TypingIndicator from '@/components/chatbot/TypingIndicator';

/**
 * Decorative schematic of the product (domain, risk scale, retrieved laws,
 * Legal Mind AI). Abstract on purpose: it shows structure, not legal content.
 */
export default function AuthPreview() {
  return (
    <div aria-hidden="true" className="relative h-[25rem] w-full max-w-xl select-none">
      {/* Domain + risk scale */}
      <GlassCard className="absolute left-0 top-0 w-72 p-5">
        <p className="text-xs text-ink-500 dark:text-ink-400">Legal domain</p>
        <p className="mt-1 font-serif text-2xl font-medium">Employment law</p>
        <div className="mt-4 flex gap-1.5">
          <span className="h-1.5 flex-1 rounded-full bg-amber-500" />
          <span className="h-1.5 flex-1 rounded-full bg-amber-500" />
          <span className="h-1.5 flex-1 rounded-full bg-ink-900/10 dark:bg-white/10" />
          <span className="h-1.5 flex-1 rounded-full bg-ink-900/10 dark:bg-white/10" />
        </div>
      </GlassCard>

      {/* Retrieved laws (abstract) */}
      <GlassCard className="absolute right-0 top-14 w-64 p-5">
        <p className="text-xs text-ink-500 dark:text-ink-400">Retrieved laws</p>
        <div className="mt-3 space-y-3">
          {['92%', '78%', '61%'].map((w, i) => (
            <div key={w} className="flex items-center gap-3">
              <span className="h-8 w-0.5 rounded-full bg-verdigris-500/70" />
              <div className="flex-1 space-y-1.5">
                <span className="block h-2 rounded-full bg-ink-900/15 dark:bg-white/15" style={{ width: w }} />
                <span
                  className="block h-2 rounded-full bg-ink-900/[0.07] dark:bg-white/[0.07]"
                  style={{ width: `${70 - i * 12}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Legal Mind AI */}
      <GlassCard className="absolute bottom-0 left-8 w-[21rem] p-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-verdigris-400 to-verdigris-700 text-white">
            <Sparkles className="size-4" />
          </span>
          <p className="font-serif text-base font-semibold">Legal Mind AI</p>
        </div>
        <div className="mt-3 flex justify-end">
          <span className="rounded-2xl rounded-br-md bg-verdigris-600 px-3.5 py-2 text-sm text-white dark:bg-verdigris-400/90 dark:text-ink-950">
            What rights do I have?
          </span>
        </div>
        <div className="mt-2 flex">
          <span className="rounded-2xl rounded-bl-md border border-ink-200/70 bg-white/60 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/[0.06]">
            <TypingIndicator />
          </span>
        </div>
      </GlassCard>
    </div>
  );
}
