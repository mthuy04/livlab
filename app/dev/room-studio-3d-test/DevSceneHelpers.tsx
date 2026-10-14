'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { RealWorldSize } from '@/lib/room-studio/assetResolver';
import type { Vec3 } from '@/lib/room-studio/placementRules';

/**
 * QA helpers drawn inside the Room Studio scene, for the dev route only.
 *
 * They are deliberately drawn from the SAME numbers the placement logic uses —
 * `position` is the placed product's centre and `size` is `getRealWorldSize` —
 * so a disagreement between the helper and the mesh is a real disagreement and
 * not a second opinion about where things are.
 */

interface DevSceneHelpersProps {
  position: Vec3;
  rotationY: number;
  size: RealWorldSize;
  showBoundingBox: boolean;
  showPivot: boolean;
  showAxes: boolean;
}

export default function DevSceneHelpers({
  position,
  rotationY,
  size,
  showBoundingBox,
  showPivot,
  showAxes,
}: DevSceneHelpersProps) {
  const boxGeometry = useMemo(
    () => new THREE.BoxGeometry(size.width, size.height, size.depth),
    [size.width, size.height, size.depth]
  );
  const edges = useMemo(() => new THREE.EdgesGeometry(boxGeometry), [boxGeometry]);

  return (
    <group>
      {showBoundingBox && (
        <group position={position} rotation={[0, rotationY, 0]}>
          <lineSegments geometry={edges}>
            <lineBasicMaterial color="#D14B3C" />
          </lineSegments>
          <Html position={[0, size.height / 2 + 0.1, 0]} center pointerEvents="none" zIndexRange={[18, 0]}>
            <span className="whitespace-nowrap rounded bg-[#D14B3C] px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {Math.round(size.width * 1000)} × {Math.round(size.depth * 1000)} ×{' '}
              {Math.round(size.height * 1000)} mm
            </span>
          </Html>
        </group>
      )}

      {/*
        BACK_CENTER_FLOOR, derived rather than remembered: the stored position
        is the centre of the box, so back-centre-floor is that point moved down
        by half the height and back by half the depth, through the product's own
        rotation. If this marker is not on the floor at the rear face, the
        placement maths is wrong — not the marker.
      */}
      {showPivot && (
        <group position={position} rotation={[0, rotationY, 0]}>
          <group position={[0, -size.height / 2, -size.depth / 2]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.03, 0.05, 24]} />
              <meshBasicMaterial color="#C8A96A" side={THREE.DoubleSide} />
            </mesh>
            <Html position={[0, 0.06, 0]} center pointerEvents="none" zIndexRange={[18, 0]}>
              <span className="whitespace-nowrap rounded bg-[#C8A96A] px-1.5 py-0.5 text-[10px] font-semibold text-[#0B1623]">
                PIVOT · back-center-floor
              </span>
            </Html>
          </group>
        </group>
      )}

      {showAxes && (
        <group position={position} rotation={[0, rotationY, 0]}>
          <AxisArrow direction={[1, 0, 0]} color="#C0392B" label="+X" length={0.45} />
          <AxisArrow direction={[0, 1, 0]} color="#27865A" label="+Y lên" length={0.5} />
          <AxisArrow direction={[0, 0, 1]} color="#1F6FB2" label="+Z mặt trước" length={0.6} />
        </group>
      )}
    </group>
  );
}

function AxisArrow({
  direction,
  color,
  label,
  length,
}: {
  direction: [number, number, number];
  color: string;
  label: string;
  length: number;
}) {
  const points = useMemo(
    () => [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(direction[0] * length, direction[1] * length, direction[2] * length),
    ],
    [direction, length]
  );
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <group>
      <line>
        <primitive object={geometry} attach="geometry" />
        <lineBasicMaterial color={color} />
      </line>
      <Html
        position={[direction[0] * length, direction[1] * length, direction[2] * length]}
        center
        pointerEvents="none"
        zIndexRange={[18, 0]}
      >
        <span
          className="whitespace-nowrap rounded px-1 py-0.5 text-[10px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      </Html>
    </group>
  );
}
