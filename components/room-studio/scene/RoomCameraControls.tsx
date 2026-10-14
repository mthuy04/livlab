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
  const size = useThree((s) => s.size);
  const aspect = size.height > 0 ? size.width / size.height : undefined;
  const framing = getDefaultCameraFraming(dimensions, aspect);

  /**
   * Put `enabled` back on the instance whenever it changes.
   *
   * `PlacedProductNode` switches this off imperatively at pointerdown, because
   * waiting for this prop to arrive gives OrbitControls time to start an orbit
   * in the same gesture. That write is invisible to React, so this effect is
   * what guarantees the camera comes back when the drag ends rather than
   * relying on drei re-applying a prop whose value it already believes it has.
   */
  useEffect(() => {
    const controls = controlsRef.current;
    if (controls) controls.enabled = enabled;
  }, [enabled]);

  // Re-frame on explicit reset, and whenever the room's proportions change
  // enough that the previous framing would no longer show the whole room.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const { position, target } = getDefaultCameraFraming(dimensions, aspect);
    camera.position.set(position[0], position[1], position[2]);
    controls.target.set(target[0], target[1], target[2]);
    controls.update();
    // `dimensions` and `aspect` are intentionally excluded: resizing the room,
    // or the window, should not yank the camera away from the angle the
    // customer chose. Only mount and an explicit reset re-frame.
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
