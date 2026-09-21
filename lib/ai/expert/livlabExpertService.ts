/**
 * LivLab Expert orchestration. The API route is a thin wrapper over this.
 *
 * Flow, in order — this order IS the anti-hallucination design:
 *   1. Run deterministic tools to build a candidate product set from the real
 *      catalogue, chosen from the customer's question and Room Studio state.
 *   2. Render the context and candidates into a compact prompt block.
 *   3. Ask Gemini for structured JSON: prose + candidate ids it wants to show.
 *   4. Re-resolve every returned id against the catalogue server-side, dropping
 *      anything that is not a real LivLab product, and attach the real facts.
 *
 * The model's prose is the only thing it authors. Every product fact the
 * customer sees is read back out of LivLab data in step 4.
 */

import { Type } from '@google/genai';
import { getBudgetFit } from '@/lib/budget/getBudgetFit';
import { getAIProvider } from '../geminiProvider';
import type { AIMessage } from '../aiProvider';
import { EXPERT_SYSTEM_PROMPT } from './expertSystemPrompt';
import { getProductSpecs, searchProducts, type SearchProductsCriteria } from './expertTools';
import {
  MAX_HISTORY_MESSAGES,
  MAX_USER_MESSAGE_CHARS,
} from './expertContext';
import type {
  ExpertApiResponse,
  ExpertProductRef,
  ExpertProductSuggestion,
  ExpertReply,
  ExpertSuggestedAction,
  LivLabExpertContext,
} from './expertContext';

export { MAX_HISTORY_MESSAGES, MAX_USER_MESSAGE_CHARS };

const MAX_CANDIDATES = 14;
const MAX_RECOMMENDATIONS = 4;

/** Vietnamese copy for every degraded state. Room Studio keeps working in all of them. */
export const EXPERT_STATUS_MESSAGES: Record<string, string> = {
  'not-configured':
    'LivLab Expert chưa được kích hoạt trên môi trường này. Bạn vẫn có thể tiếp tục dựng phòng, chọn sản phẩm và gửi yêu cầu báo giá.',
  quota:
    'LivLab Expert đang tạm bận. Bạn vẫn có thể tiếp tục thiết kế và chọn sản phẩm, thử lại sau ít phút nhé.',
  unavailable:
    'Hiện chưa kết nối được tới LivLab Expert. Bạn vẫn có thể tiếp tục dùng Room Studio bình thường.',
  invalid: 'Câu hỏi chưa hợp lệ. Bạn thử diễn đạt ngắn gọn lại giúp tôi nhé.',
  throttled: 'Bạn gửi hơi nhanh. Chờ một chút rồi gửi lại giúp tôi nhé.',
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING },
    recommendedProductIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    productReasons: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          productId: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['productId', 'reason'],
      },
    },
    isBudgetQuestion: { type: Type.BOOLEAN },
    budgetNote: { type: Type.STRING },
    followUps: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['reply', 'recommendedProductIds', 'productReasons', 'isBudgetQuestion', 'followUps'],
};

interface ExpertModelOutput {
  reply: string;
  recommendedProductIds: string[];
  productReasons: { productId: string; reason: string }[];
  isBudgetQuestion: boolean;
  budgetNote?: string;
  followUps: string[];
}

const CATEGORY_KEYWORDS: { category: string; words: string[] }[] = [
  { category: 'lavabo', words: ['lavabo', 'chậu rửa', 'chau rua', 'bồn rửa', 'basin'] },
  { category: 'toilet', words: ['bồn cầu', 'bon cau', 'toilet', 'bàn cầu'] },
  { category: 'shower', words: ['sen', 'shower', 'vòi sen', 'sen cây'] },
  { category: 'faucet', words: ['vòi', 'voi', 'faucet'] },
  { category: 'mirror', words: ['gương', 'guong', 'mirror'] },
  { category: 'vanity', words: ['tủ lavabo', 'tủ chậu', 'vanity'] },
];

/**
 * Decides which deterministic searches to run for this question.
 *
 * The model is not asked to pick criteria — that would need a second round
 * trip. The heuristics below are intentionally simple; when they find nothing
 * specific, the fallback is a spread across the categories already in the room
 * (or the common ones), which is always a reasonable candidate set.
 */
