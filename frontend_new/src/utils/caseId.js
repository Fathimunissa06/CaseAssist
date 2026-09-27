const STORAGE_KEY = 'caseassist-case-counter';

const format = (n) => `CASE-${String(n).padStart(3, '0')}`;

function readCounter() {
  try {
    const n = parseInt(localStorage.getItem(STORAGE_KEY) ?? '1', 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  } catch {
    return 1;
  }
}

/** The ID currently on deck (does not advance the counter). */
export function peekCaseId() {
  return format(readCounter());
}

/** Advance the counter and return the next ID. */
export function nextCaseId() {
  const next = readCounter() + 1;
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    /* storage unavailable: fall through with the in-memory value */
  }
  return format(next);
}
