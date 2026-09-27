/** Plain-text version of an analysis, used by the "Copy summary" button. */
export function formatReport(request, analysis) {
  const lines = [];
  const section = (title, body) => {
    if (!body || (Array.isArray(body) && body.length === 0)) return;
    lines.push('', title, ...(Array.isArray(body) ? body : [body]));
  };

  lines.push(`Case ${request?.caseId ?? ''}: ${request?.title ?? ''}`.trim());
  if (analysis.domain) section('Legal domain', analysis.domain.name);

  section(
    'Key facts',
    analysis.facts.map((f) => `- ${f.label ? `${f.label}: ` : ''}${f.text}`),
  );

  const rights = [
    ...(analysis.rights.summary ? [analysis.rights.summary] : []),
    ...analysis.rights.items.map(
      (r) => `- ${r.title}${r.description ? `: ${r.description}` : ''}`,
    ),
  ];
  section('Your rights', rights);

  section(
    'Relevant laws',
    analysis.laws.map(
      (l) => `- ${l.title}${l.section ? ` (${l.section})` : ''}${l.excerpt ? `: ${l.excerpt}` : ''}`,
    ),
  );

  if (analysis.risk) {
    const r = analysis.risk;
    section('Risk assessment', [
      r.level ? `Level: ${r.level}` : '',
      r.summary,
      ...r.factors.map((f) => `- ${f}`),
    ].filter(Boolean));
  }

  section(
    'Recommended actions',
    analysis.actions.map(
      (a, i) => `${i + 1}. ${a.title}${a.description ? `: ${a.description}` : ''}`,
    ),
  );

  section('Disclaimer', analysis.disclaimer);
  return lines.join('\n');
}
