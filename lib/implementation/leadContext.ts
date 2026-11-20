import { ELEMENT_LABEL, WALL_LABEL, type ArchitecturalElement } from '../room-studio/architecture';
import type { HumanHandoffPackage, RoomSnapshot } from './types';

/**
 * The machine-readable handoff LivLab writes onto a new lead.
 *
 * Until now the showroom received this context only as prose inside `notes`.
 * A person could read it; a screen could not lay it out, filter on it, or
 * report on it. This is the same information as a versioned snapshot.
 *
 * `version` exists so a later shape change can be detected rather than guessed
 * at. Readers must treat every section as optional: a customer who sent a
 * consultation request from a bare room legitimately has no products and no
 * findings, and an empty section is the truth about that lead.
 */
export interface LeadContextV1 {
  version: 1;
  source: 'ROOM_STUDIO';
  room?: Pick<RoomSnapshot, 'length' | 'width' | 'height' | 'elements'> & { floorAreaM2?: number };
  materials?: { floor?: string; walls?: string };
  budget?: { target?: number; estimatedProductTotal?: number };
  products?: {
    productId: string;
    sku?: string;
    name: string;
    brand?: string;
    quantity: number;
    referencePrice?: number;
  }[];
  technicalFindings?: {
    severity: string;
    title: string;
    message?: string;
    affectedProduct?: string;
  }[];
}

const centimetres = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });
const cm = (metres: number) => centimetres.format(metres * 100);
const glazing = { clear: 'kính trong', frosted: 'kính mờ', tinted: 'kính ám xanh' };

/** Read the dimensions and mechanism as they were at the time of handoff. */
export function describeHandoffElement(el: ArchitecturalElement): string {
  const label = ELEMENT_LABEL[el.type];
  if (el.type === 'shower-partition') {
    const mechanism = { fixed: 'cố định', 'walk-in': 'hở lối vào', hinged: 'cửa bản lề', sliding: 'cửa trượt' }[el.mechanism];
    const entry = el.mechanism === 'fixed' ? '' : (el.entrySide === 'left' ? ', lối vào bên trái' : ', lối vào bên phải');
    const swing = el.mechanism === 'hinged' ? (el.swing === 'forward' ? ', mở về phía trước' : ', mở về phía sau') : '';
    return `${label} · ${mechanism}${entry}${swing} · ${cm(el.length)} × ${cm(el.height)} cm · tâm X ${cm(el.x)}, Z ${cm(el.z)} cm · ${el.rotation}° · ${glazing[el.glazing]}`;
  }
  const location = `${WALL_LABEL[el.wall]} · cách đầu tường ${cm(el.offset)} cm · ${cm(el.width)} × ${cm(el.height)} cm`;
  if (el.type === 'window') {
    const mechanism = el.mechanism === 'fixed' ? 'cố định' : 'mở quay ra ngoài';
    return `${label} · ${location} · bậu ${cm(el.sill)} cm · ${mechanism} · ${glazing[el.glazing]} · khung ${el.frame === 'ivory' ? 'trắng ngà' : 'than chì'}`;
  }
  return `${label} · ${location} · bản lề ${el.hinge === 'left' ? 'trái' : 'phải'} · mở ${el.swing === 'inward' ? 'vào trong' : 'ra ngoài'}`;
}

/**
 * Projects the handoff package into the stored snapshot.
 *
 * Sections are omitted rather than filled with zeroes or placeholders. A
 * budget of 0 would read as "this customer will spend nothing"; absent means
 * "LivLab does not know", which is a different and honest claim.
 */
export function toLeadContext(pkg: HumanHandoffPackage): LeadContextV1 {
  const context: LeadContextV1 = { version: 1, source: 'ROOM_STUDIO' };

  if (pkg.room) {
    context.room = {
      length: pkg.room.length,
      width: pkg.room.width,
      height: pkg.room.height,
      floorAreaM2: pkg.room.floorAreaM2,
      ...(pkg.room.elements?.length ? { elements: pkg.room.elements.map(el => ({ ...el })) } : {}),
    };
    if (pkg.room.floorFinish || pkg.room.wallFinish) {
      context.materials = { floor: pkg.room.floorFinish, walls: pkg.room.wallFinish };
    }
  }

  if (pkg.budget) {
    context.budget = {
      target: pkg.budget.targetBudget,
      // The low end of the reference range: the figure the showroom quotes
      // against, and the one already stored on the lead's estimatedValue.
      estimatedProductTotal: pkg.budget.estimatedProductTotalMin,
    };
  }

  if (pkg.products.length > 0) {
    context.products = pkg.products.map((p) => ({
      productId: p.productId,
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      quantity: p.quantity,
      referencePrice: p.referencePriceMin,
    }));
  }

  if (pkg.technicalFindings.length > 0) {
    context.technicalFindings = pkg.technicalFindings.map((f) => ({
      severity: f.severity,
      title: f.title,
      message: f.message,
      // The product NAME, which is what the Technical Advisor snapshot carries.
      // There is no id to report here, and inventing one would be worse than
      // the name a salesperson can actually act on.
      affectedProduct: f.affectedProduct,
    }));
  }

  return context;
}
