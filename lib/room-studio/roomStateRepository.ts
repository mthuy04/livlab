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
  async load(): Promise<RoomState | null> {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeRoomState(state)));
    } catch {
      // Quota exceeded / private mode: the room simply will not survive a
      // refresh. Not worth interrupting the customer over.
    }
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}

export const roomStateRepository: RoomStateRepository = new LocalRoomStateRepository();
