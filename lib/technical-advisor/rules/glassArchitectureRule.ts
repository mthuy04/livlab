import { doorGeometry, isWallElement, openingFitsWall, wallOpenings, WALL_LABEL } from '../../room-studio/architecture';
import { parseArchitecture } from '../../room-studio/environment';
import { openingFrameVolumes, partitionFits, partitionGeometry, strip } from '../../room-studio/glassGeometry';
import { fixtureVolumes, footprintsOverlap, intersectsSweep, sweepsOverlap } from '../architectureGeometry';
import type { TechnicalRule, TechnicalValidationResult } from '../types';

const EPS = 1e-8;
export const glassArchitectureRule: TechnicalRule = {
  id: 'glass-architecture',
  category: 'ROOM_BOUNDS',
  run({ room, elements = [], architecture, entries, counterSupport }) {
    const glass = elements.filter(el => el.type !== 'entrance-door');
    if (!glass.length) return [];
    const findings: TechnicalValidationResult[] = [];
    const openings = wallOpenings(room, parseArchitecture(architecture), elements);
    const fixtures = entries.map(entry => ({ entry, volumes: fixtureVolumes(entry, !!counterSupport) }));
    const doors = elements.filter(e => e.type === 'entrance-door' && openingFitsWall(room, e));
    function report(key: string[], message: string, instance?: string, missing = false) {
      const bounds = key[0] === 'bounds' || key[0] === 'opening';
      findings.push({
        id: 'glass:' + JSON.stringify(key), ruleId: 'glass-architecture', severity: 'VERIFY',
        category: bounds ? 'ROOM_BOUNDS' : 'COLLISION', title: bounds ? 'Kiểm tra kích thước kiến trúc' : 'Kiểm tra vách kính',
        message, affectedInstanceIds: instance ? [instance] : [], confidence: missing ? 'LOW' : 'HIGH',
        dataSource: missing ? 'UNKNOWN' : 'ROOM_GEOMETRY', requiresHumanVerification: missing,
        ...(missing ? { reason: 'MISSING_DATA' } : { placementIssue: 'ARCHITECTURE' })
      });
    }
    const framed = elements.filter(isWallElement).filter(el => openingFitsWall(room, el));
    for (let i = 0; i < framed.length; i++) {
      const a = framed[i];
      for (const b of framed.slice(i + 1)) {
        if (a.wall === b.wall || (a.type !== 'window' && b.type !== 'window')) continue;
        const other = openingFrameVolumes(room, b);
        if (openingFrameVolumes(room, a).some(x => other.some(y =>
          Math.min(x.top, y.top) - Math.max(x.bottom, y.bottom) > EPS && footprintsOverlap(x.footprint, y.footprint)))) {
          report(['opening', ...[a.id, b.id].sort()], 'Khung cửa giao nhau ở góc phòng.');
        }
      }
    }
    const partitions = glass.filter(e => e.type === 'shower-partition' && partitionFits(room, e))
      .flatMap(e => e.type === 'shower-partition' ? [{ el: e, g: partitionGeometry(e) }] : []);
    for (const el of glass) {
      if (el.type === 'window') {
        if (!openingFitsWall(room, el)) report(['bounds', el.id], WALL_LABEL[el.wall] + ': kiểm tra chiều rộng, chiều cao, vị trí và cao bậu cửa sổ.');
        const key = 'window/' + el.id;
        for (const o of openings) {
          // EntranceDoorRule owns door/window pairs.
          if (o.wall !== el.wall || o.id.startsWith('door/') || (o.id.startsWith('window/') && o.id <= key)) continue;
          if (el.offset < o.x + o.width - EPS && el.offset + el.width > o.x + EPS && el.sill < o.y + o.height - EPS && el.sill + el.height > o.y + EPS)
            report(['opening', ...[key, o.id].sort()], WALL_LABEL[el.wall] + ': ô cửa sổ chồng lên ' + (o.id === 'niche' ? 'hốc tường.' : 'cửa sổ khác.'));
        }
      } else if (!partitionFits(room, el)) {
        report(['bounds', el.id], 'Vách kính, lối vào và hành trình cánh phải nằm trong phòng. Kiểm tra chiều dài, chiều cao và góc từ −180° đến 180°.');
      }
    }
    for (const { el, g } of partitions) {
      const fixed = strip(g.fixed), entry = g.entry && strip(g.entry), travel = g.travel && strip(g.travel);
      const leaf = g.leaf && strip(g.leaf);
      const areas = [fixed, entry, travel, leaf];
      function conflict(poly: ReturnType<typeof strip>) {
        if (footprintsOverlap(fixed, poly)) return 'tấm kính';
        if (g.sweep && intersectsSweep(g.sweep, poly)) return 'vùng mở cửa kính';
        if (entry && footprintsOverlap(entry, poly)) return 'lối vào buồng tắm';
        if (travel && footprintsOverlap(travel, poly)) return 'hành trình cửa trượt';
        if (leaf && footprintsOverlap(leaf, poly)) return 'cánh cửa kính';
      }
      for (const { entry: fixture, volumes } of fixtures) {
        const id = fixture.placed.instanceId;
        if (!volumes) { report(['unknown', el.id, id], 'Cần xác minh kích thước ' + fixture.product.name + ' để kiểm tra vách kính.', id, true); continue; }
        for (const v of volumes) {
          if (v.top <= EPS || v.bottom >= el.height - EPS) continue;
          const hit = conflict(v.footprint);
          if (hit) { report([hit, el.id, id], fixture.product.name + ' vướng ' + hit + '.', id); break; }
        }
      }
      for (const door of doors) {
        if (door.type !== 'entrance-door') continue;
        const sweep = doorGeometry(room, door);
        if (areas.some(poly => poly && intersectsSweep(sweep, poly)) || (g.sweep && sweepsOverlap(g.sweep, sweep)))
          report(['entrance', el.id, door.id], 'Vách kính hoặc lối vào buồng tắm vướng vùng mở cửa ra vào.');
      }
      for (const other of partitions) {
        if (other.el.id <= el.id) continue;
        const otherAreas = [other.g.fixed, other.g.entry, other.g.travel, other.g.leaf].flatMap(s => s ? [strip(s)] : []);
        const otherSweep = other.g.sweep;
        if (otherAreas.some(conflict) || (otherSweep && (areas.some(p => p && intersectsSweep(otherSweep, p)) || (g.sweep && sweepsOverlap(g.sweep, otherSweep)))))
          report(['partitions', el.id, other.el.id], 'Hai vách kính chồng lên nhau hoặc cản lối vào.');
      }
    }
    return findings;
  },
};
