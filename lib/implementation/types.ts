/**
 * The bridge from LivLab's digital experience to a human conversation.
 *
 * The point of this module is NOT "send a contact form". LivLab already knows
 * the customer's room, the products in it, what they cost and what the
 * Technical Advisor flagged. All of that should follow the customer into the
 * showroom conversation so they never retype what they just built.
 *
 * Everything here is a SNAPSHOT, deliberately. A request records the product
 * names, prices and findings as they were at the moment it was sent, because
 * the room keeps changing afterwards and a showroom quoting against today's
 * room would be quoting against something the customer never saw.
 */

/** Three purposes, not a taxonomy. Each maps to a different human next step. */
export type ImplementationRequestType =
  /** Showroom confirms final price, stock and installation cost. */
  | 'QUOTATION'
  /** Customer wants human advice before committing to a formal quote. */
  | 'SHOWROOM_CONSULTATION'
  /** Someone should verify real installation conditions on site. */
  | 'TECHNICAL_CHECK';

export interface RequestTypeMeta {
  id: ImplementationRequestType;
  label: string;
  /** One sentence telling the customer what actually happens next. */
  outcome: string;
  /** Shown on the success screen. */
  confirmation: string;
}

export const REQUEST_TYPES: Record<ImplementationRequestType, RequestTypeMeta> = {
  QUOTATION: {
    id: 'QUOTATION',
    label: 'Yêu cầu báo giá',
    outcome: 'Showroom xác nhận giá cuối, khuyến mãi, tình trạng cung ứng và chi phí lắp đặt.',
    confirmation:
      'Showroom sẽ liên hệ để xác nhận giá, sản phẩm và điều kiện triển khai.',
  },
  SHOWROOM_CONSULTATION: {
    id: 'SHOWROOM_CONSULTATION',
    label: 'Nhờ showroom tư vấn',
    outcome: 'Nhân viên showroom liên hệ để tư vấn thêm trước khi bạn chốt báo giá.',
    confirmation: 'Showroom sẽ liên hệ để tư vấn thêm về không gian và sản phẩm bạn đang chọn.',
  },
  TECHNICAL_CHECK: {
    id: 'TECHNICAL_CHECK',
    label: 'Cần kỹ thuật viên kiểm tra',
    outcome: 'LivLab chuyển các điểm cần kiểm tra cùng bối cảnh phòng của bạn để xác nhận thực tế.',
    confirmation:
      'Yêu cầu kiểm tra kỹ thuật đã được ghi nhận. Thông tin cần xác nhận sẽ được chuyển cùng bối cảnh không gian của bạn.',
  },
};

// ─── Snapshot pieces ──────────────────────────────────────────────────────────

export interface RoomSnapshot {
  /** Metres. */
  length: number;
  width: number;
  height: number;
  floorAreaM2: number;
  /** Human-readable finish, e.g. "Porcelain · Be · Mờ". */
  floorFinish?: string;
  wallFinish?: string;
  /** True when the customer attached a reference photo. The image itself is
   *  NOT copied here — see the note on roomImageRef below. */
  hasReferencePhoto: boolean;
  /** Count of customer-declared water/drain/electrical points, or undefined
   *  when they never declared any. Absence means "chưa khai báo", not zero. */
  declaredUtilityPoints?: number;
}

export interface ProductSnapshot {
  productId: string;
  sku?: string;
  name: string;
  brand?: string;
  category: string;
  quantity: number;
  /** VND at the time of the request. Absent when LivLab has no price — never
   *  filled in with a guess, because a showroom would read it as a quote. */
  referencePriceMin?: number;
  referencePriceMax?: number;
}

export interface BudgetSnapshot {
  /** What the customer said they wanted to spend. Absent when not provided. */
  targetBudget?: number;
  /** Deterministic sum from budgetCalculator. Reference only — never a price. */
  estimatedProductTotalMin: number;
  estimatedProductTotalMax: number;
  itemCount: number;
  /** Placed items LivLab holds no reference price for. */
  unpricedCount: number;
}

/** A Technical Advisor finding, reduced to what a human needs to act on. */
export interface TechnicalFindingSnapshot {
  severity: string;
  title: string;
  message: string;
  affectedProduct?: string;
  /** True when a showroom or technician must confirm before installation. */
  requiresHumanVerification: boolean;
}

export interface CustomerContact {
  fullName: string;
  phone: string;
  email?: string;
  /** Free text: "Quận 7, TP.HCM". No geocoding, no distance — see §41. */
  serviceArea?: string;
  /** e.g. "Trong giờ hành chính". */
  preferredContactTime?: string;
  notes?: string;
}

/**
 * What crosses from LivLab into the human sales/implementation process.
 * Serializable by construction — no Three.js objects, no React state, no
 * image bytes.
 */
export interface HumanHandoffPackage {
  requestType: ImplementationRequestType;
  customerContact: CustomerContact;
  room?: RoomSnapshot;
  products: ProductSnapshot[];
  budget?: BudgetSnapshot;
  technicalFindings: TechnicalFindingSnapshot[];
  /**
   * A reference to the customer's room photo, never the bytes.
   *
   * Room photos are stored as base64 data URLs in Room Studio state, and
   * copying one into every request would put megabytes into storage that is
   * measured in single-digit megabytes total. The showroom is told a photo
   * exists and retrieves it with the customer.
   */
  roomImageRef?: 'AVAILABLE_ON_REQUEST';
  createdAt: string;
}

/** A stored request: the package plus what happened to it. */
export interface ImplementationRequest {
  /** Customer-facing reference, e.g. "LLQ-2026-004". */
  requestCode: string;
  /** Id returned by the server when the lead was persisted, when it was. */
  leadId?: string;
  package: HumanHandoffPackage;
  /**
   * Whether the request reached the LivLab backend. A request saved locally
   * but not delivered is still shown to the customer with its code — losing it
   * silently would be worse than an honest "chưa đồng bộ".
   */
  delivery: 'DELIVERED' | 'LOCAL_ONLY';
  status: 'NEW';
  createdAt: string;
}
