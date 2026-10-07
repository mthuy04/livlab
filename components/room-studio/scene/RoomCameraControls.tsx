'use client';

import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { getDefaultCameraFraming } from '@/lib/room-studio/roomGeometry';

interface RoomCameraControlsProps {
  dimensions: RoomDimensions;
  /** Disabled while a product is being dragged, so one gesture does one thing. */
  enabled: boolean;
  /** Incrementing this value re-frames the room. */
  resetSignal: number;
}

/**
 * Orbit / zoom / pan with limits chosen so the customer cannot lose the room:
 * the camera stays above floor level, cannot pass under the floor, and cannot
 * zoom further out than a few room-lengths away.
 *
 * Touch is handled by OrbitControls natively (one finger orbits, two pinch/pan).
 */
export default function RoomCameraControls({ dimensions, enabled, resetSignal }: RoomCameraControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const framing = getDefaultCameraFraming(dimensions);

  // Re-frame on explicit reset, and whenever the room's proportions change
  // enough that the previous framing would no longer show the whole room.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const { position, target } = getDefaultCameraFraming(dimensions);
    camera.position.set(position[0], position[1], position[2]);
    controls.target.set(target[0], target[1], target[2]);
    controls.update();
    // `dimensions` is intentionally excluded: resizing the room should not yank
    // the camera away from the angle the customer chose. Only an explicit reset
    // re-frames.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      enablePan
      enableZoom
      enableDamping
      dampingFactor={0.12}
      minDistance={framing.minDistance}
      maxDistance={framing.maxDistance}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2 - 0.02}
      target={framing.target}
      makeDefault
    />
  );
}
