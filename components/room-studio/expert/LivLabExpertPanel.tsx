'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Sparkles, X } from 'lucide-react';
import type { QuoteItem } from '@/lib/types';
import type { RoomState } from '@/lib/room-studio/roomState';
import type { BudgetEstimate } from '@/lib/room-studio/budgetCalculator';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import type { RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import { buildExpertContext } from '@/lib/room-studio/expertContextBuilder';
import { buildIntentPrompt, type ExpertIntent } from '@/lib/room-studio/expertNudges';
import { useLivLabExpert } from './useLivLabExpert';
import ExpertMessageList from './ExpertMessageList';
import ExpertComposer from './ExpertComposer';
import ExpertQuickActions from './ExpertQuickActions';

interface LivLabExpertPanelProps {
  open: boolean;
  /**
   * Set when the panel was opened from a proactive nudge's call to action.
   * `id` changes on every request so tapping the same CTA twice asks twice;
   * without it the effect below could not tell a repeat from a re-render.
   */
  request?: { intent: ExpertIntent; id: number } | null;
  onClose: () => void;
  state: RoomState;
  placedViews: PlacedProductView[];
  selected: PlacedProductView | null;
  budget: BudgetEstimate;
  products: RoomStudioProduct[];
  quoteItems: QuoteItem[];
  onAddProductToRoom: (product: RoomStudioProduct) => void;
  onAddProductToQuote: (product: RoomStudioProduct) => void;
}

/**
 * LivLab Expert, embedded in Room Studio.
 *
 * Desktop: a right-hand side panel. Mobile: a bottom sheet. Neither covers the
 * 3D canvas fully, so the customer can keep looking at the room while reading
 * the advice about it.
 *
 * The z-index clears the site-wide floating support bubble (z-[100]), which
 * otherwise sits directly on top of the message composer's send button.
 *
 * The panel owns no product truth. Everything it displays either comes back
 * from the server validated against the catalogue, or is state Room Studio
 * already holds.
 */
export default function LivLabExpertPanel({
  open,
  request,
  onClose,
  state,
  placedViews,
  selected,
  budget,
  products,
  quoteItems,
  onAddProductToRoom,
  onAddProductToQuote,
}: LivLabExpertPanelProps) {
  // Rebuilt from live Room Studio state on every change — locally, with no API
  // call. Gemini only sees this when the customer actually asks something.
  const context = useMemo(
    () => buildExpertContext({ state, placedViews, selected, budget, quoteItems }),
    [state, placedViews, selected, budget, quoteItems]
  );

  const expert = useLivLabExpert(context);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const resolveProduct = useCallback(
    (productId: string) => products.find((p) => p.id === productId),
    [products]
  );

  // The Expert proposes; the customer disposes. Nothing below runs unless a
  // button is clicked — the Expert never mutates the room or the quote itself.
  const handleAddToRoom = useCallback(
    (productId: string) => {
      const product = resolveProduct(productId);
      if (!product) {
        setActionNotice('Sản phẩm này hiện chưa có trong danh mục đang tải.');
        return;
      }
      onAddProductToRoom(product);
      setActionNotice(`Đã đưa ${product.name} vào phòng.`);
    },
    [resolveProduct, onAddProductToRoom]
  );

  const handleAddToQuote = useCallback(
    (productId: string) => {
      const product = resolveProduct(productId);
      if (!product) {
        setActionNotice('Sản phẩm này hiện chưa có trong danh mục đang tải.');
        return;
      }
      onAddProductToQuote(product);
      setActionNotice(`Đã thêm ${product.name} vào giỏ báo giá.`);
    },
    [resolveProduct, onAddProductToQuote]
  );

  // A CTA opens the panel and immediately asks the matching question, so the
  // customer lands in a conversation that is already about what they tapped
  // rather than on an empty composer. This is the ONLY place a nudge reaches
  // Gemini — showing the bubble itself costs nothing.
  // The guard, not the dependency list, is what makes this fire once per
  // request: the effect may re-run freely, but a request id is consumed only
  // the first time it is seen.
  const consumedRequestId = useRef<number | null>(null);
  useEffect(() => {
    if (!open || !request) return;
    if (consumedRequestId.current === request.id) return;
    consumedRequestId.current = request.id;
    void expert.send(buildIntentPrompt(request.intent, selected?.product.name));
  }, [open, request, expert, selected]);

  const handleRetry = useCallback(() => {
    if (expert.lastUserMessage) void expert.send(expert.lastUserMessage);
  }, [expert]);

  if (!open) return null;

  return (
    <>
      {/* Mobile-only scrim. On desktop the panel sits beside the studio and the
          canvas stays visible and interactive. */}
      <div
        className="fixed inset-0 z-[105] bg-[#0B1623]/30 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-label="LivLab Expert"
        className="fixed inset-x-0 bottom-0 z-[110] flex h-[82vh] flex-col overflow-hidden rounded-t-3xl border border-[#D8E2EA] bg-[#F8FAFC] shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[400px] md:rounded-none md:rounded-l-3xl"
      >
        <header className="flex shrink-0 items-center justify-between bg-[#0B1623] px-4 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <Sparkles className="h-4 w-4 text-[#C8A96A]" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">LivLab Expert</p>
              <p className="text-[10px] leading-tight text-white/50">Tư vấn sản phẩm &amp; ngân sách</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={expert.clear}
              title="Bắt đầu lại cuộc trò chuyện"
              aria-label="Bắt đầu lại cuộc trò chuyện"
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng LivLab Expert"
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <ExpertMessageList
          messages={expert.messages}
          uiState={expert.uiState}
          statusMessage={expert.statusMessage}
          onRetry={handleRetry}
          onAddToRoom={handleAddToRoom}
          onAddToQuote={handleAddToQuote}
          onFollowUp={expert.send}
        />

        {actionNotice && (
          <div className="shrink-0 border-t border-[#D8E2EA] bg-[#EEF4F7] px-4 py-2">
            <p className="text-[11px] font-medium text-[#123C5A]">{actionNotice}</p>
          </div>
        )}

        <ExpertQuickActions
          actions={expert.quickActions}
          disabled={expert.isThinking}
          onSelect={expert.send}
        />

        <ExpertComposer disabled={expert.isThinking} onSend={expert.send} />
      </aside>
    </>
  );
}
