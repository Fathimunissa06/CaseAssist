import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeCase } from '@/api/caseService';
import { isAbortError, toApiError } from '@/api/client';

const IDLE = { status: 'idle', data: null, error: null, request: null };

/**
 * Owns the lifecycle of one analysis request.
 * status: 'idle' | 'loading' | 'success' | 'error'
 */
export function useAnalyzeCase() {
  const [state, setState] = useState(IDLE);
  const controllerRef = useRef(null);
  const lastRequestRef = useRef(null);

  const analyze = useCallback(async (payload) => {
    // A newer request always supersedes an in-flight one.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    lastRequestRef.current = payload;

    setState({ status: 'loading', data: null, error: null, request: payload });

    try {
      const data = await analyzeCase(payload, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setState({ status: 'success', data, error: null, request: payload });
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) return;
      setState({ status: 'error', data: null, error: toApiError(err), request: payload });
    }
  }, []);

  /** Abort any in-flight request and return to the empty state. */
  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(IDLE);
  }, []);

  const retry = useCallback(() => {
    if (lastRequestRef.current) analyze(lastRequestRef.current);
  }, [analyze]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { ...state, analyze, retry, reset, cancel: reset };
}