export async function buildCandidates(
  message: string,
  context: LivLabExpertContext
): Promise<ExpertProductRef[]> {
  const text = message.toLowerCase();
  const seen = new Map<string, ExpertProductRef>();
  const add = (products: ExpertProductRef[]) => {
    for (const p of products) if (!seen.has(p.id)) seen.set(p.id, p);
  };

  const mentioned = CATEGORY_KEYWORDS.filter(({ words }) => words.some((w) => text.includes(w))).map(
    (c) => c.category
  );

  // "Rẻ hơn / tiết kiệm / vượt ngân sách" -> look below what is already placed.
  const wantsCheaper = /rẻ|re hon|tiết kiệm|tiet kiem|vượt ngân sách|vuot ngan sach|tối ưu|toi uu|giảm/.test(text);
  // "Nhỏ hơn / chật / tiết kiệm diện tích" -> constrain by the room's short side.
  const wantsSmaller = /nhỏ hơn|nho hon|chật|chat|tiết kiệm diện tích|gọn|nhỏ gọn|compact/.test(text);

  const roomShortSideMm = context.room ? Math.min(context.room.length, context.room.width) * 1000 : undefined;

  const criteriaFor = (category: string): SearchProductsCriteria => {
    const criteria: SearchProductsCriteria = { category, limit: 5 };
    if (wantsCheaper) {
      // Ceiling = the cheapest placed item in that category, so alternatives are
      // genuinely cheaper than what the customer already has.
      const placedHere = (context.placedProducts || []).filter(
        (p) => p.category && p.category.toLowerCase().includes(category)
      );
      const cheapest = placedHere.map((p) => p.priceMin ?? 0).filter((n) => n > 0).sort((a, b) => a - b)[0];
      if (cheapest) criteria.maxPrice = cheapest;
    }
    if (wantsSmaller && roomShortSideMm) {
      criteria.maxWidthMm = Math.round(roomShortSideMm * 0.45);
    }
    return criteria;
  };

  for (const category of mentioned) {
    add(await searchProducts(criteriaFor(category)));
  }

  // Nothing named explicitly: offer alternatives for what is already in the room,
  // or a starting spread when the room is empty.
  if (seen.size === 0) {
    const placedCategories = Array.from(
      new Set((context.placedProducts || []).map((p) => p.category?.toLowerCase() ?? '').filter(Boolean))
    );
    const fallbackCategories =
      placedCategories.length > 0
        ? CATEGORY_KEYWORDS.filter((c) => placedCategories.some((pc) => pc.includes(c.category))).map(
            (c) => c.category
          )
        : ['lavabo', 'toilet', 'shower', 'faucet'];
    for (const category of fallbackCategories.slice(0, 4)) {
      add(await searchProducts(criteriaFor(category)));
    }
  }

  return Array.from(seen.values()).slice(0, MAX_CANDIDATES);
}

