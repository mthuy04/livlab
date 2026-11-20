'use client';

import { memo, useEffect, useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import type { Glazing, RoomWindow, ShowerPartition } from '@/lib/room-studio/architecture';
import { GLASS_FINISH, partitionGeometry, PROFILE_DEPTH, windowGeometry, type Segment } from '@/lib/room-studio/glassGeometry';

function useGlass(glazing: Glazing) {
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      ...GLASS_FINISH[glazing], transparent: true,
      side: THREE.DoubleSide, depthWrite: false, metalness: 0, envMapIntensity: 1.1, ior: 1.5, clearcoat: 0.8, clearcoatRoughness: glazing === 'frosted' ? 0.46 : 0.08
    });
    m.forceSinglePass = true;
    // Preserve the cutaway alpha while making a pane more visible at grazing angles.
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>',
        `#include <opaque_fragment>
        float grazing = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0);
        gl_FragColor.a = min(1.0, gl_FragColor.a * (1.0 + 1.6 * grazing));`);
    };
    m.userData.glassOpacity = m.opacity;
    return m;
  }, [glazing]);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

function Bar({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return <mesh position={position} castShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.30} metalness={0.63} /></mesh>;
}

/** Glass and profiles are authored in the pane's local frame and rotated together. */
function Panel({ segment, bottom, height, material, color, profile, framed = false, post = false, mullion = false, handle = false, hinges = false }: {
  segment: Segment; bottom: number; height: number; material: THREE.Material; color: string;
  profile: number; framed?: boolean; post?: boolean; mullion?: boolean; handle?: boolean; hinges?: boolean;
}) {
  const { a, b } = segment;
  const width = Number(Math.hypot(b.x - a.x, b.z - a.z).toFixed(8));
  return <group position={[(a.x + b.x) / 2, bottom, (a.z + b.z) / 2]} rotation={[0, -Math.atan2(b.z - a.z, b.x - a.x), 0]}>
    <mesh position={[0, height / 2, 0]} material={material}><planeGeometry args={[width, height]} /></mesh>
    {!framed && !mullion && <mesh position={[-width/2+.002,height/2,0]}>
      <boxGeometry args={[.004,height,.008]}/><meshStandardMaterial color="#a1b6af" roughness={.2} transparent opacity={.62} depthWrite={false}/>
    </mesh>}
    <Bar position={[0, height - profile / 2, 0]} size={[width, profile, profile]} color={color} />
    <Bar position={[0, profile / 2, 0]} size={[width, profile, framed ? profile : PROFILE_DEPTH]} color={color} />
    {(framed || post) && <Bar position={[(width - profile) / 2, height / 2, 0]} size={[profile, height, profile]} color={color} />}
    {framed && <Bar position={[(profile - width) / 2, height / 2, 0]} size={[profile, height, profile]} color={color} />}
    {handle && <Bar position={[width * 0.34, height / 2, profile]} size={[profile, Math.min(0.12, height / 4), profile * 2]} color={color} />}
    {hinges && [0.2, 0.8].map(r => <Bar key={r} position={[-width / 2 + profile, height * r, 0]}
      size={[profile * 2, Math.min(0.065, height / 5), profile * 2]} color={color} />)}
    {mullion && <Bar position={[0, height / 2, 0]} size={[profile * 0.6, height, profile]} color={color} />}
  </group>;
}

export const WindowNode = memo(function WindowNode({ room, element, selected, plan }: {
  room: RoomDimensions; element: RoomWindow; selected: boolean; plan: boolean;
}) {
  const g = windowGeometry(room, element);
  const material = useGlass(element.glazing);
  const color = element.frame === 'graphite' ? '#303538' : '#E9E6DA';
  return <group name={'window/' + element.id}>
    <group position={[g.centre.x, element.sill, g.centre.z]} rotation={[0, g.yaw, 0]}>
      {[0, element.height - g.profile].map((y, i) => <Bar key={i} position={[0, y + g.profile / 2, 0]} size={[element.width, g.profile, g.profile]} color={selected && i === 1 ? '#927549' : color} />)}
      {[-1, 1].map(side => <Bar key={side} position={[side * (element.width - g.profile) / 2, element.height / 2, 0]} size={[g.profile, element.height, g.profile]} color={color} />)}
    </group>
    {element.daylightBackdrop && element.mechanism === 'fixed' && !plan && <group
      position={[g.centre.x, element.sill + element.height / 2, g.centre.z]} rotation={[0, g.yaw, 0]}>
      <mesh position={[0, 0, -0.045]}>
        <planeGeometry args={[element.width, element.height]} />
        <meshBasicMaterial color="#EAF3FA" toneMapped={false} />
      </mesh>
    </group>}
    <Panel segment={g.sash} height={element.height - 2 * g.profile} bottom={element.sill + g.profile}
      material={material} color={color} profile={g.profile * 0.6} handle={element.mechanism === 'casement'} hinges={element.mechanism === 'casement'} framed={element.mechanism === 'casement'} mullion={element.mechanism === 'fixed'} />
    {plan && element.mechanism === 'casement' && <Line points={g.sweep.arc.map(p => [p.x, element.sill, p.z])}
      color={color} lineWidth={1} dashed dashSize={0.04} gapSize={0.03} />}
  </group>;
});

export const PartitionNode = memo(function PartitionNode({ element, selected, plan, trim }: {
  trim?:string; element: ShowerPartition; selected: boolean; plan: boolean;
}) {
  const g = partitionGeometry(element);
  const material = useGlass(element.glazing);
  const color = selected ? '#967A4D' : trim ?? '#303437';
  const profile = Math.min(0.018, element.length / 10, element.height / 10);
  return <group name={'shower-partition/' + element.id}>
    <Panel segment={g.fixed} height={element.height} bottom={0} material={material} color={color} profile={profile} post />
    {g.leaf && <Panel segment={g.leaf} height={element.height} bottom={0} material={material} color={color} profile={profile} framed handle hinges={!!g.sweep} />}
    {g.travel && <group position={[element.x, element.height, element.z]} rotation={[0, -element.rotation * Math.PI / 180, 0]}>
      <Bar position={[0, -profile / 2, 0.013]} size={[element.length, profile, 0.052]} color={color} />
    </group>}
    {g.sweep && plan && <Line points={g.sweep.arc.map(p => [p.x, 0.02, p.z])} color={color} lineWidth={1} dashed dashSize={0.04} gapSize={0.035} />}
    {g.entry && (selected || plan) && <Line points={[[g.entry.a.x, 0.012, g.entry.a.z], [g.entry.b.x, 0.012, g.entry.b.z]]}
      color="#A48655" lineWidth={2} dashed dashSize={0.05} gapSize={0.035} />}
  </group>;
});
