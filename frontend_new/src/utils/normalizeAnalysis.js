/**
 * The backend may name fields differently (camelCase, snake_case) or return
 * strings, arrays of strings, or arrays of objects for the same section.
 * This module converts whatever arrives into one predictable shape so the UI
 * components never have to guess.
 *
 * @typedef {Object} Analysis
 * @property {{ name: string, confidence: number|null, description: string }|null} domain
 * @property {{ label: string, text: string }[]} facts
 * @property {{ title: string, section: string, excerpt: string, source: string, score: number|null }[]} laws
 * @property {{ summary: string, items: { title: string, description: string, source: string }[] }} rights
 * @property {{ level: 'low'|'moderate'|'high'|'critical'|null, score: number|null, summary: string, factors: string[] }|null} risk
 * @property {{ title: string, description: string, priority: 'high'|'medium'|'low'|'', priorityLabel: string }[]} actions
 * @property {string} disclaimer
 */

export const DEFAULT_DISCLAIMER =
  'CaseAssist provides general legal information and is not a substitute for advice from a qualified lawyer.';

/* ------------------------------------------------------------------ */
/* Key aliases                                                         */
/* ------------------------------------------------------------------ */

const KEYS = {
  domain: ['domain', 'legalDomain', 'legal_domain', 'category'],
  facts: ['extractedFacts', 'extracted_facts', 'facts', 'keyFacts', 'key_facts'],
  laws: [
    'legalRetrieval', 'legal_retrieval',
    'legalRetrievalResults', 'legal_retrieval_results',
    'retrievedLaws', 'retrieved_laws',
    'retrievalResults', 'retrieval_results',
    'relevantLaws', 'relevant_laws', 'laws',
  ],
  rights: ['rightsAnalysis', 'rights_analysis', 'rights'],
  risk: ['riskAssessment', 'risk_assessment', 'risk'],
  actions: [
    'recommendedActions', 'recommended_actions',
    'actions', 'nextSteps', 'next_steps', 'recommendations',
  ],
  disclaimer: ['disclaimer', 'legalDisclaimer', 'legal_disclaimer'],
};

const ALL_KEYS = Object.values(KEYS).flat();
const LIST_KEYS = [
  'items', 'results', 'list', 'matches', 'documents', 'data',
  'rights', 'facts', 'laws', 'actions', 'provisions', 'statutes',
];
const TEXT_KEYS = [
  'text', 'content', 'description', 'summary', 'statement', 'fact', 'value',
  'explanation', 'details', 'title', 'name', 'action', 'right', 'factor',
  'risk', 'issue', 'concern',
];
const SUMMARY_KEYS = ['summary', 'overview', 'analysis', 'explanation', 'description'];

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const stripBullet = (s) => String(s).replace(/^\s*(?:[-*\u2022]|\d+[.)])\s+/, '').trim();

function firstDefined(obj, keys) {
  if (!isObj(obj)) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

/** Best-effort conversion of any value into readable text. */
function toText(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(', ');
  if (isObj(v)) {
    const direct = firstText(v, TEXT_KEYS);
    if (direct) return direct;
    return Object.values(v).map(toText).filter(Boolean).join('; ');
  }
  return '';
}

function firstText(obj, keys) {
  if (!isObj(obj)) return '';
  for (const k of keys) {
    if (obj[k] === undefined || obj[k] === null) continue;
    const text = toText(obj[k]);
    if (text) return text;
  }
  return '';
}

/** Turn arrays, newline-separated strings, or { items: [...] } wrappers into an array. */
function toList(v) {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    return v.split(/\r?\n/).map(stripBullet).filter(Boolean);
  }
  if (isObj(v)) {
    const inner = firstDefined(v, LIST_KEYS);
    return Array.isArray(inner) ? inner : [v];
  }
  return [v];
}

/** snake_case / camelCase key -> "Sentence case". */
function humanize(key) {
  const s = String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Convert a score to 0-100.
 * 0-1 is read as a fraction, 1-10 as "out of 10", 10-100 as a percentage.
 */
function toScore(v) {
  if (v === null || v === undefined || v === '') return null;
  let n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!Number.isFinite(n) || n < 0) return null;
  if (typeof v === 'string' && v.includes('%')) return Math.min(100, Math.round(n));
  if (n <= 1) n *= 100;
  else if (n <= 10) n *= 10;
  else if (n > 100) return null;
  return Math.round(n);
}

