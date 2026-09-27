import Brand from '@/components/ui/Brand';
import ThemeToggle from '@/components/ui/ThemeToggle';
import UserMenu from './UserMenu';
import { USING_MOCK_DATA } from '@/api/caseService';

export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/45 backdrop-blur-xl dark:border-white/10 dark:bg-ink-950/45">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Brand />

        <div className="flex items-center gap-3">
          {USING_MOCK_DATA && (
            <span className="hidden rounded-full border border-brass-400/40 bg-brass-400/15 px-3 py-1 text-xs font-medium text-brass-500 dark:text-brass-300 sm:inline">
              Sample data
            </span>
          )}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
