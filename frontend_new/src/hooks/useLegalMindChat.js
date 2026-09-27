import { useCallback, useEffect, useRef, useState } from 'react';
import { sendLegalMindMessage } from '@/api/chatService';
import { isAbortError } from '@/api/client';

export const GREETING =
  'Hello, I am Legal Mind AI. How can I help with your case? You can ask about your rights, the applicable law, the risk assessment, next steps or evidence.';

let counter = 0;
const createMessage = (role, content, extra = {}) => ({
  id: `m${Date.now().toString(36)}-${counter++}`,
  role, // 'user' | 'assistant' | 'system'
  content,
  ...extra,
});

const initialMessages = () => [createMessage('assistant', GREETING, { source: 'greeting' })];

const toHistory = (messages) =>
  messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && !m.error && m.source !== 'greeting')
    .slice(-10)
    .map(({ role, content }) => ({ role, content }));

const errorText = (err) =>
  err?.message && err?.name === 'ApiError'
    ? err.message
    : 'Legal Mind AI could not answer right now. Try again in a moment.';

/**
 * Conversation state for Legal Mind AI.
 * `caseContext` is read at send time, so answers always use the latest analysis.
 */
export function useLegalMindChat(caseContext) {
  const [messages, setMessages] = useState(initialMessages);
  const [isSending, setIsSending] = useState(false);

  const contextRef = useRef(caseContext);
  const messagesRef = useRef(messages);
  const controllerRef = useRef(null);
  const previousContextRef = useRef(caseContext);

  useEffect(() => {
    contextRef.current = caseContext;
  }, [caseContext]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => () => controllerRef.current?.abort(), []);

  // Tell the reader in-line when the case the assistant is using changes.
  useEffect(() => {
    if (previousContextRef.current === caseContext) return;
    previousContextRef.current = caseContext;
    const note = caseContext
      ? `Case context updated: ${caseContext.title}`
      : 'Case context cleared';
    setMessages((m) => [...m, createMessage('system', note)]);
  }, [caseContext]);

  const request = useCallback(async (text, history) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsSending(true);

    try {
      const result = await sendLegalMindMessage({
        message: text,
        caseContext: contextRef.current,
        history,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setMessages((m) => [...m, createMessage('assistant', result.reply, { source: result.source })]);
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) return;
      setMessages((m) => [...m, createMessage('assistant', errorText(err), { error: true })]);
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setIsSending(false);
      }
    }
  }, []);

  const send = useCallback(
    (raw) => {
      const text = String(raw || '').trim();
      if (!text || controllerRef.current) return;
      const userMessage = createMessage('user', text);
      setMessages((m) => [...m, userMessage]);
      request(text, toHistory([...messagesRef.current, userMessage]));
    },
    [request],
  );

  /** Re-ask the last question after a failed answer. */
  const retry = useCallback(() => {
    if (controllerRef.current) return;
    const current = messagesRef.current;
    const lastUser = [...current].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    const kept = current.filter((m) => !m.error);
    setMessages(kept);
    request(lastUser.content, toHistory(kept));
  }, [request]);

  const stop = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.abort();
    controllerRef.current = null;
    setIsSending(false);
    setMessages((m) => [...m, createMessage('system', 'You stopped this response.')]);
  }, []);

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsSending(false);
    setMessages(initialMessages());
  }, []);

  return { messages, isSending, send, stop, retry, clear };
}
