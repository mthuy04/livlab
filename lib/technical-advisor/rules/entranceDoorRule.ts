import { doorGeometry, openingFitsWall, wallOpenings, WALL_LABEL } from '../../room-studio/architecture';
import { parseArchitecture } from '../../room-studio/environment';
import type { TechnicalRule, TechnicalValidationResult } from '../types';

import { fixtureVolumes, intersectsSweep } from '../architectureGeometry';

const EPS = 1e-8;
export const entranceDoorRule: TechnicalRule = {
  id: 'entrance-door',
  category: 'ROOM_BOUNDS',
  run({ room, architecture, elements = [], entries, counterSupport }) {
    if (!elements.length) return [];
    const openings = wallOpenings(room, parseArchitecture(architecture), elements);
    const findings: TechnicalValidationResult[] = [];
    const report = (key: string[], message: string, issue: 'DOOR_OPENING' | 'DOOR_SWING', instances: string[] = []) => {
      findings.push({ id: 'door:' + JSON.stringify(key), ruleId: 'entrance-door', category: issue === 'DOOR_SWING' ? 'COLLISION' : 'ROOM_BOUNDS',
        severity: 'VERIFY', placementIssue: issue, title: 'Kiểm tra cửa ra vào', message, affectedInstanceIds: instances,
        dataSource: 'ROOM_GEOMETRY', confidence: 'HIGH', requiresHumanVerification: false });
    };
    for (const door of elements) {
      if (door.type !== 'entrance-door') continue;
      const label = WALL_LABEL[door.wall];
      if (!openingFitsWall(room, door)) {
        report([door.id, 'bounds'], label + ': kích thước và vị trí ô cửa phải nằm trong tường.', 'DOOR_OPENING');
        continue;
      }
      const g = doorGeometry(room, door);
      if (door.swing === 'inward' && g.radius > (door.wall === 'back' || door.wall === 'front' ? room.width : room.length) + EPS) {
        report([door.id, 'opposite'], label + ': cánh cửa vướng tường đối diện khi mở.', 'DOOR_OPENING');
      }
      for (const o of openings) {
        const key = 'door/' + door.id;
        if (o.wall !== door.wall || o.id === key || (o.id.startsWith('door/') && o.id < key)) continue;
        if (o.x < door.offset + door.width - EPS && o.x + o.width > door.offset + EPS && o.y < door.height - EPS && o.y + o.height > EPS) {
          const name = o.id.startsWith('window/') ? 'cửa sổ' : o.id === 'niche' ? 'hốc tường' : 'cửa ra vào khác';
          report(['overlap', ...[key, o.id].sort()], label + ': ô cửa chồng lên ' + name + '.', 'DOOR_OPENING');
        }
      }
      for (const entry of entries) {
        const id = entry.placed.instanceId;
        const volumes = fixtureVolumes(entry, !!counterSupport);
        const hit = volumes?.some(v => v.top > EPS && v.bottom < g.leafHeight-EPS && intersectsSweep(g,v.footprint)) ?? null;
        if (hit === true) report([door.id, id, 'swing'], label + ': vùng mở cửa vướng ' + entry.product.name + '.', 'DOOR_SWING', [id]);
        if (hit === null) findings.push({
          id: 'door:' + JSON.stringify([door.id, id, 'unknown']), ruleId: 'entrance-door', category: 'COLLISION',
          severity: 'VERIFY', title: 'Chưa đủ kích thước', message: 'Cần xác minh kích thước của ' + entry.product.name + ' để kiểm tra vùng mở cửa.',
          affectedInstanceIds: [id], dataSource: 'UNKNOWN', confidence: 'LOW', requiresHumanVerification: true, reason: 'MISSING_DATA',
        });
      }
    }
    return findings;
  },
};
