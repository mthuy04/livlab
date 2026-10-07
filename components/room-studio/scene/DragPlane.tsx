'use client';

import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import type { PlacementType, Vec3, WallId } from '@/lib/room-studio/placementRules';

interface DragPlaneProps {
  dimensions: RoomDimensions;
  placementType: PlacementType;
  wall?: WallId;
  onMove: (point: Vec3) => void;
  onEnd: () => void;
}

/**
 * An invisible catcher plane, mounted only while a product is being dragged.
 *
 * Floor products drag across the horizontal plane; wall products drag across the
 * plane of the wall they are mounted to. Constraining the drag to one plane is
 * what keeps the interaction consumer-simple — there are no gizmos, no axes and
 * no mode switches to learn.
 *
 * The plane is oversized on purpose: the pointer routinely leaves the room while
 * dragging, and clampToRoom is what actually keeps the product inside.
 */
export default function DragPlane({ dimensions, placementType, wall = 'back', onMove, onEnd }: DragPlaneProps) {
  const span = Math.max(dimensions.length, dimensions.width, dimensions.height) * 6;

  const { position, rotation } = useMemo<{ position: Vec3; rotation: Vec3 }>(() => {
    if (placementType === 'wall') {
      if (wall === 'left') return { position: [-dimensions.length / 2, dimensions.height / 2, 0], rotation: [0, Math.PI / 2, 0] };
      if (wall === 'right') return { position: [dimensions.length / 2, dimensions.height / 2, 0], rotation: [0, -Math.PI / 2, 0] };
      return { position: [0, dimensions.height / 2, -dimensions.width / 2], rotation: [0, 0, 0] };
    }
    if (placementType === 'ceiling') {
      return { position: [0, dimensions.height, 0], rotation: [Math.PI / 2, 0, 0] };
    }
    return { position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0] };
  }, [placementType, wall, dimensions]);

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onMove([e.point.x, e.point.y, e.point.z]);
  };

  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onEnd();
  };

  return (
    <mesh position={position} rotation={rotation} onPointerMove={handleMove} onPointerUp={handleUp}>
      <planeGeometry args={[span, span]} />
      {/* Fully transparent rather than `visible={false}` so it still takes part
          in raycasting, and depthWrite off so it never occludes the room. */}
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={2} />
    </mesh>
  );
}
