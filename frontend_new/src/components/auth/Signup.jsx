import { useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Mail, UserRound } from 'lucide-react';
import AuthLayout from './AuthLayout';
import GoogleButton from './GoogleButton';
import InputWithIcon from './InputWithIcon';
import PasswordField from './PasswordField';
import PasswordStrength from './PasswordStrength';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Field from '@/components/ui/Field';
import { Link } from '@/router/NavigationContext';
import { ROUTES } from '@/router/routes';
import { useAuth } from '@/auth/AuthContext';
import { validateEmail, validateNewPassword } from '@/utils/validators';

const FIELDS = ['name', 'email', 'password', 'confirm', 'terms'];

function validate(v) {
  const e = {};
  const name = v.name.trim();
  if (!name) e.name = 'Enter your full name.';
  else if (name.length < 2) e.name = 'Use at least 2 characters for your name.';

  const email = validateEmail(v.email);
  if (email) e.email = email;

  const pw = validateNewPassword(v.password);
  if (pw) e.password = pw;

  if (!v.confirm) e.confirm = 'Confirm your password.';
  else if (v.confirm !== v.password) e.confirm = 'Passwords do not match.';

  if (!v.terms) e.terms = 'Accept the Terms & Conditions to create an account.';
  return e;
}

export default function Signup() {
  const { signUp } = useAuth();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '', terms: false });
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const refs = useRef({});

  const errors = validate(values);
  const shown = (name) => serverErrors[name] || (touched[name] ? errors[name] : undefined);

  const update = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setServerErrors({});
    setFormError('');
  };
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setNotice('');

    const invalid = FIELDS.filter((n) => errors[n]);
    if (invalid.length) {
      setTouched(Object.fromEntries(FIELDS.map((n) => [n, true])));
      refs.current[invalid[0]]?.focus();
      return;
    }

    setLoading(true);
    setFormError('');
    try {
      await signUp({ name: values.name, email: values.email, password: values.password, remember: true });
      // App redirects to /app once the session exists.
    } catch (err) {
      if (err?.field) {
        setServerErrors({ [err.field]: err.message });
        refs.current[err.field]?.focus();
      } else {
        setFormError(err?.message || 'Could not create the account. Try again.');
      }
      setLoading(false);
    }
  };

  const passwordsMatch = values.confirm && values.confirm === values.password;

  return (
    <AuthLayout>
      <h2 className="font-serif text-3xl font-medium leading-tight">Create your account</h2>
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
        Start analyzing your case with Legal Mind AI.
      </p>

      {formError && (
        <div role="alert" className="mt-5 flex gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <fieldset disabled={loading} className="min-w-0 space-y-4 border-0 p-0">
          <Field label="Full name" error={shown('name')}>
            {(props) => (
              <InputWithIcon
                {...props}
                ref={(el) => (refs.current.name = el)}
                icon={UserRound}
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={values.name}
                onChange={update('name')}
                onBlur={blur('name')}
              />
            )}
          </Field>

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

          <div>
            <PasswordField
              label="Password"
              error={shown('password')}
              inputRef={(el) => (refs.current.password = el)}
              autoComplete="new-password"
              placeholder="Create a password"
              value={values.password}
              onChange={update('password')}
              onBlur={blur('password')}
            />
            <PasswordStrength password={values.password} />
          </div>

          <div>
            <PasswordField
              label="Confirm password"
              error={shown('confirm')}
              inputRef={(el) => (refs.current.confirm = el)}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={values.confirm}
              onChange={update('confirm')}
              onBlur={blur('confirm')}
            />
            {passwordsMatch && !shown('confirm') && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <CircleCheck className="size-3.5" aria-hidden="true" />
                Passwords match
              </p>
            )}
          </div>

          <Checkbox
            ref={(el) => (refs.current.terms = el)}
            checked={values.terms}
            error={shown('terms')}
            onChange={(e) => {
              setValues((v) => ({ ...v, terms: e.target.checked }));
              setTouched((t) => ({ ...t, terms: true }));
            }}
          >
            I agree to the{' '}
            <span className="font-medium text-ink-900 dark:text-white">Terms &amp; Conditions</span>{' '}
            and understand CaseAssist provides legal information, not legal advice.
          </Checkbox>
        </fieldset>

        <Button type="submit" loading={loading} className="w-full">
          {loading ? 'Creating account' : 'Create account'}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-500 dark:text-ink-400">
        <span className="h-px flex-1 bg-ink-200 dark:bg-white/10" />
        or
        <span className="h-px flex-1 bg-ink-200 dark:bg-white/10" />
      </div>

      <GoogleButton
        onClick={() => setNotice('Google sign-up is not connected yet. Create an account with your email.')}
      >
        Sign up with Google
      </GoogleButton>
      {notice && (
        <p role="status" className="mt-3 text-xs text-ink-600 dark:text-ink-300">
          {notice}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-ink-600 dark:text-ink-300">
        Already have an account?{' '}
        <Link to={ROUTES.login} className="font-medium text-verdigris-700 hover:underline dark:text-verdigris-300">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