/** Compact, readable context block. Deliberately not a JSON dump of app state. */
function renderContextBlock(context: LivLabExpertContext, candidates: ExpertProductRef[]): string {
  const lines: string[] = [];
  const vnd = (n?: number) => (n === undefined ? 'chưa có' : `${new Intl.NumberFormat('vi-VN').format(n)}đ`);
  const mm = (n?: number) => (n === undefined ? 'chưa có dữ liệu' : `${n} mm`);

  if (context.room) {
    const r = context.room;
    lines.push(
      `PHÒNG: ${r.length} m (dài) × ${r.width} m (rộng) × ${r.height} m (cao), diện tích sàn ${r.floorAreaM2.toFixed(1)} m².` +
        (r.floorMaterial ? ` Vật liệu sàn: ${r.floorMaterial}.` : '') +
        (r.wallMaterial ? ` Vật liệu tường: ${r.wallMaterial}.` : '') +
        (r.hasReferencePhoto ? ' Khách có đính kèm ảnh phòng tham chiếu.' : '')
    );
  } else {
    lines.push('PHÒNG: khách chưa nhập kích thước phòng.');
  }

  if (context.placedProducts?.length) {
    lines.push('SẢN PHẨM ĐANG CÓ TRONG PHÒNG:');
    context.placedProducts.forEach((p) => {
      lines.push(
        `- [${p.id}] ${p.name}${p.brand ? ` (${p.brand})` : ''} — nhóm ${p.category}, giá tham khảo ${vnd(p.priceMin)}${
          p.priceMax && p.priceMax !== p.priceMin ? ` – ${vnd(p.priceMax)}` : ''
        }, rộng ${mm(p.widthMm)}, sâu ${mm(p.depthMm)}, cao ${mm(p.heightMm)}`
      );
    });
  } else {
    lines.push('SẢN PHẨM ĐANG CÓ TRONG PHÒNG: chưa có sản phẩm nào.');
  }

  if (context.selectedProduct) {
    const p = context.selectedProduct;
    lines.push(
      `SẢN PHẨM ĐANG CHỌN: [${p.id}] ${p.name}${p.brand ? ` (${p.brand})` : ''}, mã ${p.sku ?? 'chưa có'}, ` +
        `giá tham khảo ${vnd(p.priceMin)}${p.priceMax && p.priceMax !== p.priceMin ? ` – ${vnd(p.priceMax)}` : ''}, ` +
        `rộng ${mm(p.widthMm)}, sâu ${mm(p.depthMm)}, cao ${mm(p.heightMm)}.` +
        (p.knownSpecifications
          ? ` Thông số LivLab có: ${Object.entries(p.knownSpecifications)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ')}.`
          : ' LivLab chưa có thêm thông số nào khác cho sản phẩm này.')
    );
  }

  if (context.budget) {
    const b = context.budget;
    const parts = [
      `Tổng chi phí sản phẩm tham khảo hiện tại: ${vnd(b.estimatedTotalMin)} – ${vnd(b.estimatedTotalMax)} cho ${b.itemCount} sản phẩm.`,
    ];
    if (b.unpricedCount > 0) parts.push(`${b.unpricedCount} sản phẩm chưa có giá tham khảo.`);
    if (b.targetBudget !== undefined) {
      parts.push(`Ngân sách mục tiêu của khách: ${vnd(b.targetBudget)}.`);
      if (b.amountOverBudget !== undefined && b.amountOverBudget > 0) {
        parts.push(`ĐANG VƯỢT ngân sách ${vnd(b.amountOverBudget)}.`);
      } else if (b.remainingBudget !== undefined) {
        parts.push(`Còn lại trong ngân sách: ${vnd(b.remainingBudget)}.`);
      }
      if (b.fitLabel) parts.push(`Đánh giá của hệ thống: ${b.fitLabel}.`);
    } else {
      parts.push('Khách chưa đặt ngân sách mục tiêu.');
    }
    lines.push(`NGÂN SÁCH (đã được LivLab tính sẵn, dùng đúng các con số này): ${parts.join(' ')}`);
  }

  if (context.stylePreferences?.length) {
    lines.push(`PHONG CÁCH KHÁCH CHỌN: ${context.stylePreferences.join(', ')}.`);
  }

  if (context.quoteBasket?.length) {
    lines.push(
      `GIỎ BÁO GIÁ HIỆN TẠI: ${context.quoteBasket.map((i) => `${i.name} × ${i.quantity}`).join('; ')}.`
    );
  }

  if (context.validationResults?.length) {
    lines.push('KẾT QUẢ KIỂM TRA TỰ ĐỘNG:');
    context.validationResults.forEach((v) => lines.push(`- [${v.severity}] ${v.message} (nguồn: ${v.source})`));
  }

  lines.push('');
  lines.push(
    'SẢN PHẨM LIVLAB (chỉ được giới thiệu sản phẩm trong danh sách này, dùng đúng id trong ngoặc vuông):'
  );
  if (candidates.length === 0) {
    lines.push('- (không tìm thấy sản phẩm phù hợp trong danh mục LivLab cho câu hỏi này)');
  } else {
    candidates.forEach((p) => {
      lines.push(
        `- [${p.id}] ${p.name}${p.brand ? ` — ${p.brand}` : ''} — nhóm ${p.category}, giá tham khảo ${vnd(
          p.priceMin
        )}${p.priceMax && p.priceMax !== p.priceMin ? ` – ${vnd(p.priceMax)}` : ''}, rộng ${mm(p.widthMm)}, sâu ${mm(
          p.depthMm
        )}, cao ${mm(p.heightMm)}`
      );
    });
  }

  return lines.join('\n');
}

export interface ExpertRequest {
  message: string;
  history: { role: 'user' | 'assistant'; text: string }[];
  context: LivLabExpertContext;
}

