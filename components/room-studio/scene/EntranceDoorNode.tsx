'use client';

import { Line } from '@react-three/drei';
import { ENTRANCE_FRAME_DEPTH, doorGeometry, type EntranceDoor } from '@/lib/room-studio/architecture';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';

/** Local X runs along the wall. Jambs and the revolving leaf share the plan pivot. */
export default function EntranceDoorNode({ room, door, plan, selected }: {
  room: RoomDimensions; door: EntranceDoor; plan: boolean; selected: boolean;
}) {
  if (door.width <= 0 || door.height <= 0) return null;
  const g = doorGeometry(room, door);
  const centre = g.frame.point(door.offset + door.width / 2);
  const end = g.tip(door.open ? Math.PI / 2 : 0);
  const dx = end.x - g.hinge.x, dz = end.z - g.hinge.z;
  const frameColor = selected ? '#A08148' : '#776859';
  return (
    <group name={'entrance-door/' + door.id}>
      <group position={[centre.x, 0, centre.z]} rotation={[0, g.frame.yaw, 0]}>
        {[-1, 1].map(side => (
          <mesh key={side} position={[side * (door.width - g.jamb) / 2, g.leafHeight / 2, 0]}>
            <boxGeometry args={[g.jamb, g.leafHeight, ENTRANCE_FRAME_DEPTH]} />
            <meshStandardMaterial color={frameColor} roughness={0.62} />
          </mesh>
        ))}
        {!plan && <mesh position={[0, door.height - g.jamb / 2, 0]}>
          <boxGeometry args={[door.width, g.jamb, ENTRANCE_FRAME_DEPTH]} />
          <meshStandardMaterial color={frameColor} roughness={0.62} />
        </mesh>}
      </group>
      <group position={[g.hinge.x + dx/2, g.leafHeight/2, g.hinge.z + dz/2]} rotation={[0, -Math.atan2(dz, dx), 0]}>
        <mesh name="door-leaf" castShadow receiveShadow>
          <boxGeometry args={[g.radius, g.leafHeight, 0.036]} />
          <meshStandardMaterial color="#C4A888" roughness={0.62} />
        </mesh>
        {!plan && [-1, 1].map(side => (
          <mesh key={side} position={[g.radius * 0.37, 0, side * 0.035]}>
            <boxGeometry args={[Math.min(0.11, g.radius / 4), 0.018, 0.04]} />
            <meshStandardMaterial color="#726B5F" metalness={0.65} roughness={0.35} />
          </mesh>
        ))}
      </group>
      {plan && <Line points={g.arc.map(p => [p.x, 0.012, p.z])} color={frameColor} lineWidth={1.5} dashed dashSize={0.046} gapSize={0.025} />}
    </group>
  );
}
