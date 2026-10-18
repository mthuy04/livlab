'use client';

import { useEffect, useRef, useState } from 'react';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { getDefaultCameraFraming } from '@/lib/room-studio/roomGeometry';

export type ViewMode = 'perspective' | 'plan';

/** A box to frame: the selected product's centre and size, metres. */
export interface FocusTarget {
  center: [number, number, number];
  size: [number, number, number];
  /** Bumped on every request, so asking twice re-frames twice. */
  nonce: number;
}

interface RoomCameraControlsProps {
  dimensions: RoomDimensions;
  /** Disabled while a product is being dragged, so one gesture does one thing. */
  enabled: boolean;
  /** Incrementing this value re-frames the room. */
  resetSignal: number;
  viewMode?: ViewMode;
  focus?: FocusTarget | null;
}

const PLAN_POLAR = 0.0001;

/** How long a re-frame takes. Short enough to feel direct, long enough to follow. */
const TRANSITION_S = 0.45;

/**
 * Orbit / zoom / pan with limits chosen so the customer cannot lose the room:
 * the camera stays above floor level, cannot pass under the floor, and cannot
 * zoom further out than a few room-lengths away.
 *
 * `plan` swaps to an orthographic camera looking straight down: a floor plan
 * where every product's footprint is its true shape and size, pan and zoom
 * only. `focus` glides the perspective camera to frame one product, keeping
 * the angle the customer was looking from.
 *
 * Touch is handled by OrbitControls natively (one finger orbits, two pinch/pan).
 */
export default function RoomCameraControls({
  dimensions,
  enabled,
  resetSignal,
  viewMode = 'perspective',
  focus = null,
}: RoomCameraControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const get = useThree((s) => s.get);
  /**
   * The plan's own camera, once it exists. The plan's controls are created
   * only against it: built a frame early against the default camera, their
   * pinned-vertical limit flattened the PERSPECTIVE camera to a top-down view,
   * and "Phối cảnh" came back looking straight down.
   */
  const [orthoCam, setOrthoCam] = useState<THREE.OrthographicCamera | null>(null);
  const size = useThree((s) => s.size);
  const aspect = size.height > 0 ? size.width / size.height : undefined;
  const framing = getDefaultCameraFraming(dimensions, aspect);
  const plan = viewMode === 'plan';

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

  /** An in-flight glide from where the camera is to where it should be. */
  const glide = useRef<{
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    t: number;
  } | null>(null);

  const startGlide = (toPos: THREE.Vector3, toTarget: THREE.Vector3) => {
    const controls = controlsRef.current;
    if (!controls) return;
    glide.current = {
      fromPos: get().camera.position.clone(),
      toPos,
      fromTarget: controls.target.clone(),
      toTarget,
      t: 0,
    };
  };

  // Re-frame on explicit reset. `dimensions` and `aspect` are intentionally
  // excluded: resizing the room, or the window, should not yank the camera
  // away from the angle the customer chose. Only mount and a reset re-frame;
  // leaving the plan view returns to whatever angle the customer had.
  const firstFrame = useRef(true);
  const appliedReset = useRef(resetSignal);
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || plan) return;
    const { position, target } = getDefaultCameraFraming(dimensions, aspect);
    if (firstFrame.current) {
      firstFrame.current = false;
      get().camera.position.set(position[0], position[1], position[2]);
      controls.target.set(target[0], target[1], target[2]);
      controls.update();
      return;
    }
    if (appliedReset.current === resetSignal) return;
    appliedReset.current = resetSignal;
    startGlide(new THREE.Vector3(...position), new THREE.Vector3(...target));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal, plan]);

  // Frame one product: keep the viewing direction, move in until its bounding
  // sphere fills about a third of the view.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!focus || !controls || plan) return;
    const center = new THREE.Vector3(...focus.center);
    const radius = Math.max(0.25, Math.hypot(...focus.size) / 2);
    const live = get().camera;
    const fov = ((live as THREE.PerspectiveCamera).fov ?? 50) * (Math.PI / 180);
    const distance = Math.max(framing.minDistance, (radius / Math.sin(fov / 2)) * 1.6);
    const dir = live.position.clone().sub(controls.target).normalize();
    // Never frame from below the floor or flat along it.
    if (dir.y < 0.35) dir.y = 0.35;
    dir.normalize();
    startGlide(center.clone().add(dir.multiplyScalar(distance)), center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.nonce]);

  // Plan view: centre the room and fit it, every time the plan is entered or
  // the canvas changes shape. Orthographic zoom is pixels per metre.
  const planZoom = Math.max(
    10,
    Math.min(size.width / (dimensions.length + 0.8), size.height / (dimensions.width + 0.8))
  );
  useEffect(() => {
    const controls = controlsRef.current;
    const ortho = get().camera as THREE.OrthographicCamera;
    if (!plan || !controls || !orthoCam || !ortho.isOrthographicCamera) return;
    ortho.position.set(0, dimensions.height + 6, 0.0001);
    ortho.zoom = planZoom;
    ortho.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
  }, [plan, orthoCam, planZoom, dimensions.height, get]);

  useFrame((_, delta) => {
    const g = glide.current;
    const controls = controlsRef.current;
    if (!g || !controls) return;
    g.t = Math.min(1, g.t + delta / TRANSITION_S);
    const k = 1 - Math.pow(1 - g.t, 3);
    get().camera.position.lerpVectors(g.fromPos, g.toPos, k);
    controls.target.lerpVectors(g.fromTarget, g.toTarget, k);
    controls.update();
    if (g.t >= 1) glide.current = null;
  });


  return (
    <>
      {plan && (
        <OrthographicCamera
          ref={setOrthoCam}
          makeDefault
          position={[0, dimensions.height + 6, 0.0001]}
          zoom={planZoom}
          near={0.1}
          far={dimensions.height + 20}
        />
      )}
      {(!plan || orthoCam) && (
      <OrbitControls
        ref={controlsRef}
        key={viewMode}
        camera={plan ? orthoCam! : undefined}
        enabled={enabled}
        enablePan
        enableZoom
        enableRotate={!plan}
        enableDamping
        dampingFactor={0.12}
        // Plan view pans across the floor, not across the screen's own plane
        // tilted by whatever angle the perspective camera last had.
        screenSpacePanning
        minDistance={plan ? undefined : framing.minDistance}
        maxDistance={plan ? undefined : framing.maxDistance}
        minZoom={plan ? planZoom * 0.5 : undefined}
        maxZoom={plan ? planZoom * 6 : undefined}
        // Plan: pinned a hair off vertical, which also fixes the orientation —
        // the camera sits a fraction toward the open front, so the back wall
        // is the top edge of the screen, as on a drawing.
        minPolarAngle={plan ? PLAN_POLAR : 0.15}
        maxPolarAngle={plan ? PLAN_POLAR : framing.maxPolarAngle}
        target={plan ? [0, 0, 0] : framing.target}
        makeDefault
        // Gentler rotation and zoom than the defaults: a bathroom is small,
        // and the default speeds swing it past the angle you wanted.
        rotateSpeed={0.7}
        zoomSpeed={0.8}
        panSpeed={0.8}
      />
      )}
    </>
  );
}
