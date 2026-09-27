import { OctagonAlert, Scale, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import ResultSection, { EmptyNote } from './ResultSection';
import { cn } from '@/utils/cn';

const LEVELS = ['low', 'moderate', 'high', 'critical'];

// Full class strings are listed so Tailwind can detect them.
const TONE = {
  low: {
    label: 'Low risk',
    scale: 'Low',
    text: 'text-emerald-700 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    icon: ShieldCheck,
  },
  moderate: {
    label: 'Moderate risk',
    scale: 'Moderate',
    text: 'text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
    icon: ShieldAlert,
  },
  high: {
    label: 'High risk',
    scale: 'High',
    text: 'text-orange-700 dark:text-orange-300',
    bar: 'bg-orange-500',
    icon: TriangleAlert,
  },
  critical: {
    label: 'Critical risk',
    scale: 'Critical',
    text: 'text-rose-700 dark:text-rose-300',
    bar: 'bg-rose-500',
    icon: OctagonAlert,
  },
};

export default function RiskCard({ risk, delay }) {
  if (!risk) {
    return (
      <ResultSection icon={Scale} title="Risk assessment" delay={delay}>
        <EmptyNote>No risk assessment was returned for this case.</EmptyNote>
      </ResultSection>
    );
  }

  const index = risk.level ? LEVELS.indexOf(risk.level) : -1;
  const tone = risk.level ? TONE[risk.level] : null;
  const Icon = tone?.icon ?? Scale;

  return (
    <ResultSection icon={Scale} title="Risk assessment" delay={delay}>
      <div className="flex items-center gap-3">
        <Icon
          className={cn('size-7 shrink-0', tone?.text ?? 'text-ink-500 dark:text-ink-400')}
          aria-hidden="true"
        />
        <div>
          <p
            className={cn(
              'font-serif text-3xl font-medium leading-none',
              tone?.text ?? 'text-ink-600 dark:text-ink-300',
            )}
          >
            {tone?.label ?? 'Not rated'}
          </p>
          {risk.score !== null && (
            <p className="mt-1.5 text-xs tabular-nums text-ink-500 dark:text-ink-400">
              Risk score {risk.score} out of 100
            </p>
          )}
        </div>
      </div>

      {tone && (
        <div className="mt-5">
          <div
            className="flex gap-1.5"
            role="img"
            aria-label={`Risk level ${tone.scale}, ${index + 1} of ${LEVELS.length}`}
          >
            {LEVELS.map((level, i) => (
              <span
                key={level}
                className={cn(
                  'h-2 flex-1 rounded-full',
                  i <= index ? tone.bar : 'bg-ink-900/10 dark:bg-white/10',
                )}
              />
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5 text-[11px] text-ink-500 dark:text-ink-400" aria-hidden="true">
            {LEVELS.map((level, i) => (
              <span
                key={level}
                className={cn('flex-1', i === index && 'font-semibold text-ink-800 dark:text-ink-100')}
              >
                {TONE[level].scale}
              </span>
            ))}
          </div>
        </div>
      )}

      {risk.summary && (
        <p className="mt-5 text-sm leading-relaxed text-ink-700 dark:text-ink-200">{risk.summary}</p>
      )}

      {risk.factors.length > 0 && (
        <div className="mt-5">
          <h4 className="font-sans text-sm font-semibold">What drives this rating</h4>
          <ul className="mt-2.5 space-y-2">
            {risk.factors.map((factor, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-400 dark:bg-ink-500"
                  aria-hidden="true"
                />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ResultSection>
  );
}
