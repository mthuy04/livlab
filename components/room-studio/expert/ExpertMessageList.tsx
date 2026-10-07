'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, Sparkles } from 'lucide-react';
import type { ExpertChatMessage, ExpertUiState } from './useLivLabExpert';
import ExpertProductCard from './ExpertProductCard';
import ExpertBudgetCard from './ExpertBudgetCard';

interface ExpertMessageListProps {
  messages: ExpertChatMessage[];
  uiState: ExpertUiState;
  statusMessage: string | null;
  onRetry: () => void;
  onAddToRoom: (productId: string) => void;
  onAddToQuote: (productId: string) => void;
  onFollowUp: (prompt: string) => void;
}

export default function ExpertMessageList({
  messages,
  uiState,
  statusMessage,
  onRetry,
  onAddToRoom,
  onAddToQuote,
  onFollowUp,
}: ExpertMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, uiState]);

  const isDegraded = uiState === 'quota' || uiState === 'unavailable' || uiState === 'not-configured' || uiState === 'error';

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((message) =>
        message.role === 'user' ? (
          <div key={message.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#123C5A] px-3.5 py-2 text-sm text-white">
              {message.text}
            </div>
          </div>
        ) : (
          <div key={message.id} className="space-y-2.5">
            <div className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D8E2EA] bg-white">
                <Sparkles className="h-3.5 w-3.5 text-[#C8A96A]" />
              </div>
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-[#D8E2EA] bg-white px-3.5 py-2 text-sm leading-relaxed text-[#0B1623]">
                {message.text}
              </div>
            </div>

            {message.reply?.budgetCard && (
              <div className="pl-9">
                <ExpertBudgetCard card={message.reply.budgetCard} />
              </div>
            )}

            {message.reply?.products && message.reply.products.length > 0 && (
              <div className="space-y-2 pl-9">
                {message.reply.products.map((product) => (
                  <ExpertProductCard
                    key={product.id}
                    product={product}
                    onAddToRoom={onAddToRoom}
                    onAddToQuote={onAddToQuote}
                  />
                ))}
              </div>
            )}

            {message.reply?.followUps && message.reply.followUps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-9">
                {message.reply.followUps.map((followUp) => (
                  <button
                    key={followUp}
                    type="button"
                    onClick={() => onFollowUp(followUp)}
                    className="rounded-full border border-[#D8E2EA] bg-white px-3 py-1.5 text-[11px] font-medium text-[#123C5A] transition-colors hover:border-[#C8A96A] hover:bg-[#F3F7FA]"
                  >
                    {followUp}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {uiState === 'thinking' && (
        <div className="flex gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D8E2EA] bg-white">
            <Sparkles className="h-3.5 w-3.5 text-[#C8A96A]" />
          </div>
          <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-[#D8E2EA] bg-white px-4 py-3">
            {[0, 0.2, 0.4].map((delay) => (
              <span
                key={delay}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#627386]"
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Degraded states are informational, never blocking: the panel stays
          usable and Room Studio behind it is untouched. */}
      {isDegraded && statusMessage && (
        <div className="flex gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-xs leading-relaxed text-[#0B1623]">{statusMessage}</p>
            {uiState !== 'not-configured' && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-[#123C5A] transition-colors hover:bg-[#F3F7FA]"
              >
                Thử lại
              </button>
            )}
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
