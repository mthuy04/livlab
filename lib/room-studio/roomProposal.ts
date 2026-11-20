import { STYLE_PACKS } from './stylePacks';
import { ELEMENT_LABEL, WALL_LABEL, isWallElement, openingFitsWall } from './architecture';
import { partitionFits } from './glassGeometry';
import { buildEntries, runTechnicalAdvisor } from '../technical-advisor/engine';
import { compareProposalFindings } from '../technical-advisor/proposalGate';
import type { TechnicalValidationResult } from '../technical-advisor/types';
import { calculateRoomBudget, type BudgetEstimate } from './budgetCalculator';
import { ARCHITECTURE_LABEL, parseArchitecture } from './environment';
import { commitRoom, type RoomHistory } from './roomHistory';
import { applyRoomOperations, type ResolveProduct, type RoomOperation } from './roomOperations';
import type { RoomState } from './roomState';

export interface ProposalRequest {
  source: 'architecture' | 'starter' | 'demo' | 'smart-fix' | 'replacement' | 'style' | 'copilot';
  label: string;
  operations: RoomOperation[];
  intendedIssueId?: string;
  notes?: string[];
  selectOnApply?: string;
}
export interface RoomProposal extends ProposalRequest {
  sourceRevision: number;
  preview: RoomState | null;
  changes: string[];
  findings: TechnicalValidationResult[];
  validation: ReturnType<typeof compareProposalFindings> | null;
  budget: { before: BudgetEstimate; after: BudgetEstimate; difference: { min: number; max: number } | null } | null;
  eligible: boolean;
  errors: string[];
}

function inspect(state: RoomState, resolve: ResolveProduct) {
  const views = state.placedProducts.flatMap(placed => {
    const product = resolve(placed.productId, placed.variant);
    return product ? [{ placed, product }] : [];
  });
  const missing = state.placedProducts.length - views.length;
  const budget = calculateRoomBudget(views.map(({ product }) => ({ product, quantity: 1 })));
  budget.unpricedCount += missing;
  budget.itemCount += missing;
  const entries = buildEntries(views);
  const findings = runTechnicalAdvisor({
    room: state.dimensions, architecture: state.architecture, elements: state.elements, entries, utilityPoints: state.utilityPoints ?? [],
    counterSupport: parseArchitecture(state.architecture).basinCounter,
  }, { strict: true });
  return { findings, budget, missing, entries };
}

function describeChanges(before: RoomState, after: RoomState, resolve: ResolveProduct): string[] {
  const changes: string[] = [];
  if (after.visualStyle && JSON.stringify(before.visualStyle)!==JSON.stringify(after.visualStyle))
    changes.push('Phong cách · '+STYLE_PACKS[after.visualStyle.id].name);
  const name = (id: string) => resolve(id)?.name ?? id;
  if (JSON.stringify(before.dimensions) !== JSON.stringify(after.dimensions)) {
    changes.push(`Kích thước phòng: ${after.dimensions.length} × ${after.dimensions.width} × ${after.dimensions.height} m`);
  }
  for (const surface of ['floor', 'walls'] as const) {
    if (JSON.stringify(before.surfaceStyles[surface]) !== JSON.stringify(after.surfaceStyles[surface])) {
      changes.push(surface === 'floor' ? 'Đổi vật liệu sàn' : 'Đổi vật liệu tường');
    }
  }
  if (before.lighting !== after.lighting) changes.push('Đổi ánh sáng');
  const oldArchitecture = parseArchitecture(before.architecture);
  const architecture = parseArchitecture(after.architecture);
  for (const key of Object.keys(architecture) as (keyof typeof architecture)[]) {
    if (key !== 'window' && key !== 'glassPartition' && architecture[key] !== oldArchitecture[key]) changes.push(`${architecture[key] ? 'Bật' : 'Tắt'} ${ARCHITECTURE_LABEL[key].name.toLowerCase()}`);
  }
  for (const el of after.elements) {
    const old = before.elements.find(e => e.id === el.id);
    if (!old || Object.entries(el).some(([k,v]) => !Object.hasOwn(old,k) || Reflect.get(old,k) !== v)) {
      const location = el.type === 'shower-partition' ? Math.round(el.rotation) + '°' : WALL_LABEL[el.wall];
      const width = el.type === 'shower-partition' ? el.length : el.width;
      changes.push(`${old ? 'Chỉnh' : 'Thêm'} ${ELEMENT_LABEL[el.type].toLowerCase()} · ${location} · ${Math.round(width * 100)} × ${Math.round(el.height * 100)} cm`);
    }
  }
  for (const el of before.elements) {
    if (!after.elements.some(e => e.id === el.id)) changes.push('Gỡ ' + ELEMENT_LABEL[el.type].toLowerCase());
  }
  for (const old of before.placedProducts) {
    if (!after.placedProducts.some(p => p.instanceId === old.instanceId)) changes.push(`Bỏ ${name(old.productId)}`);
  }
  for (const placed of after.placedProducts) {
    const old = before.placedProducts.find(p => p.instanceId === placed.instanceId);
    if (!old) { changes.push(`Thêm ${name(placed.productId)}`); continue; }
    if (old.productId !== placed.productId) changes.push(`Thay ${name(old.productId)} bằng ${name(placed.productId)}`);
    const distance = Math.hypot(...placed.position.map((v, axis) => v - old.position[axis]));
    if (distance > 0) changes.push(`Di chuyển ${name(placed.productId)} · ${Math.round(distance * 100)} cm`);
    if (old.rotationY !== placed.rotationY) changes.push(`Xoay ${name(placed.productId)}`);
  }
  if (before.targetBudget !== after.targetBudget) changes.push('Đổi ngân sách mục tiêu');
  if (before.roomContextImage !== after.roomContextImage) changes.push('Đổi ảnh tham chiếu');
  if (before.utilityPoints !== after.utilityPoints) changes.push('Đổi điểm kỹ thuật');
  if (before.stylePreferences !== after.stylePreferences) changes.push('Đổi phong cách đã chọn');
  return changes;
}