export async function askLivLabExpert(request: ExpertRequest): Promise<ExpertApiResponse> {
  const message = (request.message ?? '').trim();
  if (!message || message.length > MAX_USER_MESSAGE_CHARS) {
    return { status: 'invalid', message: EXPERT_STATUS_MESSAGES.invalid };
  }

  const provider = getAIProvider();
  if (!provider.isConfigured()) {
    return { status: 'not-configured', message: EXPERT_STATUS_MESSAGES['not-configured'] };
  }

  const context = request.context ?? {};
  const candidates = await buildCandidates(message, context);
  const contextBlock = renderContextBlock(context, candidates);

  const history: AIMessage[] = (request.history ?? [])
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role === 'assistant' ? ('model' as const) : ('user' as const), text: m.text }));

  const result = await provider.generateJson<ExpertModelOutput>({
    systemInstruction: EXPERT_SYSTEM_PROMPT,
    history,
    message: `BỐI CẢNH HIỆN TẠI CỦA KHÁCH\n${contextBlock}\n\nCÂU HỎI CỦA KHÁCH\n${message}`,
    responseSchema: RESPONSE_SCHEMA,
    temperature: 0.4,
    maxOutputTokens: 1600,
  });

  if (!result.ok) {
    const status = result.reason === 'quota' ? 'quota' : result.reason === 'not-configured' ? 'not-configured' : 'unavailable';
    return { status, message: EXPERT_STATUS_MESSAGES[status] };
  }

  console.info('[LivLab Expert] ok', {
    model: result.meta.model,
    latencyMs: result.meta.latencyMs,
    candidates: candidates.length,
    recommended: result.data.recommendedProductIds?.length ?? 0,
  });

  return { status: 'ok', reply: await buildReply(result.data, candidates, context) };
}

/**
 * Turns the model's output into the reply the customer sees.
 *
 * Every recommended id is re-resolved against the catalogue here — ids the
 * model invented, or copied from elsewhere, simply vanish. Prices, dimensions
 * and specs on the cards come from LivLab data, never from the model's prose.
 */
async function buildReply(
  output: ExpertModelOutput,
  candidates: ExpertProductRef[],
  context: LivLabExpertContext
): Promise<ExpertReply> {
  const reasonById = new Map((output.productReasons ?? []).map((r) => [r.productId, r.reason]));
  const candidateById = new Map(candidates.map((c) => [c.id, c]));

  const products: ExpertProductSuggestion[] = [];
  for (const id of (output.recommendedProductIds ?? []).slice(0, MAX_RECOMMENDATIONS)) {
    // Prefer the candidate we already built; otherwise verify against the
    // catalogue so a valid-but-uncandidated id still resolves to real facts.
    const resolved = candidateById.get(id) ?? (await getProductSpecs(id));
    if (!resolved) continue;
    if (products.some((p) => p.id === resolved.id)) continue;
    products.push({ ...resolved, reason: reasonById.get(id) ?? '' });
  }

  const actions: ExpertSuggestedAction[] = products.flatMap((p) => [
    { kind: 'add-to-room' as const, productId: p.id, label: 'Đưa vào phòng' },
    { kind: 'add-to-quote' as const, productId: p.id, label: 'Thêm vào giỏ báo giá' },
  ]);

  let budgetCard: ExpertReply['budgetCard'];
  const b = context.budget;
  if (output.isBudgetQuestion && b) {
    const fit = getBudgetFit({ total: b.estimatedTotalMin, budgetMax: b.targetBudget ?? null });
    budgetCard = {
      estimatedTotalMin: b.estimatedTotalMin,
      estimatedTotalMax: b.estimatedTotalMax,
      targetBudget: b.targetBudget,
      difference:
        b.targetBudget === undefined ? undefined : b.targetBudget - b.estimatedTotalMin,
      fitLabel: b.targetBudget === undefined ? undefined : fit.label,
      note:
        output.budgetNote?.trim() ||
        'Giá tham khảo. Showroom xác nhận giá cuối, khuyến mãi, tồn kho và chi phí lắp đặt.',
    };
  }

  return {
    text: output.reply?.trim() || 'Tôi chưa có đủ thông tin để trả lời câu hỏi này.',
    products,
    budgetCard,
    actions,
    followUps: (output.followUps ?? []).filter(Boolean).slice(0, 3),
  };
}
