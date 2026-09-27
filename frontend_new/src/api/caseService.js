import { apiClient, ApiError } from './client';
import { normalizeAnalysis, hasAnalysisContent } from '@/utils/normalizeAnalysis';
import { buildMockResponse } from '@/utils/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * The backend is known to accept { query }. The form also collects a case ID and
 * title, so by default both shapes are sent (extra JSON keys are ignored by
 * FastAPI/Pydantic unless the model forbids them). Override with
 * VITE_ANALYZE_PAYLOAD = "both" | "query" | "legacy".
 */
const PAYLOAD_MODE = import.meta.env.VITE_ANALYZE_PAYLOAD || 'both';

function buildPayload({ caseId, title, problemDescription }) {
  const legacy = { caseId, title, problemDescription };
  const query = { query: problemDescription };
  if (PAYLOAD_MODE === 'query') return query;
  if (PAYLOAD_MODE === 'legacy') return legacy;
  return { ...query, ...legacy };
}

export const USING_MOCK_DATA = USE_MOCK;

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
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
}

/**
 * POST /api/analyze
 *
 * @param {{ caseId: string, title: string, problemDescription: string }} payload
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('@/utils/normalizeAnalysis').Analysis>}
 */
export async function analyzeCase(payload, { signal } = {}) {
  let raw;

  if (USE_MOCK) {
    await sleep(6500, signal);
    raw = buildMockResponse(payload);
  } else {
    const response = await apiClient.post('/api/analyze', buildPayload(payload), { signal });
    raw = response.data;
  }

  const analysis = normalizeAnalysis(raw);
  if (!hasAnalysisContent(analysis)) {
    throw new ApiError(
      'The server responded, but the analysis came back empty. Add more detail to the description and try again.',
      { kind: 'empty' },
    );
  }
  return analysis;
}
