/**
 * The contract between Room Studio and LivLab Expert.
 *
 * This is the ONLY shape that crosses the network to the Expert API. It is
 * deliberately a narrow projection of Room Studio state, not a dump of it:
 *
 *  - every field is optional, and "unknown" is represented by absence rather
 *    than by a zero or a placeholder, so the model can never mistake a default
 *    for a measurement;
 *  - it carries no auth token, no user id, no account data, no room photo;
 *  - numbers are the ones LivLab already computed deterministically. The model
 *    interprets them, it never recomputes them.
 *
 * Safe to import from client code — there are no secrets and no server imports.
 */

export interface ExpertRoomContext {
  /** Metres. */
  length: number;
  width: number;
  height: number;
  floorAreaM2: number;
  floorMaterial?: string;
  wallMaterial?: string;
  /** True when the customer attached a reference photo. The photo itself is
   *  NOT sent — only the fact that one exists, so the Expert can mention it. */
  hasReferencePhoto?: boolean;
}

export interface ExpertProductRef {
  id: string;
  sku?: string;
  name: string;
  brand?: string;
  category: string;
  /** Reference price in VND. Absent when LivLab has no price for this SKU. */
  priceMin?: number;
  priceMax?: number;
  /** Millimetres, and ONLY when stated by the catalogue. Absent means unknown —
   *  it must never be filled in from a category assumption before being sent to
   *  the model, or the model will report a guess as a specification. */
  widthMm?: number;
  depthMm?: number;
  heightMm?: number;
  /** Free-text specs LivLab actually holds, e.g. material, finish, warranty. */
  knownSpecifications?: Record<string, string>;
  imageUrl?: string;
  slug?: string;
}

export interface ExpertPlacedProduct extends ExpertProductRef {
  instanceId: string;
  placementType: string;
}

export interface ExpertBudgetContext {
  /** What the customer said they want to spend. Absent when not provided. */
  targetBudget?: number;
  /** Deterministic sum over placed products, from budgetCalculator. */
  estimatedTotalMin: number;
  estimatedTotalMax: number;
  itemCount: number;
  /** Placed items LivLab has no reference price for. */
  unpricedCount: number;
  /** Present only when targetBudget is set. Computed in code, never by the AI. */
  remainingBudget?: number;
  amountOverBudget?: number;
  /** Verdict from lib/budget/getBudgetFit — the existing deterministic rule. */
  fitStatus?: string;
  fitLabel?: string;
}

/**
 * Where future deterministic checks arrive.
 *
 * The Technical Advisor is NOT implemented in this phase. When
 * checkClearance() / checkDoorCollision() / checkPlumbingCompatibility() /
 * checkInstallationSurface() in lib/room-studio/placementRules.ts start
 * returning real results, they get mapped into this array and the Expert will
 * quote them as facts without any prompt change. Today it carries only the
 * basic room-bounds checks Room Studio already performs.
 */
export interface ExpertValidationResult {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  /** Which deterministic rule produced this, so the Expert can attribute it. */
  source: string;
}

export interface LivLabExpertContext {
  room?: ExpertRoomContext;
  selectedProduct?: ExpertProductRef;
  placedProducts?: ExpertPlacedProduct[];
  budget?: ExpertBudgetContext;
  stylePreferences?: string[];
  quoteBasket?: { productId: string; name: string; quantity: number }[];
  validationResults?: ExpertValidationResult[];
}

/**
 * Limits shared by the client and the server.
 *
 * They live here, in the client-safe contract module, rather than in
 * livlabExpertService — importing them from the service would pull the Gemini
 * SDK and the API-key reader into the browser bundle.
 */
export const MAX_USER_MESSAGE_CHARS = 1000;
export const MAX_HISTORY_MESSAGES = 8;

/** One turn of conversation. History sent to the API is always bounded. */
export interface ExpertMessage {
  role: 'user' | 'assistant';
  text: string;
}

/** A product the Expert recommends. Always resolved from LivLab data server-side. */
export interface ExpertProductSuggestion extends ExpertProductRef {
  /** Why the Expert picked it, in Vietnamese. */
  reason: string;
}

export type ExpertActionKind = 'add-to-quote' | 'add-to-room' | 'view-product';

/**
 * An action the Expert PROPOSES. Rendered as a button — nothing happens until
 * the customer clicks it. The Expert never mutates the room or the quote.
 */
export interface ExpertSuggestedAction {
  kind: ExpertActionKind;
  productId: string;
  label: string;
}

export interface ExpertReply {
  /** Vietnamese prose. Facts in it are constrained by the system prompt. */
  text: string;
  /** Resolved from the catalogue server-side; never model-authored. */
  products: ExpertProductSuggestion[];
  /** Present when the question was budget-related. Numbers are deterministic. */
  budgetCard?: {
    estimatedTotalMin: number;
    estimatedTotalMax: number;
    targetBudget?: number;
    difference?: number;
    fitLabel?: string;
    note: string;
  };
  actions: ExpertSuggestedAction[];
  followUps: string[];
}

export type ExpertApiStatus = 'ok' | 'not-configured' | 'quota' | 'unavailable' | 'invalid' | 'throttled';

export interface ExpertApiResponse {
  status: ExpertApiStatus;
  reply?: ExpertReply;
  /** User-facing Vietnamese message for every non-ok status. */
  message?: string;
}
