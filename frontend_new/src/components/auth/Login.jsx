import { useRef, useState } from 'react';
import { CircleAlert, Info, Mail } from 'lucide-react';
import AuthLayout from './AuthLayout';
import ForgotPassword from './ForgotPassword';
import GoogleButton from './GoogleButton';
import InputWithIcon from './InputWithIcon';
import PasswordField from './PasswordField';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Field from '@/components/ui/Field';
import { Link } from '@/router/NavigationContext';
import { ROUTES } from '@/router/routes';
import { useAuth } from '@/auth/AuthContext';
import { DEMO_ACCOUNT } from '@/auth/authService';
import { validateEmail } from '@/utils/validators';

function validate(values) {
  const errors = {};
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  if (!values.password) errors.password = 'Enter your password.';
  return errors;
}

export default function Login() {
  const { logIn } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'forgot'
  const [values, setValues] = useState({ email: '', password: '', remember: true });
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const refs = useRef({});

  const errors = validate(values);
  const shown = (name) => (touched[name] ? errors[name] : undefined);

  const update = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setFormError('');
  };
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setNotice('');

    const invalid = ['email', 'password'].filter((n) => errors[n]);
    if (invalid.length) {
      setTouched({ email: true, password: true });
      refs.current[invalid[0]]?.focus();
      return;
    }

    setLoading(true);
    setFormError('');
    try {
      await logIn({ email: values.email, password: values.password, remember: values.remember });
      // App redirects to /app once the session exists.
    } catch (err) {
      setFormError(err?.message || 'Could not log in. Try again.');
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setValues((v) => ({ ...v, email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password }));
    setTouched({});
    setFormError('');
  };

  if (view === 'forgot') {
    return (
      <AuthLayout>
        <ForgotPassword initialEmail={values.email} onBack={() => setView('login')} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="font-serif text-3xl font-medium leading-tight">Welcome back</h2>
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
        Log in to continue to your workspace.
      </p>

      {formError && (
        <div
          role="alert"
          className="mt-5 flex gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <fieldset disabled={loading} className="min-w-0 space-y-4 border-0 p-0">
          <Field label="Email" error={shown('email')}>
            {(props) => (
              <InputWithIcon
                {...props}
                ref={(el) => (refs.current.email = el)}
                icon={Mail}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={update('email')}
                onBlur={blur('email')}
              />
            )}
          </Field>

          <PasswordField
            error={shown('password')}
            inputRef={(el) => (refs.current.password = el)}
            placeholder="Enter your password"
            value={values.password}
            onChange={update('password')}
            onBlur={blur('password')}
            aside={
              <button
                type="button"
                onClick={() => setView('forgot')}
                className="text-xs font-medium text-verdigris-700 hover:underline dark:text-verdigris-300"
              >
                Forgot password?
              </button>
            }
          />

          <Checkbox
            checked={values.remember}
            onChange={(e) => setValues((v) => ({ ...v, remember: e.target.checked }))}
          >
            Remember me on this device
          </Checkbox>
        </fieldset>

        <Button type="submit" loading={loading} className="w-full">
          {loading ? 'Logging in' : 'Log in'}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-500 dark:text-ink-400">
        <span className="h-px flex-1 bg-ink-200 dark:bg-white/10" />
        or
        <span className="h-px flex-1 bg-ink-200 dark:bg-white/10" />
      </div>

      <GoogleButton
        onClick={() =>
          setNotice('Google sign-in is not connected yet. Log in with your email and password.')
        }
      />
      {notice && (
        <p role="status" className="mt-3 flex gap-2 text-xs text-ink-600 dark:text-ink-300">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {notice}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-ink-600 dark:text-ink-300">
        New to CaseAssist?{' '}
        <Link
          to={ROUTES.signup}
          className="font-medium text-verdigris-700 hover:underline dark:text-verdigris-300"
        >
          Create an account
        </Link>
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-ink-300/70 p-3.5 text-xs leading-relaxed text-ink-600 dark:border-white/15 dark:text-ink-300">
        <p>
          <span className="font-medium text-ink-800 dark:text-ink-100">Demo build.</span> Accounts
          are stored in this browser only. Try{' '}
          <span className="font-mono">{DEMO_ACCOUNT.email}</span> with password{' '}
          <span className="font-mono">{DEMO_ACCOUNT.password}</span>.
        </p>
        <button
          type="button"
          onClick={fillDemo}
          className="mt-2 font-medium text-verdigris-700 hover:underline dark:text-verdigris-300"
        >
          Fill in demo credentials
        </button>
      </div>
    </AuthLayout>
  );
}
