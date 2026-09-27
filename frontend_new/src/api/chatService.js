import { apiClient, ApiError } from './client';
import { getDemoReply } from './demoLegalMind';

/**
 * Legal Mind AI service boundary.
 *
 * The UI only ever calls sendLegalMindMessage(). Today it is answered by the
 * clearly-labelled demo layer. To connect a real backend, set
 * VITE_CHAT_ENDPOINT (for example "/api/chat"); no component changes needed.
 *
 * Expected backend contract:
 *   POST {VITE_CHAT_ENDPOINT}
 *   body:     { message, caseContext, history }
 *               caseContext: null | { caseId, title, problemDescription, domain,
 *                 facts[], rights{summary,items[]}, laws[], risk, actions[] }
 *               history:     [{ role: 'user' | 'assistant', content }]
 *   response: { reply: string }   (also accepted: answer | response | message)
 */
const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_ENDPOINT || '';

export const CHAT_MODE = CHAT_ENDPOINT ? 'backend' : 'demo';

const pickReply = (data) => {
  if (typeof data === 'string') return data.trim();
  for (const key of ['reply', 'answer', 'response', 'message']) {
    if (typeof data?.[key] === 'string' && data[key].trim()) return data[key].trim();
  }
  return '';
};

/**
 * @param {{ message: string, caseContext: object|null, history?: {role:string, content:string}[], signal?: AbortSignal }} args
 * @returns {Promise<{ reply: string, source: 'demo' | 'backend' }>}
 */
export async function sendLegalMindMessage({ message, caseContext, history = [], signal }) {
  if (CHAT_MODE === 'demo') {
    return getDemoReply({ message, caseContext, signal });
  }

  const { data } = await apiClient.post(CHAT_ENDPOINT, { message, caseContext, history }, { signal });
  const reply = pickReply(data);
  if (!reply) {
    throw new ApiError('Legal Mind AI returned an empty answer. Try rephrasing your question.', {
      kind: 'empty',
    });
  }
  return { reply, source: 'backend' };
}
