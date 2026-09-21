'use client';

import { memo } from 'react';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { getMaterialById } from '@/lib/room-studio/materials';
import { useSurfaceTexture } from './useSurfaceTexture';

interface SurfacePlaneProps {
  materialId: string;
  /** Real-world size of this plane in metres, used to keep the finish's own
   *  real-world scale correct regardless of room size. */
  planeWidth: number;
  planeHeight: number;
  position: [number, number, number];
  rotation: [number, number, number];
  /** Floors take a touch more shadow so the room reads as grounded. */
  tint?: number;
}

function SurfacePlane({ materialId, planeWidth, planeHeight, position, rotation, tint = 1 }: SurfacePlaneProps) {
  const material = getMaterialById(materialId);
  const texture = useSurfaceTexture(material, planeWidth, planeHeight);

  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshStandardMaterial
        map={texture ?? undefined}
        color={texture ? (tint === 1 ? '#ffffff' : `rgb(${Math.round(255 * tint)},${Math.round(255 * tint)},${Math.round(255 * tint)})`) : material.baseColor}
        roughness={material.roughness}
        metalness={material.metalness}
      />
    </mesh>
  );
}

interface RoomShellProps {
  dimensions: RoomDimensions;
  floorMaterialId: string;
  wallMaterialId: string;
  showCeiling?: boolean;
}

/**
 * The parametric room: floor, back wall, left wall, right wall — and an optional
 * ceiling, off by default. The front wall (z = +width/2) is intentionally left
 * open so the customer is always looking into the room rather than at a wall.
 *
 * Changing a material only swaps the texture on an existing plane; geometry is
 * rebuilt only when a dimension actually changes.
 */
function RoomShell({ dimensions, floorMaterialId, wallMaterialId, showCeiling = false }: RoomShellProps) {
  const { length, width, height } = dimensions;

  return (
    <group>
      {/* Floor */}
      <SurfacePlane
        materialId={floorMaterialId}
        planeWidth={length}
        planeHeight={width}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* Back wall (faces the camera's default position) */}
      <SurfacePlane
        materialId={wallMaterialId}
        planeWidth={length}
        planeHeight={height}
        position={[0, height / 2, -width / 2]}
        rotation={[0, 0, 0]}
      />

      {/* Left wall */}
      <SurfacePlane
        materialId={wallMaterialId}
        planeWidth={width}
        planeHeight={height}
        position={[-length / 2, height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        tint={0.94}
      />

      {/* Right wall */}
      <SurfacePlane
        materialId={wallMaterialId}
        planeWidth={width}
        planeHeight={height}
        position={[length / 2, height / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        tint={0.88}
      />

      {showCeiling && (
        <SurfacePlane
          materialId={wallMaterialId}
          planeWidth={length}
          planeHeight={width}
          position={[0, height, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          tint={0.96}
        />
      )}
    </group>
  );
}

export default memo(RoomShell);
