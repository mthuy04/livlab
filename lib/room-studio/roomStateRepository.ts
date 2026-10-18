/**
 * The single boundary between Room Studio and wherever its state is stored.
 *
 * Today this is localStorage, because auth and the database are known to be
 * incomplete and fixing them is explicitly out of scope. No component calls
 * localStorage directly — they call this repository — so switching to Supabase
 * later means implementing the same three methods against a table and changing
 * the exported `roomStateRepository` binding. Nothing else moves.
 */

import { deserializeRoomState, serializeRoomState, type RoomState } from './roomState';

const STORAGE_KEY = 'livlab_room_studio_state_v1';

export interface RoomStateRepository {
  load(): Promise<RoomState | null>;
  save(state: RoomState): Promise<void>;
  clear(): Promise<void>;
}

class LocalRoomStateRepository implements RoomStateRepository {
  constructor(private readonly key: string = STORAGE_KEY) {}

  async load(): Promise<RoomState | null> {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(this.key);
      if (!raw) return null;
      return deserializeRoomState(JSON.parse(raw));
    } catch {
      // A corrupt snapshot must never block the studio from opening.
      return null;
    }
  }

  async save(state: RoomState): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(this.key, JSON.stringify(serializeRoomState(state)));
    } catch {
      // Quota exceeded / private mode: the room simply will not survive a
      // refresh. Not worth interrupting the customer over.
    }
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(this.key);
    } catch {
      /* ignore */
    }
  }
}

export const roomStateRepository: RoomStateRepository = new LocalRoomStateRepository();

/**
 * One saved room per storefront.
 *
 * A single key shared by every showroom meant a room planned on LivLab came
 * back inside a showroom's Room Studio: its products could not render there
 * (that catalogue does not carry them) but they stayed in the state, were
 * saved back, and counted as "the room is not empty". LivLab keeps the
 * original key, so every room saved before this change opens as it was.
 */
export function roomStateRepositoryFor(scope: string | null | undefined): RoomStateRepository {
  if (!scope || scope === 'livlab') return roomStateRepository;
  return new LocalRoomStateRepository(`${STORAGE_KEY}:${scope}`);
}
