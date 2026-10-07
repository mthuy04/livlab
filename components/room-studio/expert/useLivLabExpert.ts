'use client';

/**
 * Client state for LivLab Expert.
 *
 * Gemini is called on exactly two triggers: the customer sends a message, or
 * taps a quick action. Room Studio state changes update the context locally and
 * never call the API — that is what keeps the feature inside the free tier
 * while still letting the Expert know what the customer is doing.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { ExpertApiResponse, ExpertReply, LivLabExpertContext } from '@/lib/ai/expert/expertContext';
import { buildOpeningMessage, buildQuickActions } from '@/lib/ai/expert/expertOpening';

export type ExpertUiState = 'ready' | 'thinking' | 'error' | 'quota' | 'unavailable' | 'not-configured';

export interface ExpertChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Structured payload attached to an assistant turn. */
  reply?: ExpertReply;
  /** True for the locally generated greeting — never sent to the model. */
  isOpening?: boolean;
}

/** Turns sent to the API. Bounded here as well as server-side. */
const HISTORY_LIMIT = 8;

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `m${Date.now().toString(36)}_${messageCounter}`;
}

export function useLivLabExpert(context: LivLabExpertContext) {
  const [messages, setMessages] = useState<ExpertChatMessage[]>([]);
  const [uiState, setUiState] = useState<ExpertUiState>('ready');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  // The conversation lives in component state for as long as Room Studio is
  // open — it survives closing and reopening the panel, and every room edit.
  // A page refresh clears it. Persisting it properly is tied to the auth and
  // database work this phase deliberately leaves alone, and a half-restored
  // transcript whose room no longer matches would be worse than none.

  // The greeting is recomputed from live context until the customer says
  // something, so opening the panel after adding a product reflects that.
  const openingText = useMemo(() => buildOpeningMessage(context), [context]);
  const quickActions = useMemo(() => buildQuickActions(context), [context]);

  const visibleMessages = useMemo<ExpertChatMessage[]>(() => {
    const opening: ExpertChatMessage = {
      id: 'opening',
      role: 'assistant',
      text: openingText,
      isOpening: true,
    };
    return [opening, ...messages];
  }, [openingText, messages]);

  const send = useCallback(async (text: string) => {
    const message = text.trim();
    if (!message) return;

    // One request at a time: a second send cancels the first rather than
    // stacking two Gemini calls.
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: message }]);
    setUiState('thinking');
    setStatusMessage(null);

    try {
      const history = messages
        .filter((m) => !m.isOpening)
        .slice(-HISTORY_LIMIT)
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/ai/expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, context }),
        signal: controller.signal,
      });

      const data: ExpertApiResponse = await res.json();

      if (data.status === 'ok' && data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: 'assistant', text: data.reply!.text, reply: data.reply },
        ]);
        setUiState('ready');
        return;
      }

      // Every non-ok status is a degraded state, not a crash: Room Studio keeps
      // working and the customer is told plainly what happened.
      const fallbackState: ExpertUiState =
        data.status === 'quota'
          ? 'quota'
          : data.status === 'not-configured'
            ? 'not-configured'
            : data.status === 'throttled'
              ? 'error'
              : 'unavailable';
      setUiState(fallbackState);
      setStatusMessage(data.message ?? 'LivLab Expert hiện chưa phản hồi được.');
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      setUiState('unavailable');
      setStatusMessage('Không kết nối được tới LivLab Expert. Bạn vẫn có thể tiếp tục dùng Room Studio.');
    } finally {
      if (inFlight.current === controller) inFlight.current = null;
    }
  }, [messages, context]);

  const clear = useCallback(() => {
    inFlight.current?.abort();
    setMessages([]);
    setUiState('ready');
    setStatusMessage(null);
  }, []);

  /** Last question the customer asked, so an error state can offer a retry. */
  const lastUserMessage = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'user')?.text ?? null,
    [messages]
  );

  return {
    messages: visibleMessages,
    quickActions,
    uiState,
    statusMessage,
    isThinking: uiState === 'thinking',
    lastUserMessage,
    send,
    clear,
  };
}