/** Unwrap { data: {...} } / { result: {...} } envelopes. */
function unwrap(payload) {
  let cur = payload;
  for (let i = 0; i < 3; i += 1) {
    if (!isObj(cur)) break;
    if (ALL_KEYS.some((k) => k in cur)) break;
    const inner = firstDefined(cur, ['data', 'result', 'analysis', 'response', 'output']);
    if (!isObj(inner)) break;
    cur = inner;
  }
  return isObj(cur) ? cur : {};
}

/* ------------------------------------------------------------------ */
/* Section normalizers                                                 */
/* ------------------------------------------------------------------ */

function normalizeDomain(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') {
    const name = raw.trim();
    return name ? { name, confidence: null, description: '' } : null;
  }
  if (isObj(raw)) {
    const name = firstText(raw, ['name', 'domain', 'primary', 'label', 'category', 'type']);
    if (!name) return null;
    return {
      name,
      confidence: toScore(raw.confidence ?? raw.score ?? raw.probability),
      description: firstText(raw, ['description', 'summary', 'explanation', 'reasoning']),
    };
  }
  return null;
}

function normalizeFacts(raw) {
  // A plain { label: value } dictionary
  if (isObj(raw) && firstDefined(raw, LIST_KEYS) === undefined) {
    return Object.entries(raw)
      .map(([label, value]) => ({ label: humanize(label), text: toText(value) }))
      .filter((f) => f.text);
  }
  return toList(raw)
    .map((item) => {
      if (isObj(item)) {
        const label = toText(firstDefined(item, ['label', 'type', 'category', 'key']));
        const text = firstText(item, ['fact', 'text', 'description', 'value', 'content', 'statement']);
        return { label: text ? label : '', text: text || label };
      }
      return { label: '', text: stripBullet(toText(item)) };
    })
    .filter((f) => f.text);
}

function normalizeLaws(raw) {
  return toList(raw)
    .map((item) => {
      if (isObj(item)) {
        const title = firstText(item, [
          'title', 'name', 'act', 'law', 'statute', 'case_name', 'caseName', 'heading', 'document',
        ]);
        const section = firstText(item, [
          'section', 'article', 'clause', 'provision', 'citation', 'reference', 'ref',
        ]);
        const excerpt = firstText(item, [
          'text', 'content', 'excerpt', 'description', 'summary', 'snippet', 'passage',
        ]);
        const source = firstText(item, ['source', 'url', 'link', 'jurisdiction', 'court', 'origin']);
        const score = toScore(
          item.score ?? item.relevance ?? item.similarity ?? item.confidence
            ?? item.relevance_score ?? item.relevanceScore,
        );
        if (!title && !section && !excerpt) return null;
        return {
          title: title || section,
          section: title ? section : '',
          excerpt,
          source,
          score,
        };
      }
      const text = stripBullet(toText(item));
      return text ? { title: text, section: '', excerpt: '', source: '', score: null } : null;
    })
    .filter(Boolean);
}

function normalizeRights(raw) {
  const empty = { summary: '', items: [] };
  if (raw === null || raw === undefined) return empty;

  // Object without a list inside: either { summary } or a { right: explanation } dictionary
  if (isObj(raw) && firstDefined(raw, LIST_KEYS) === undefined) {
    const summary = firstText(raw, SUMMARY_KEYS);
    if (summary) return { summary, items: [] };
    return {
      summary: '',
      items: Object.entries(raw)
        .map(([key, value]) => ({ title: humanize(key), description: toText(value), source: '' }))
        .filter((i) => i.description),
    };
  }

  const summary = isObj(raw) ? firstText(raw, SUMMARY_KEYS) : '';
  const items = toList(raw)
    .map((item) => {
      if (isObj(item)) {
        const title = firstText(item, ['right', 'title', 'name', 'heading']);
        const description = firstText(item, [
          'description', 'explanation', 'details', 'analysis', 'text', 'summary',
        ]);
        const source = firstText(item, ['basis', 'source', 'law', 'statute', 'citation', 'reference']);
        if (!title && !description) return null;
        return title
          ? { title, description, source }
          : { title: description, description: '', source };
      }
      const text = stripBullet(toText(item));
      return text ? { title: text, description: '', source: '' } : null;
    })
    .filter(Boolean);

  return { summary, items };
}

