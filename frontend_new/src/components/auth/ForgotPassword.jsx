import { useState } from 'react';
import { ArrowLeft, CircleAlert, Info, Mail } from 'lucide-react';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import InputWithIcon from './InputWithIcon';
import { useAuth } from '@/auth/AuthContext';
import { validateEmail } from '@/utils/validators';

/** Demo-only: validates the address and explains that no email is sent. */
export default function ForgotPassword({ initialEmail = '', onBack }) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const fieldError = touched ? validateEmail(email) : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (validateEmail(email)) return;
    setLoading(true);
    setError('');
    try {
      await requestPasswordReset(email);
      setDone(true);
    } catch {
      setError('Could not process the request. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to log in
      </button>

      <h2 className="font-serif text-3xl font-medium leading-tight">Reset your password</h2>
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
        Enter the email you signed up with.
      </p>

      {error && (
        <div role="alert" className="mt-5 flex gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {done ? (
        <div role="status" className="mt-6 flex gap-2.5 rounded-xl border border-verdigris-500/30 bg-verdigris-500/10 p-4 text-sm text-verdigris-800 dark:text-verdigris-200">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Password reset is not available in this demo, so no email was sent. Accounts exist only
            in this browser. Create a new account or use the demo credentials on the log in screen.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          <Field label="Email" error={fieldError}>
            {(props) => (
              <InputWithIcon
                {...props}
                icon={Mail}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
              />
            )}
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Sending' : 'Send reset link'}
          </Button>
        </form>
      )}
    </>
  );
}
