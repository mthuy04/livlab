/**
 * How the Technical Advisor's findings are presented — not what they are.
 *
 * The engine's findings are unchanged; this sorts them into the three
 * questions a customer actually asks: what must I fix, what does LivLab still
 * need from me, and what is already fine. Findings that ask for the same
 * missing data (one per product) are merged into one topic with one short
 * action, instead of the same sentence repeated per fixture.
 */
import type { TechnicalCategory, TechnicalValidationResult } from '@/lib/technical-advisor/types';

export type TopicAction = 'water' | 'data' | 'confirm';

export interface MissingTopic {
  key: TopicAction;
  /** The short CTA, in the customer's words. */
  cta: string;
  title: string;
  summary: string;
  findings: TechnicalValidationResult[];
}

export interface AdvisorGroups {
  action: TechnicalValidationResult[];
  missing: MissingTopic[];
  passed: TechnicalValidationResult[];
  /** Missing-data findings before merging, for the summary count. */
  missingCount: number;
}

/** One sentence on why a kind of issue matters, shown on demand. */
export const WHY_IT_MATTERS: Record<TechnicalCategory, string> = {
  COLLISION: 'Hai thiết bị chiếm cùng một chỗ thì không thể lắp đặt như bản thiết kế.',
  CLEARANCE: 'Thiếu khoảng trống phía trước khiến thiết bị khó sử dụng và khó vệ sinh.',
  ROOM_BOUNDS: 'Thiết bị vượt ra ngoài kích thước phòng sẽ không lắp được thực tế.',
  PLACEMENT_SURFACE: 'Thiết bị cần đúng bề mặt lắp để chịu lực và đi ống kỹ thuật.',
  PLUMBING: 'Vị trí cấp và thoát nước quyết định chi phí và khả năng lắp đặt.',
  DATA_COMPLETENESS: 'Thiếu kích thước thì LivLab chưa thể kiểm tra vị trí cho bạn.',
};

const TOPICS: Record<TopicAction, Omit<MissingTopic, 'findings'>> = {
  water: {
    key: 'water',
    cta: 'Khai báo điểm nước',
    title: 'Chưa có vị trí cấp / thoát nước',
    summary: 'Đánh dấu các điểm nước đã có trong phòng để LivLab kiểm tra khả năng đấu nối.',
  },
  data: {
    key: 'data',
    cta: 'Bổ sung dữ liệu kỹ thuật',
    title: 'Thiếu thông số kỹ thuật',
    summary: 'Một số sản phẩm chưa đủ kích thước hoặc thông số để kiểm tra trọn vẹn.',
  },
  confirm: {
    key: 'confirm',
    cta: 'Xác nhận hiện trạng',
    title: 'Cần xác nhận tại công trình',
    summary: 'LivLab suy ra từ dữ liệu hiện có; kỹ thuật viên nên xác nhận trước khi lắp.',
  },
};

const topicFor = (f: TechnicalValidationResult): TopicAction =>
  f.category === 'PLUMBING' && f.reason === 'MISSING_DATA'
    ? 'water'
    : f.reason === 'INFERRED_DATA'
      ? 'confirm'
      : 'data';

export function groupFindings(findings: TechnicalValidationResult[]): AdvisorGroups {
  const action: TechnicalValidationResult[] = [];
  const passed: TechnicalValidationResult[] = [];
  const byTopic = new Map<TopicAction, TechnicalValidationResult[]>();
  for (const f of findings) {
    if (f.severity === 'SUITABLE') passed.push(f);
    else if (!f.placementIssue && (f.reason === 'MISSING_DATA' || f.reason === 'INFERRED_DATA')) {
      const key = topicFor(f);
      byTopic.set(key, [...(byTopic.get(key) ?? []), f]);
    } else action.push(f);
  }
  // Geometry the customer can fix right now first, then the rest.
  action.sort((a, b) => Number(!a.placementIssue) - Number(!b.placementIssue) || Number(a.severity === 'OPTIMIZE') - Number(b.severity === 'OPTIMIZE'));
  const order: TopicAction[] = ['water', 'data', 'confirm'];
  const missing = order.filter((k) => byTopic.has(k)).map((k) => ({ ...TOPICS[k], findings: byTopic.get(k)! }));
  return { action, missing, passed, missingCount: missing.reduce((n, t) => n + t.findings.length, 0) };
}

/** The first sentence of a message: the card's one-line explanation. */
export function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}
