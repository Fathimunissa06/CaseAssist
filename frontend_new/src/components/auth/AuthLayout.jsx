import Background from '@/components/layout/Background';
import Brand from '@/components/ui/Brand';
import GlassCard from '@/components/ui/GlassCard';
import ThemeToggle from '@/components/ui/ThemeToggle';
import AuthPreview from './AuthPreview';
import { useTheme } from '@/hooks/useTheme';

/** Shared frame for Login and Sign Up: brand story on the left, form card on the right. */
export default function AuthLayout({ children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-dvh">
      <Background />

      <div className="mx-auto grid min-h-dvh w-full max-w-[1400px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Brand panel (desktop) */}
        <div className="hidden flex-col justify-between px-12 py-10 lg:flex xl:px-16">
          <Brand size="lg" />

          <div>
            <h1 className="max-w-lg font-serif text-5xl font-medium leading-[1.08] xl:text-6xl">
              Know where you stand before you act.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-600 dark:text-ink-300">
              Describe your legal problem in plain language. CaseAssist maps the facts, your rights
              and the relevant laws, then Legal Mind AI helps you work through what comes next.
            </p>
            <div className="mt-10">
              <AuthPreview />
            </div>
          </div>

          <p className="text-xs text-ink-500 dark:text-ink-400">
            General legal information, not legal advice.
          </p>
        </div>

        {/* Form column */}
        <div className="flex flex-col px-4 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between">
            <Brand className="lg:invisible" />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>

          <div className="flex flex-1 items-center justify-center py-8">
            <GlassCard as="div" className="w-full max-w-[26rem] p-6 sm:p-8">
              {children}
            </GlassCard>
          </div>

          <p className="pb-2 text-center text-xs text-ink-500 dark:text-ink-400 lg:hidden">
            General legal information, not legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}
