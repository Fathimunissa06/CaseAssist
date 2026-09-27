import { useMemo, useRef, useState } from 'react';
import { Eraser, FileText, RefreshCw, Scale, Wand2, X } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import { nextCaseId, peekCaseId } from '@/utils/caseId';
import { cn } from '@/utils/cn';

const LIMITS = { title: 160, caseId: 40, description: 5000, minDescription: 30 };

const EXAMPLE = {
  title: 'Security deposit not returned after move-out',
  problemDescription:
    "I moved out of my rented flat on 30 June after giving two months' written notice. When I signed the 11-month lease I paid a security deposit of 90,000. More than two months have passed and my landlord still has not returned it. He now says he will deduct repainting charges, but the lease says nothing about repainting. I have all my rent receipts and a message thread where he agreed the flat was left clean. What are my options?",
};

function validate(values) {
  const errors = {};
  if (!values.caseId.trim()) errors.caseId = 'Enter a case ID, for example CASE-001.';

  const title = values.title.trim();
  if (!title) errors.title = 'Give the case a short title.';
  else if (title.length < 3) errors.title = 'Use at least 3 characters for the title.';

  const len = values.problemDescription.trim().length;
  if (len === 0) errors.problemDescription = 'Describe the legal problem you need help with.';
  else if (len < LIMITS.minDescription) {
    errors.problemDescription = `Add more detail: at least ${LIMITS.minDescription} characters, so the analysis has facts to work with.`;
  }
  return errors;
}

export default function CaseForm({ isLoading, onSubmit, onCancel, onClear, className }) {
  const [values, setValues] = useState(() => ({
    caseId: peekCaseId(),
    title: '',
    problemDescription: '',
  }));
  const [touched, setTouched] = useState({});
  const fieldRefs = useRef({});

  const errors = useMemo(() => validate(values), [values]);
  const visibleError = (name) => (touched[name] ? errors[name] : undefined);

  const update = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));
  const markTouched = (name) => () => setTouched((t) => ({ ...t, [name]: true }));
  const setRef = (name) => (el) => {
    fieldRefs.current[name] = el;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (isLoading) return;

    const invalid = ['caseId', 'title', 'problemDescription'].filter((n) => errors[n]);
    if (invalid.length > 0) {
      setTouched({ caseId: true, title: true, problemDescription: true });
      fieldRefs.current[invalid[0]]?.focus();
      return;
    }

    onSubmit({
      caseId: values.caseId.trim(),
      title: values.title.trim(),
      problemDescription: values.problemDescription.trim(),
    });
  };

  const handleClear = () => {
    setValues((v) => ({ ...v, title: '', problemDescription: '' }));
    setTouched({});
    onClear?.();
  };

  const useExample = () => {
    setValues((v) => ({ ...v, ...EXAMPLE }));
    setTouched({});
  };

  const descLength = values.problemDescription.length;
  const isEmptyForm = !values.title && !values.problemDescription;

  return (
    <GlassCard as="form" onSubmit={handleSubmit} noValidate className={cn('flex flex-col p-5 sm:p-6', className)} aria-labelledby="case-form-title">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 id="case-form-title" className="font-serif text-xl font-semibold">
            Case details
          </h2>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
            Describe what happened in your own words.
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-verdigris-500/[0.12] text-verdigris-700 dark:bg-verdigris-400/[0.12] dark:text-verdigris-300">
          <FileText className="size-[18px]" aria-hidden="true" />
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Field label="Case ID" error={visibleError('caseId')}>
          {(props) => (
            <div className="flex gap-2">
              <input
                {...props}
                ref={setRef('caseId')}
                type="text"
                value={values.caseId}
                maxLength={LIMITS.caseId}
                disabled={isLoading}
                onChange={update('caseId')}
                onBlur={markTouched('caseId')}
                placeholder="CASE-001"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setValues((v) => ({ ...v, caseId: nextCaseId() }))}
                disabled={isLoading}
                aria-label="Generate a new case ID"
                title="Generate a new case ID"
                className="grid size-[42px] shrink-0 place-items-center rounded-xl border disabled:cursor-not-allowed disabled:opacity-60 border-ink-200/80 bg-white/60 text-ink-600 transition-colors hover:bg-white/90 dark:border-white/10 dark:bg-white/[0.05] dark:text-ink-300 dark:hover:bg-white/[0.1]"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </Field>

        <Field label="Title" error={visibleError('title')}>
          {(props) => (
            <input
              {...props}
              ref={setRef('title')}
              type="text"
              value={values.title}
              maxLength={LIMITS.title}
              disabled={isLoading}
              onChange={update('title')}
              onBlur={markTouched('title')}
              placeholder="e.g. Unpaid wages after resignation"
              autoComplete="off"
            />
          )}
        </Field>

        <Field
          className="flex flex-1 flex-col"
          label="Problem description"
          error={visibleError('problemDescription')}
          hint="Include who is involved, what happened, key dates, and any amounts."
          aside={
            <span
              className="text-xs tabular-nums text-ink-500 dark:text-ink-400"
              aria-live="off"
            >
              {descLength.toLocaleString()} / {LIMITS.description.toLocaleString()}
            </span>
          }
        >
          {(props) => (
            <textarea
              {...props}
              ref={setRef('problemDescription')}
              rows={9}
              value={values.problemDescription}
              maxLength={LIMITS.description}
              disabled={isLoading}
              onChange={update('problemDescription')}
              onBlur={markTouched('problemDescription')}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmit(e);
              }}
              placeholder="Explain the situation, what you have tried so far, and what outcome you want."
              className={`${props.className} min-h-40 flex-1 resize-y leading-relaxed`}
            />
          )}
        </Field>
      </div>

      <div className="mt-6 space-y-3">
        <Button type="submit" loading={isLoading} icon={Scale} className="w-full">
          {isLoading ? 'Analyzing case' : 'Analyze case'}
        </Button>

        {isLoading ? (
          <Button variant="secondary" size="sm" icon={X} onClick={onCancel} className="w-full">
            Cancel analysis
          </Button>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" icon={Wand2} onClick={useExample}>
              Use an example
            </Button>
            <Button variant="ghost" size="sm" icon={Eraser} onClick={handleClear} disabled={isEmptyForm}>
              Clear
            </Button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
