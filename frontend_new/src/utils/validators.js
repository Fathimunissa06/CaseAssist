const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value) {
  const v = String(value || '').trim();
  if (!v) return 'Enter your email address.';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address, like name@example.com.';
  return '';
}

/** Minimum bar for a new password (the strength meter is guidance on top of this). */
export function validateNewPassword(value) {
  if (!value) return 'Create a password.';
  if (value.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Include at least one letter and one number.';
  return '';
}

/**
 * Strength from 0 (empty) to 4.
 * Counts: 8+ characters, upper and lower case, a number, a symbol.
 * Anything under 8 characters is capped at "Weak".
 */
export function getPasswordStrength(password) {
  const pw = String(password || '');
  if (!pw) return { score: 0, label: '', missing: [] };

  const checks = [
    { ok: pw.length >= 8, hint: 'use 8 or more characters' },
    { ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw), hint: 'mix upper and lower case' },
    { ok: /\d/.test(pw), hint: 'add a number' },
    { ok: /[^A-Za-z0-9]/.test(pw), hint: 'add a symbol' },
  ];

  let score = checks.filter((c) => c.ok).length;
  if (pw.length < 8) score = Math.min(score, 1);
  score = Math.max(score, 1);

  return {
    score,
    label: ['', 'Weak', 'Fair', 'Good', 'Strong'][score],
    missing: checks.filter((c) => !c.ok).map((c) => c.hint),
  };
}
