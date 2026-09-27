/**
 * Turns the current request + normalized analysis into the plain object that
 * Legal Mind AI receives. Keep this shape stable: it is the contract a real
 * chat backend will consume (see api/chatService.js).
 *
 * @param {{ caseId: string, title: string, problemDescription: string }} request
 * @param {import('./normalizeAnalysis').Analysis} analysis
 */
export function buildCaseContext(request, analysis) {
  if (!request || !analysis) return null;

  return {
    caseId: request.caseId,
    title: request.title,
    problemDescription: request.problemDescription,
    domain: analysis.domain?.name ?? null,
    facts: analysis.facts.map((f) => (f.label ? `${f.label}: ${f.text}` : f.text)),
    rights: {
      summary: analysis.rights.summary,
      items: analysis.rights.items.map(({ title, description, source }) => ({ title, description, source })),
    },
    laws: analysis.laws.map(({ title, section, excerpt, source }) => ({ title, section, excerpt, source })),
    risk: analysis.risk
      ? {
          level: analysis.risk.level,
          score: analysis.risk.score,
          summary: analysis.risk.summary,
          factors: analysis.risk.factors,
        }
      : null,
    actions: analysis.actions.map(({ title, description, priority }) => ({ title, description, priority })),
  };
}
