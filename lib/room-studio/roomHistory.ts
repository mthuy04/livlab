import type { RoomState } from './roomState';
import type { RoomProposal } from './roomProposal';

export const HISTORY_LIMIT = 50;
interface Transaction {
  label: string;
  before: RoomState;
  after: RoomState;
  starter: boolean;
}
export interface RoomHistory {
  current: RoomState;
  previous?: RoomState;
  revision: number;
  past: Transaction[];
  future: Transaction[];
  drag: { instanceId: string; draft: RoomState } | null;
  proposal: RoomProposal | null;
}

export function createRoomHistory(current: RoomState, revision = 0): RoomHistory {
  return { current, revision, past: [], future: [], drag: null, proposal: null };
}

// Most branches (including reference photographs) are shared by identity.
// Compare changed JSON fields so a drag back to its origin preserves Redo.
function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  return Object.keys(left).every(key => equal(left[key], right[key])) &&
    Object.keys(right).every(key => key in left || right[key] === undefined);
}

export function commitRoom(h: RoomHistory, label: string, next: RoomState, starter = false): RoomHistory {
  if (equal(h.current, next)) return h.drag || h.proposal ? { ...h, drag: null, proposal: null } : h;
  const tx = { label, before: h.current, after: next, starter };
  return { ...createRoomHistory(next, h.revision + 1), previous: h.current, past: [...h.past, tx].slice(-HISTORY_LIMIT) };
}

export function undoRoom(h: RoomHistory, starterSnapshot?: RoomState): RoomHistory {
  let index = h.past.length - 1;
  if (starterSnapshot) {
    while (index >= 0 && !h.past[index].starter) index--;
    if (h.past[index]?.after !== starterSnapshot) return h;
  }
  if (index < 0) return h;
  return { ...createRoomHistory(h.past[index].before, h.revision + 1), previous: h.current,
    past: h.past.slice(0, index), future: [...h.past.slice(index), ...h.future] };
}

export function redoRoom(h: RoomHistory): RoomHistory {
  const [tx, ...future] = h.future;
  if (!tx) return h;
  return { ...createRoomHistory(tx.after, h.revision + 1), previous: h.current, past: [...h.past, tx], future };
}

export function beginRoomDrag(h: RoomHistory, instanceId: string): RoomHistory {
  if (!h.current.placedProducts.some(p => p.instanceId === instanceId)) return h;
  return { ...h, drag: { instanceId, draft: h.current }, proposal: null };
}

export function updateRoomDrag(h: RoomHistory, instanceId: string, update: (draft: RoomState) => RoomState): RoomHistory {
  if (!h.drag || h.drag.instanceId !== instanceId) return h;
  return { ...h, drag: { instanceId, draft: update(h.drag.draft) } };
}

export function endRoomDrag(h: RoomHistory, cancel = false): RoomHistory {
  if (!h.drag) return h;
  return cancel ? { ...h, drag: null } : commitRoom(h, 'Di chuyển sản phẩm', h.drag.draft);
}
