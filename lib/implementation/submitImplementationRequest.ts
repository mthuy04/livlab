'use client';

/**
 * Delivers an implementation request, reusing LivLab's existing lead backend.
 *
 * There is deliberately no second quote system. All three request types go to
 * the same POST /api/quote that the site's quote form already uses, so they
 * land in the same QuoteLead table and appear in the same showroom dashboard.
 *
 * The one thing that table cannot hold today is the structured Room Studio
 * context — it has no requestType or context column, and adding one would mean
 * migrating a live shared database, which is out of scope for this phase. So
 * the context crosses in two forms:
 *
 *   • `notes` carries a readable Vietnamese briefing. This is not a fallback
 *     hack: a salesperson opening the lead needs prose, not JSON, and this is
 *     the field their dashboard already shows them.
 *   • the full machine-readable snapshot is kept by the repository, ready to be
 *     written to a real column the moment one exists.
 */

import { formatVnd } from '@/lib/room-studio/budgetCalculator';
import { implementationRequestRepository, nextRequestCode } from './implementationRequestRepository';
import { REQUEST_TYPES, type HumanHandoffPackage, type ImplementationRequest } from './types';

/** Mirrors the buckets the existing quote form and budget dashboard use, so
 *  Room Studio leads slot into the same reporting rather than adding a band. */
function toBudgetRange(target?: number): { label?: string; min?: number; max?: number } {
  if (!target || target <= 0) return {};
  if (target < 30_000_000) return { label: 'Dưới 30 triệu', min: 0, max: 30_000_000 };
  if (target <= 60_000_000) return { label: '30–60 triệu', min: 30_000_000, max: 60_000_000 };
  return { label: 'Trên 60 triệu', min: 60_000_000, max: 1_000_000_000 };
}

/**
 * The briefing a showroom reads. Ordered the way a salesperson thinks: what is
 * being asked, for what space, with what in it, at what budget, and what needs
 * checking before anyone promises anything.
 */
export function formatHandoffNotes(pkg: HumanHandoffPackage): string {
  const lines: string[] = [];
  const meta = REQUEST_TYPES[pkg.requestType];

  lines.push(`[LivLab Room Studio] ${meta.label}`);

  if (pkg.room) {
    const r = pkg.room;
    lines.push('', 'KHÔNG GIAN');
    lines.push(`- Kích thước: ${r.length} × ${r.width} × ${r.height} m (${r.floorAreaM2} m² sàn)`);
    if (r.floorFinish) lines.push(`- Sàn: ${r.floorFinish}`);
    if (r.wallFinish) lines.push(`- Tường: ${r.wallFinish}`);
    lines.push(
      r.declaredUtilityPoints !== undefined
        ? `- Điểm cấp/thoát nước khách đã khai báo: ${r.declaredUtilityPoints}`
        : '- Điểm cấp/thoát nước: khách chưa khai báo'
    );
    if (r.hasReferencePhoto) lines.push('- Khách có ảnh phòng thực tế (liên hệ để nhận ảnh).');
  }

  if (pkg.products.length > 0) {
    lines.push('', `SẢN PHẨM (${pkg.products.length})`);
    pkg.products.forEach((p) => {
      const price =
        p.referencePriceMin === undefined
          ? 'chưa có giá tham khảo'
          : `${formatVnd(p.referencePriceMin)}${
              p.referencePriceMax && p.referencePriceMax !== p.referencePriceMin
                ? ` – ${formatVnd(p.referencePriceMax)}`
                : ''
            }`;
      lines.push(`- ${p.name}${p.sku ? ` (${p.sku})` : ''} × ${p.quantity} — ${price}`);
    });
  }

  if (pkg.budget) {
    lines.push('', 'NGÂN SÁCH');
    lines.push(
      `- Chi phí sản phẩm tham khảo: ${formatVnd(pkg.budget.estimatedProductTotalMin)} – ${formatVnd(
        pkg.budget.estimatedProductTotalMax
      )}`
    );
    if (pkg.budget.targetBudget) {
      lines.push(`- Ngân sách khách dự kiến: ${formatVnd(pkg.budget.targetBudget)}`);
    }
    if (pkg.budget.unpricedCount > 0) {
      lines.push(`- ${pkg.budget.unpricedCount} sản phẩm chưa có giá tham khảo.`);
    }
    lines.push('- Giá trên LivLab là giá tham khảo, chưa phải giá cuối.');
  }

  if (pkg.technicalFindings.length > 0) {
    lines.push('', `KỸ THUẬT CẦN XÁC NHẬN (${pkg.technicalFindings.length})`);
    pkg.technicalFindings.forEach((f) => {
      lines.push(`- [${f.severity}] ${f.title}${f.affectedProduct ? ` — ${f.affectedProduct}` : ''}`);
      lines.push(`  ${f.message}`);
    });
    lines.push('- Điều kiện lắp đặt thực tế cần được xác nhận tại công trình.');
  }

  const c = pkg.customerContact;
  if (c.serviceArea || c.preferredContactTime || c.notes) {
    lines.push('', 'KHÁCH HÀNG BỔ SUNG');
    if (c.serviceArea) lines.push(`- Địa điểm triển khai: ${c.serviceArea}`);
    if (c.preferredContactTime) lines.push(`- Thời gian muốn được liên hệ: ${c.preferredContactTime}`);
    if (c.notes) lines.push(`- Ghi chú: ${c.notes}`);
  }

  return lines.join('\n');
}

export interface SubmitResult {
  request: ImplementationRequest;
  /** True when the LivLab backend accepted it; false when only stored locally. */
  delivered: boolean;
}

/**
 * Sends the request and returns the stored record.
 *
 * Never throws for a delivery failure. The customer has given their details and
 * pressed send; turning a backend outage into a lost request (and a lost lead)
 * would be the worst possible outcome. The request is recorded either way, and
 * the result says honestly whether it reached LivLab.
 */
export async function submitImplementationRequest(pkg: HumanHandoffPackage): Promise<SubmitResult> {
  const requestCode = await nextRequestCode();
  const budgetRange = toBudgetRange(pkg.budget?.targetBudget);

  let leadId: string | undefined;
  let delivered = false;

  try {
    const res = await fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: pkg.customerContact.fullName,
        phone: pkg.customerContact.phone,
        email: pkg.customerContact.email || null,
        roomType: 'Phòng tắm',
        budgetRange: budgetRange.label ?? null,
        budgetMin: budgetRange.min ?? null,
        budgetMax: budgetRange.max ?? null,
        // Until QuoteLead has a requestType column, the type leads the notes so
        // it is the first thing a showroom sees on the lead.
        conceptName: `Room Studio · ${REQUEST_TYPES[pkg.requestType].label}`,
        notes: formatHandoffNotes(pkg),
        items: pkg.products.map((p) => ({
          productId: p.productId,
          name: p.name,
          quantity: p.quantity,
          priceMin: p.referencePriceMin,
          priceMax: p.referencePriceMax,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      leadId = data?.lead?.id;
      delivered = true;
    }
  } catch {
    // Offline, blocked, or the API is down. Handled below, not surfaced as a
    // crash.
  }

  const request: ImplementationRequest = {
    requestCode,
    leadId,
    package: pkg,
    delivery: delivered ? 'DELIVERED' : 'LOCAL_ONLY',
    status: 'NEW',
    createdAt: new Date().toISOString(),
  };

  await implementationRequestRepository.createRequest(request);
  return { request, delivered };
}
