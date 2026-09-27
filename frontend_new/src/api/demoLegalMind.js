/**
 * TEMPORARY DEMO LAYER for Legal Mind AI.
 *
 * There is no chat endpoint yet, so this module answers a fixed set of
 * question types by re-arranging the analysis already shown on screen
 * (rights, laws, risk, actions, facts). It does NOT call a language model and
 * it does NOT reason about the law. Every reply it produces is labelled
 * `source: 'demo'` and the UI shows that to the user.
 *
 * Delete this file (and the import in chatService.js) once a backend exists.
 */

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });

const NEED_CASE =
  'Analyze your case first so Legal Mind AI can provide context-aware assistance.';

const INTENTS = [
  ['greeting', /^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/i],
  ['rights', /\b(rights?|entitled|entitlement)\b/i],
  ['evidence', /\b(evidence|proof|prove|documents?|records?|witness(es)?)\b/i],
  ['risk', /\b(risk|chances?|likelihood|likely|odds|strength|strong|weak)\b/i],
  ['laws', /\b(laws?|statutes?|acts?|sections?|provisions?|applicable|regulations?|legislation)\b/i],
  ['next', /\b(next|what should i do|steps?|actions?|proceed|options?|how (do|can) i)\b/i],
  ['facts', /\b(summary|summari[sz]e|facts?|recap|what happened)\b/i],
  ['help', /\b(help|what can you|how do you work)\b/i],
];

const detectIntent = (text) => INTENTS.find(([, re]) => re.test(text))?.[0] ?? 'other';

const bullets = (items) => items.map((i) => `- ${i}`).join('\n');
const clip = (s, n = 220) => (s.length > n ? `${s.slice(0, n).trimEnd()}...` : s);
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2, '': 3 };

const CAVEAT =
  'This comes from your analysis results and is general information. It is not a prediction of the outcome.';

const GENERIC_EVIDENCE = [
  'Written agreements or contracts, and any notices that were sent or received',
  'Payment records such as receipts, bank statements or payslips',
  'Messages and emails with the other party, with dates visible',
  'A dated timeline of what happened, written while it is fresh',
  'Names and contact details of anyone who witnessed the events',
];

const REPLIES = {
  greeting: () =>
    'Hello. I can help you work through your case. Ask about your rights, the applicable law, the risk assessment, next steps or useful evidence.',

  help: (ctx) =>
    `In this demo I can walk you through these topics${ctx ? ' for your current case' : ''}:\n${bullets([
      'Your rights',
      'The applicable law',
      'The risk assessment',
      'Recommended next steps',
      'Evidence that could help',
      'A summary of the key facts',
    ])}${ctx ? '' : `\n\n${NEED_CASE}`}`,

  rights: (ctx) => {
    if (!ctx) return NEED_CASE;
    const { summary, items } = ctx.rights;
    if (!summary && items.length === 0) {
      return 'The analysis did not identify specific rights for this case. Adding more detail to the description and analyzing again may help.';
    }
    const lines = items.map((r) => (r.description ? `**${r.title}:** ${r.description}` : r.title));
    return [summary, items.length ? `From your analysis, these rights may apply:\n${bullets(lines)}` : '', CAVEAT]
      .filter(Boolean)
      .join('\n\n');
  },

  laws: (ctx) => {
    if (!ctx) return NEED_CASE;
    if (ctx.laws.length === 0) return 'No laws were retrieved for this case in the analysis.';
    const lines = ctx.laws.map((l) => {
      const head = `**${l.title}${l.section ? ` (${l.section})` : ''}**`;
      return l.excerpt ? `${head}: ${clip(l.excerpt)}` : head;
    });
    return `These are the provisions retrieved for your case:\n${bullets(lines)}\n\nThe full text is in the Retrieved laws card. A lawyer can confirm which provisions apply to your exact facts.`;
  },

  risk: (ctx) => {
    if (!ctx) return NEED_CASE;
    if (!ctx.risk) return 'The analysis did not include a risk assessment for this case.';
    const { level, summary, factors } = ctx.risk;
    return [
      level ? `The analysis rates this case as **${level} risk**.` : 'The analysis did not assign a risk level.',
      summary,
      factors.length ? `What drives the rating:\n${bullets(factors)}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  },

  next: (ctx) => {
    if (!ctx) {
      return `As general first steps in most legal problems:\n${bullets([
        'Gather and keep every document and message related to the problem',
        'Write down a dated timeline of events',
        'Note any deadlines that may apply',
        'Consider speaking to a qualified lawyer before taking formal steps',
      ])}\n\n${NEED_CASE}`;
    }
    if (ctx.actions.length === 0) return 'The analysis did not recommend specific actions for this case.';
    const ordered = [...ctx.actions].sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3),
    );
    const lines = ordered.map((a) => (a.description ? `**${a.title}:** ${a.description}` : a.title));
    return `Your analysis recommends these steps, most urgent first:\n${bullets(lines)}`;
  },

  evidence: (ctx) => {
    const intro = ctx?.facts.length
      ? `Given the facts recorded for your case ("${clip(ctx.facts[0], 110)}"), evidence like this is usually worth gathering:`
      : 'Evidence that commonly helps in legal disputes:';
    return `${intro}\n${bullets(GENERIC_EVIDENCE)}\n\nKeep originals safe, and keep copies in more than one place.${
      ctx ? '' : `\n\n${NEED_CASE}`
    }`;
  },

  facts: (ctx) => {
    if (!ctx) return NEED_CASE;
    if (ctx.facts.length === 0) return 'No key facts were extracted from the description.';
    return `Here are the key facts extracted from your description:\n${bullets(ctx.facts)}\n\nIf any of these are wrong, correct the description and analyze again.`;
  },

  other: (ctx) =>
    `I cannot answer that in demo mode. I can talk through your rights, the applicable law, the risk assessment, next steps, evidence or the key facts.${
      ctx ? '' : `\n\n${NEED_CASE}`
    }`,
};

/** Resolves like the real service will: { reply, source }. */
export async function getDemoReply({ message, caseContext, signal }) {
  await sleep(900 + Math.random() * 700, signal); // lets the typing state be seen
  const intent = detectIntent(message);
  return { reply: REPLIES[intent](caseContext), source: 'demo' };
}