export function previewRoomProposal(h: RoomHistory, request: ProposalRequest, resolve: ResolveProduct): RoomProposal {
  const result: RoomProposal = {
    ...request, operations: [], sourceRevision: h.revision, preview: null, eligible: false,
    changes: [], findings: [], validation: null, budget: null, errors: [],
  };
  try {
    const applied = applyRoomOperations(h.current, request.operations, resolve);
    if (!applied.ok) {
      result.errors.push(`Thao tác ${applied.index + 1}: ${applied.message}`);
      return result;
    }
    result.operations = structuredClone(request.operations);
    const before = inspect(h.current, resolve);
    const after = inspect(applied.state, resolve);
    const validation = compareProposalFindings(before.findings, after.findings, request.intendedIssueId);
    if ((request.source === 'smart-fix' && !request.intendedIssueId) || validation.issueResolved === false) {
      result.errors.push('Chưa xác nhận được xung đột đã chọn đã được giải quyết.');
    }
    result.errors.push(...validation.introduced.map(f => f.message));
    // An imported invalid opening may already have a bounds finding. An edit to
    // that element must still fit even if its finding ID predates the proposal.
    for (const op of request.operations) {
      if (op.op !== 'element.update' || validation.introduced.length) continue;
      const el = applied.state.elements.find(e => e.id === op.element.id);
      if (el && !(isWallElement(el) ? openingFitsWall(applied.state.dimensions,el) : partitionFits(applied.state.dimensions,el))) {
        result.errors.push(ELEMENT_LABEL[el.type] + ' vượt giới hạn phòng.');
        break;
      }
    }
    const finishOnly = request.operations.every(op => op.op === 'style');
    if (after.missing && !finishOnly) result.errors.push('Có sản phẩm trong phòng chưa xác định được từ danh mục hiện tại.');
    for (const { placed, metadata, product } of after.entries) {
      const original = h.current.placedProducts.find(p => p.instanceId === placed.instanceId);
      if (original === placed) continue;
      if (![metadata.width, metadata.depth, metadata.height].every(n => n !== undefined && Number.isFinite(n) && n > 0)) {
        result.errors.push('Chưa đủ kích thước để kiểm tra vị trí đề xuất của ' + product.name + '.');
      }
    }
    for (const state of [h.current, applied.state]) {
      if (new Set(state.placedProducts.map(p => p.instanceId)).size !== state.placedProducts.length) {
        result.errors.push('Mã vị trí sản phẩm trong phòng bị trùng.');
        break;
      }
    }
    const changes = describeChanges(h.current, applied.state, resolve);
    if (!changes.length) result.errors.push('Phòng đã có cấu hình này.');
    const difference = before.budget.unpricedCount || after.budget.unpricedCount ? null :
      { min: after.budget.min - before.budget.min, max: after.budget.max - before.budget.max };
    return { ...result, eligible: result.errors.length === 0, preview: applied.state, validation,
      changes, findings: after.findings,
      budget: { before: before.budget, after: after.budget, difference } };
  } catch {
    result.errors.push('Không thể kiểm tra đầy đủ đề xuất này.');
    return result;
  }
}

/** Only the exact preview currently open in this session may be accepted. */
export function applyRoomProposal(h: RoomHistory, proposal: RoomProposal): RoomHistory {
  if (h.proposal !== proposal || h.revision !== proposal.sourceRevision || !proposal.eligible || !proposal.preview) return h;
  return commitRoom(h, proposal.label, proposal.preview, proposal.source === 'starter');
}
