import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Field from '@/components/ui/Field';
import InputWithIcon from './InputWithIcon';

/** Password input with a show/hide toggle, wrapped in the shared Field. */
export default function PasswordField({
  label = 'Password',
  error,
  hint,
  aside,
  inputRef,
  autoComplete = 'current-password',
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} error={error} hint={hint} aside={aside}>
      {(props) => (
        <InputWithIcon
          {...props}
          {...inputProps}
          ref={inputRef}
          icon={Lock}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          trailing={
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              aria-pressed={visible}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
            >
              {visible ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
            </button>
          }
        />
      )}
    </Field>
  );
}
