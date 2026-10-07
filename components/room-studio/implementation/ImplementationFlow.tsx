'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import type { RoomState } from '@/lib/room-studio/roomState';
import type { BudgetEstimate } from '@/lib/room-studio/budgetCalculator';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import type { TechnicalValidationResult } from '@/lib/technical-advisor/types';
import { buildHandoffPackage } from '@/lib/implementation/buildHandoffPackage';
import { submitImplementationRequest } from '@/lib/implementation/submitImplementationRequest';
import {
  REQUEST_TYPES,
  type CustomerContact,
  type HumanHandoffPackage,
  type ImplementationRequest,
  type ImplementationRequestType,
} from '@/lib/implementation/types';
import RequestTypeChooser from './RequestTypeChooser';
import RequestContactForm from './RequestContactForm';
import RequestReview from './RequestReview';
import RequestSuccess from './RequestSuccess';

interface ImplementationFlowProps {
  open: boolean;
  /** Set when opened from a contextual CTA, skipping the chooser. */
  initialType?: ImplementationRequestType | null;
  onClose: () => void;
  state: RoomState;
  placedViews: PlacedProductView[];
  budget: BudgetEstimate;
  findings: TechnicalValidationResult[];
}

type Step = 'choose' | 'form' | 'review' | 'success';

/**
 * "Tiếp tục với không gian này" — the bridge from a designed room to a human.
 *
 * Four steps, and the review step is not optional: the customer sees exactly
 * what is about to be sent, including their own contact details, before
 * anything leaves the browser. LivLab Expert can open this flow and preselect a
 * request type, but it can never advance past review — submitting is always the
 * customer's click.
 *
 * Desktop: centred modal. Mobile: bottom sheet. z-[120] clears the Expert panel
 * (z-[110]) and the site-wide support bubble (z-[100]), because this flow is
 * opened FROM the Expert and must sit above it.
 */
export default function ImplementationFlow({
  open,
  initialType,
  onClose,
  state,
  placedViews,
  budget,
  findings,
}: ImplementationFlowProps) {
  // Initialised, never reset. The parent remounts this component on every open
  // (see its `key`), so a fresh flow is guaranteed by construction rather than
  // by an effect that has to remember to clear six pieces of state.
  const [step, setStep] = useState<Step>(initialType ? 'form' : 'choose');
  const [requestType, setRequestType] = useState<ImplementationRequestType | null>(initialType ?? null);
  const [contact, setContact] = useState<CustomerContact | null>(null);
  const [pkg, setPkg] = useState<HumanHandoffPackage | null>(null);
  const [result, setResult] = useState<ImplementationRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  // Guards against a double click producing two leads. A ref, not state,
  // because the second click can land before React re-renders.
  const inFlight = useRef(false);

  const verifyCount = findings.filter((f) => f.severity === 'VERIFY').length;

  // Focus the dialog so keyboard and screen-reader users land inside it rather
  // than continuing from wherever they were in the studio behind.
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Escape must not discard a request that is mid-flight.
      if (e.key === 'Escape' && !inFlight.current) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleContact = useCallback(
    (value: CustomerContact) => {
      if (!requestType) return;
      setContact(value);
      // The snapshot is taken HERE, not at submit: it must reflect the room the
      // customer just reviewed, even if something changes behind the modal.
      setPkg(
        buildHandoffPackage({
          requestType,
          customerContact: value,
          state,
          placedViews,
          budget,
          findings,
        })
      );
      setStep('review');
    },
    [requestType, state, placedViews, budget, findings]
  );

  const handleSubmit = useCallback(async () => {
    if (!pkg || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const { request } = await submitImplementationRequest(pkg);
      setResult(request);
      setStep('success');
    } catch {
      // submitImplementationRequest already absorbs delivery failures, so
      // reaching here means something unexpected. Keep the customer's typed
      // details and let them retry rather than dropping them back to step one.
      setError('Không gửi được yêu cầu. Thông tin của bạn vẫn được giữ — vui lòng thử lại.');
      inFlight.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [pkg]);

  if (!open) return null;

  // Keyed off the STEP, not just the chosen type: going back to the chooser
  // with a type still selected would otherwise leave the header announcing a
  // request the customer is no longer looking at.
  const title =
    step === 'success'
      ? 'Đã gửi yêu cầu'
      : step === 'choose' || !requestType
        ? 'Tiếp tục với không gian này'
        : REQUEST_TYPES[requestType].label;

  const canGoBack = (step === 'form' && !initialType) || step === 'review';

  return (
    <>
      <div
        className="fixed inset-0 z-[115] bg-[#0B1623]/45 backdrop-blur-sm"
        onClick={() => !inFlight.current && onClose()}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 z-[120] flex max-h-[92vh] flex-col overflow-hidden rounded-t-3xl border border-[#D8E2EA] bg-white shadow-2xl focus:outline-none sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[88vh] sm:w-[min(520px,calc(100vw-2rem))] sm:rounded-3xl"
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-[#E6EDF2] px-4 py-3.5">
          {canGoBack ? (
            <button
              type="button"
              onClick={() => setStep(step === 'review' ? 'form' : 'choose')}
              aria-label="Quay lại bước trước"
              className="-ml-1 rounded-lg p-1.5 text-[#627386] transition-colors hover:bg-[#F3F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96A]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <span className="h-1 w-1" aria-hidden="true" />
          )}

          <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#0B1623]">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Đóng"
            className="-mr-1 rounded-lg p-1.5 text-[#627386] transition-colors hover:bg-[#F3F7FA] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96A]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {step === 'choose' && (
            <RequestTypeChooser
              verifyCount={verifyCount}
              productCount={placedViews.length}
              onChoose={(type) => {
                setRequestType(type);
                setStep('form');
              }}
            />
          )}

          {step === 'form' && requestType && (
            <RequestContactForm
              requestType={requestType}
              initial={contact ?? undefined}
              onSubmit={handleContact}
            />
          )}

          {step === 'review' && pkg && (
            <RequestReview
              pkg={pkg}
              submitting={submitting}
              error={error}
              onBack={() => setStep('form')}
              onSubmit={handleSubmit}
            />
          )}

          {step === 'success' && result && <RequestSuccess request={result} onClose={onClose} />}
        </div>
      </div>
    </>
  );
}
