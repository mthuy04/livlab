'use client';
import { Html, Line } from '@react-three/drei';
import { BoxGeometry, DoubleSide, EdgesGeometry, Shape } from 'three';
import { useEffect, useMemo } from 'react';
import { doorGeometry, wallFrame, type PlanPoint } from '@/lib/room-studio/architecture';
import { partitionGeometry } from '@/lib/room-studio/glassGeometry';
import { fixtureVolumes } from '@/lib/technical-advisor/architectureGeometry';
import {
  footprintGap,
  frontSpace,
  halfPlane,
  intersection,
  area,
} from '@/lib/technical-advisor/spatialGeometry';
import type { TechnicalContext, TechnicalProductEntry } from '@/lib/technical-advisor/types';
import type { PlacementStatus } from '@/lib/room-studio/placementStatus';

const cm = (v: number) => Math.round(v * 100) + ' cm';
function Mark({
  points,
  color,
  label,
  fill = false,
}: {
  points: PlanPoint[];
  color: string;
  label?: string;
  fill?: boolean;
}) {
  if (points.length < 2) return null;
  const poly = points.length > 2,
    shape = new Shape();
  points.forEach(({ x, z }, i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)));
  const mid = points[Math.floor((points.length - 1) / 2)];
  const anchor =
    points.length === 2 ? { x: (points[0].x + points[1].x) / 2, z: (points[0].z + points[1].z) / 2 } : mid;
  return (
    <group>
      {fill && poly && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position-y={0.012} raycast={() => null}>
          <shapeGeometry args={[shape]} />
          <meshBasicMaterial color={color} transparent opacity={0.17} side={DoubleSide} depthWrite={false} />
        </mesh>
      )}
      <Line
        points={(poly ? [...points, points[0]] : points).map((p) => [p.x, 0.022, p.z])}
        color={color}
        lineWidth={1.6}
        raycast={() => null}
      />
      {label && (
        <Html
          position={[anchor.x, 0.06, anchor.z]}
          center
          zIndexRange={[19, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <span className="whitespace-nowrap rounded bg-white/95 px-1.5 text-[11px] text-[#28353e]">
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}
export default function SpatialOverlay({
  context,
  dimensions,
  zones,
  selected,
  status,
  ghosts,
}: {
  context: TechnicalContext;
  dimensions: boolean;
  zones: boolean;
  selected: string | null;
  status: Record<string, PlacementStatus>;
  ghosts: TechnicalProductEntry[];
}) {
  const room = context.room,
    x = room.length / 2,
    z = room.width / 2;
  const corners = [
    { x: -x, z: -z },
    { x, z: -z },
    { x, z },
    { x: -x, z },
  ];
  const footprints = context.entries.map((entry) => ({
    entry,
    poly: fixtureVolumes(entry, !!context.counterSupport)?.[0]?.footprint,
  }));
  const active = footprints.find((v) => v.entry.placed.instanceId === selected);
  const gaps =
    active?.poly && dimensions
      ? footprints
          .flatMap((v) => (v !== active && v.poly ? [footprintGap(active.poly!, v.poly)] : []))
          .sort((a, b) => a.distance - b.distance)
      : [];
  const shower = context.entries.find((e) => e.product.normalizedCategory === 'shower');
  const screen = context.elements?.find((e) => e.type === 'shower-partition');
  const divider = screen && partitionGeometry(screen).frame;
  const side =
    shower && divider
      ? Math.sign(divider.local({ x: shower.placed.position[0], z: shower.placed.position[2] }).depth)
      : 0;
  return (
    <>
      {dimensions && (
        <>
          <Mark points={corners.slice(0, 2)} color="#856b37" label={cm(room.length)} />
          <Mark points={corners.slice(1, 3)} color="#856b37" label={cm(room.width)} />
        </>
      )}
      {zones &&
        divider &&
        side !== 0 &&
        [1, -1].map((k) => (
          <Mark
            key={k}
            points={halfPlane(corners, (p) => divider.local(p).depth * side * k)}
            color={k === 1 ? '#529aaa' : '#c3af83'}
            label={k === 1 ? 'Ướt · gợi ý' : 'Khô · gợi ý'}
            fill
          />
        ))}
      {footprints.flatMap(({ entry, poly }, i) => {
        if (!poly || status[entry.placed.instanceId] !== 'COLLISION') return [];
        return footprints.slice(i + 1).flatMap((other) => {
          if (!other.poly || status[other.entry.placed.instanceId] !== 'COLLISION') return [];
          const a = fixtureVolumes(entry, !!context.counterSupport) ?? [],
            b = fixtureVolumes(other.entry, !!context.counterSupport) ?? [];
          return a.flatMap((u, m) =>
            b.flatMap((v, n) => {
              if (Math.min(u.top, v.top) <= Math.max(u.bottom, v.bottom)) return [];
              const clip = intersection(u.footprint, v.footprint);
              return area(clip) > 1e-8
                ? [
                    <Mark
                      key={[entry.placed.instanceId, other.entry.placed.instanceId, m, n].join('/')}
                      points={clip}
                      color="#d01d18"
                      fill
                    />,
                  ]
                : [];
            })
          );
        });
      })}
      {gaps[0] && (
        <Mark
          points={[gaps[0].from, gaps[0].to]}
          color="#67542e"
          label={'Khoảng cách ' + cm(gaps[0].distance)}
        />
      )}
      {footprints.map(({ entry, poly }) => {
        if (!poly) return null;
        const id = entry.placed.instanceId,
          warning = status[id] && status[id] !== 'VALID';
        if (!zones && !warning && !(dimensions && id === selected)) return null;
        const space =
          (id === selected || zones) && entry.metadata.recommendedClearance?.front
            ? frontSpace(context, entry)
            : null;
        return (
          <group key={id}>
            <Mark
              points={poly}
              color={warning ? '#c34237' : id === selected ? '#98752f' : '#607d86'}
              fill={!!warning || zones}
              label={
                dimensions && id === selected
                  ? 'X ' + cm(entry.placed.position[0]) + ' · Z ' + cm(entry.placed.position[2])
                  : undefined
              }
            />
            {space && (
              <Mark
                points={space.zone}
                color="#a98740"
                fill
                label={
                  dimensions
                    ? space.missingObstacleDimensions
                      ? 'Cần kiểm tra vật cản'
                      : 'Trống ' + cm(space.available)
                    : undefined
                }
              />
            )}
          </group>
        );
      })}
      {(context.elements ?? []).map((el) => {
        if (el.type === 'shower-partition') {
          const g = partitionGeometry(el);
          return (
            <group key={el.id}>
              {dimensions && <Mark points={[g.span.a, g.span.b]} label={cm(el.length)} color="#806c47" />}
              {zones && g.entry && (
                <Mark
                  points={[g.entry.a, g.entry.b]}
                  label={'Lối vào ' + cm(el.length / 2)}
                  color="#367787"
                />
              )}
              {zones && g.sweep && <Mark points={[g.sweep.hinge, ...g.sweep.arc]} color="#a48750" fill />}
            </group>
          );
        }
        const frame = wallFrame(room, el.wall),
          g = el.type === 'entrance-door' ? doorGeometry(room, el) : null;
        return (
          <group key={el.id}>
            {dimensions && (
              <Mark points={[frame.point(0), frame.point(el.offset)]} label={cm(el.offset)} color="#816c45" />
            )}
            {zones && g && <Mark points={[g.hinge, ...g.arc]} color="#a48750" fill />}
          </group>
        );
      })}
      {ghosts.map((e) => (
        <GhostBox
          key={e.placed.instanceId}
          position={e.placed.position}
          rotationY={e.placed.rotationY}
          size={[e.metadata.width ?? 0, e.metadata.height ?? 0, e.metadata.depth ?? 0]}
        />
      ))}
    </>
  );
}

/** Where a product was before a Smart Fix preview: a faint red volume inside a crisp red frame. */
function GhostBox({ position, rotationY, size }: { position: [number, number, number]; rotationY: number; size: [number, number, number] }) {
  const [w, h, d] = size;
  const box = useMemo(() => new BoxGeometry(w, h, d), [w, h, d]);
  const edges = useMemo(() => new EdgesGeometry(box), [box]);
  useEffect(() => () => { box.dispose(); edges.dispose(); }, [box, edges]);
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh geometry={box} raycast={() => null} renderOrder={2}>
        <meshBasicMaterial transparent opacity={0.14} color="#D64545" depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges} raycast={() => null} renderOrder={3}>
        <lineBasicMaterial color="#C62828" transparent opacity={0.95} depthTest={false} />
      </lineSegments>
    </group>
  );
}
