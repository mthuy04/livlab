'use client';

import { useRef, type PointerEvent } from 'react';
import { doorGeometry, wallFrame, isWallElement, ELEMENT_LABEL, WALL_LABEL, type ArchitecturalElement, type PlanPoint } from '@/lib/room-studio/architecture';
import { movePartition, partitionGeometry, windowGeometry, type Segment } from '@/lib/room-studio/glassGeometry';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';

export interface PlanEditing {
  selected?: string | null;
  onSelect: (id: string) => void;
  onDrag?: (el: ArchitecturalElement | null) => void;
  onDrop?: (el: ArchitecturalElement) => void;
  lockedId?: string;
}
const path = (points: PlanPoint[]) => points.map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.z).join(' ');
const line = (s: Segment) => path([s.a, s.b]);

function symbol(room: RoomDimensions, el: ArchitecturalElement, color: string, selected: boolean) {
  if (el.type === 'entrance-door') {
    const g = doorGeometry(room, el), edge = path([g.frame.point(el.offset), g.frame.point(el.offset + el.width)]);
    return <>
      <path d={edge} stroke="white" strokeWidth=".065" />
      <path d={path([g.hinge, ...g.arc]) + 'Z'} fill={color} fillOpacity=".10" />
      <path d={path(g.arc)} stroke={color} strokeWidth=".018" strokeDasharray=".05 .035" fill="none" />
      <path d={path([g.hinge, g.tip(el.open ? Math.PI / 2 : 0)])} stroke={color} strokeWidth=".04" />
      <circle cx={g.hinge.x} cy={g.hinge.z} r=".045" fill={color} />
      <path d={edge} stroke="transparent" strokeWidth={22} vectorEffect="non-scaling-stroke" />
    </>;
  }
  if (el.type === 'window') {
    const g = windowGeometry(room, el);
    return <>
      <path d={line(g.opening)} stroke={color} strokeWidth=".075" />
      <path d={line(g.opening)} stroke="#F2FAFA" strokeWidth=".04" />
      <path d={line(g.sash)} stroke={color} strokeWidth=".018" />
      {el.mechanism === 'casement' && <path d={path(g.sweep.arc)} stroke={color} fill="none" strokeWidth=".014" strokeDasharray=".05 .04" />}
      <path d={line(g.opening)} stroke="transparent" strokeWidth={24} vectorEffect="non-scaling-stroke" />
    </>;
  }
  const g = partitionGeometry(el);
  return <>
    <path d={line(g.fixed)} stroke={color} strokeWidth=".047" />
    {g.entry && <path d={line(g.entry)} stroke={color} strokeWidth=".018" strokeDasharray=".045 .04" />}
    {g.leaf && <path d={line(g.leaf)} stroke={color} strokeWidth=".032" />}
    {g.sweep && <path d={path(g.sweep.arc)} stroke={color} fill="none" strokeWidth=".012" strokeDasharray=".05 .04" />}
    <path d={line(g.span)} stroke="transparent" strokeWidth={24} vectorEffect="non-scaling-stroke" />
    {selected && <g data-rotate="true" style={{ cursor: 'crosshair' }}>
      <title>Xoay vách kính</title>
      <circle cx={g.span.b.x} cy={g.span.b.z} r=".043" stroke={color} fill="white" strokeWidth=".018" />
      <circle cx={g.span.b.x} cy={g.span.b.z} r=".04" fill="transparent" stroke="transparent" strokeWidth={18} vectorEffect="non-scaling-stroke" />
    </g>}
  </>;
}

export default function ArchitecturePlanLayer({ room, elements, editing, transform }: {
  room: RoomDimensions; elements: ArchitecturalElement[]; editing?: PlanEditing; transform: string;
}) {
  const group = useRef<SVGGElement>(null);
  const drag = useRef<{ el: ArchitecturalElement; start: PlanPoint; pointer: number; rotate: boolean } | null>(null);
  function point(e: PointerEvent<SVGGElement>) {
    const ctm = group.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, z: p.y };
  }
  function moved(e: PointerEvent<SVGGElement>): ArchitecturalElement | undefined {
    const d = drag.current, p = point(e);
    if (!d || !p || d.pointer !== e.pointerId) return;
    const el = d.el;
    if (isWallElement(el)) {
      const frame = wallFrame(room, el.wall);
      const delta = frame.local(p).u - frame.local(d.start).u;
      const offset = Math.max(0, Math.min(frame.span - el.width, Math.round((el.offset + delta) * 100) / 100));
      return { ...el, offset };
    }
    if (d.rotate) {
      const angle = (q: PlanPoint) => Math.atan2(q.z - el.z, q.x - el.x) * 180 / Math.PI;
      return { ...el, rotation: ((Math.round(el.rotation + angle(p) - angle(d.start)) + 540) % 360) - 180 };
    }
    return movePartition(room, el, p.x - d.start.x, p.z - d.start.z);
  }
  return <g ref={group} transform={transform}>
    {elements.map(el => {
      const active = !!editing && (!editing.lockedId || editing.lockedId === el.id);
      const selected = editing?.selected === el.id;
      return <g key={el.id} data-element-id={el.id} data-kind={el.type} data-door-id={el.type === 'entrance-door' ? el.id : undefined}
        data-wall={isWallElement(el) ? el.wall : undefined} data-offset={isWallElement(el) ? el.offset : undefined}
        role={active ? 'button' : undefined} tabIndex={active ? 0 : undefined}
        aria-label={ELEMENT_LABEL[el.type] + (isWallElement(el) ? ' · ' + WALL_LABEL[el.wall] : '')}
        style={active ? { cursor: editing.onDrag ? 'grab' : 'pointer', touchAction: 'none' } : { pointerEvents: 'none' }}
        onKeyDown={e => { if (active && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); editing.onSelect(el.id); } }}
        onPointerDown={e => {
          const start = point(e);
          if (!active || !start || e.button !== 0 || drag.current) return;
          editing.onSelect(el.id);
          if (editing.onDrag) {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { el, start, pointer: e.pointerId, rotate: !!(e.target as Element).closest('[data-rotate]') };
          }
        }}
        onPointerMove={e => { const next = moved(e); if (next) editing?.onDrag?.(next); }}
        onPointerUp={e => {
          const next = moved(e);
          if (!next) return;
          if (JSON.stringify(next) !== JSON.stringify(drag.current?.el)) editing?.onDrop?.(next);
          drag.current = null; editing?.onDrag?.(null);
        }}
        onLostPointerCapture={() => { if (drag.current) { drag.current = null; editing?.onDrag?.(null); } }}>
        {symbol(room, el, selected ? '#876321' : '#527177', selected)}
      </g>;
    })}
  </g>;
}