const RISK_LEVELS = ['low', 'moderate', 'high', 'critical'];

function detectLevel(text) {
  const t = String(text || '').toLowerCase();
  if (!t) return null;
  if (/critical|severe|extreme|very high/.test(t)) return 'critical';
  if (/\bhigh\b|major|serious/.test(t)) return 'high';
  if (/medium|moderate|mid/.test(t)) return 'moderate';
  if (/\blow\b|minimal|minor|negligible/.test(t)) return 'low';
  return null;
}

function levelFromScore(score) {
  if (score === null) return null;
  if (score < 30) return 'low';
  if (score < 60) return 'moderate';
  if (score < 85) return 'high';
  return 'critical';
}

function normalizeRisk(raw) {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text) return null;
    const words = text.split(/\s+/).length;
    return {
      level: detectLevel(text.slice(0, 40)),
      score: null,
      summary: words > 2 ? text : '',
      factors: [],
    };
  }

  if (!isObj(raw)) return null;

  const levelText = firstText(raw, [
    'level', 'risk_level', 'riskLevel', 'severity', 'rating', 'overall', 'overall_risk',
    'overallRisk', 'category', 'label',
  ]);
  const score = toScore(raw.score ?? raw.risk_score ?? raw.riskScore ?? raw.probability);
  const summary = firstText(raw, [
    'summary', 'explanation', 'description', 'reasoning', 'rationale', 'analysis', 'assessment',
  ]);
  const factors = toList(
    firstDefined(raw, [
      'factors', 'risk_factors', 'riskFactors', 'risks', 'key_risks', 'concerns', 'issues',
    ]),
  )
    .map(toText)
    .filter(Boolean);

  const level = detectLevel(levelText) ?? levelFromScore(score);
  if (!level && score === null && !summary && factors.length === 0) return null;
  return { level, score, summary, factors };
}

function normalizePriority(text) {
  const t = String(text || '').toLowerCase();
  if (!t) return '';
  if (/high|urgent|critical|immediate/.test(t)) return 'high';
  if (/medium|moderate|normal/.test(t)) return 'medium';
  if (/low|optional/.test(t)) return 'low';
  return '';
}

function normalizeActions(raw) {
  return toList(raw)
    .map((item) => {
      if (isObj(item)) {
        const title = firstText(item, ['action', 'title', 'step', 'name', 'recommendation']);
        const description = firstText(item, [
          'description', 'details', 'explanation', 'rationale', 'text',
        ]);
        const priorityLabel = firstText(item, ['priority', 'urgency', 'importance']);
        if (!title && !description) return null;
        return {
          title: title || description,
          description: title ? description : '',
          priority: normalizePriority(priorityLabel),
          priorityLabel,
        };
      }
      const text = stripBullet(toText(item));
      return text ? { title: text, description: '', priority: '', priorityLabel: '' } : null;
    })
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * @param {unknown} payload Parsed JSON body from POST /api/analyze
 * @returns {Analysis}
 */
export function normalizeAnalysis(payload) {
  const src = unwrap(payload);
  return {
    domain: normalizeDomain(firstDefined(src, KEYS.domain)),
    facts: normalizeFacts(firstDefined(src, KEYS.facts)),
    laws: normalizeLaws(firstDefined(src, KEYS.laws)),
    rights: normalizeRights(firstDefined(src, KEYS.rights)),
    risk: normalizeRisk(firstDefined(src, KEYS.risk)),
    actions: normalizeActions(firstDefined(src, KEYS.actions)),
    disclaimer: toText(firstDefined(src, KEYS.disclaimer)) || DEFAULT_DISCLAIMER,
  };
}

export function hasAnalysisContent(a) {
  return Boolean(
    a.domain || a.facts.length || a.laws.length || a.rights.items.length
      || a.rights.summary || a.risk || a.actions.length,
  );
}

export { RISK_LEVELS };
