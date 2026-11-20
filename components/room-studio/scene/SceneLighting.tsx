'use client';

import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import type { LightingPreset } from '@/lib/room-studio/environment';
import { keyLightPosition } from '@/lib/room-studio/stylePacks';
import type { ArchitecturalElement } from '@/lib/room-studio/architecture';
import { motionFraction } from './StyledSurfaceMaterial';
import type { RenderQuality } from './useRenderQuality';

/**
 * The room's light: a hemisphere fill, one shadow-casting key light, a soft
 * fill, and a reflection environment built locally from light panels.
 *
 * The environment is the part chrome needs. A metal with nothing around it to
 * reflect renders as flat grey, which is why the mixer and the flush lever
 * looked painted. The previous scene streamed an HDR from a CDN and lost every
 * reflection when that request failed; this one is rendered once from
 * Lightformers on the GPU, so it is always there and never touches the network.
 *
 * Exposure and environment strength are per preset and applied to the
 * renderer and scene, not to any product's materials: a product's own PBR
 * values are never overridden.
 */
export default function SceneLighting({
  dimensions,
  lighting,
  quality,
  windows,
}: {
  windows?: ArchitecturalElement[];
  dimensions: RoomDimensions;
  lighting: LightingPreset;
  quality: RenderQuality;
}) {
  // Renderer and scene settings are written through `get()`, inside effects:
  // they are the canvas's, not this component's state.
  const get = useThree((s) => s.get);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const span = Math.max(dimensions.length, dimensions.width);

  const sky = useRef<THREE.HemisphereLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const blend = useRef(0);
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)'), []);
  const target = useMemo(() => {
    const position = new THREE.Vector3(...keyLightPosition(dimensions, windows ?? [], lighting));
    return {
      position,
      fillPosition: new THREE.Vector3(-position.x, position.y * 0.7, -position.z * 0.55),
      sky: new THREE.Color(lighting.sky),
      ground: new THREE.Color(lighting.ground),
      key: new THREE.Color(lighting.key.color),
      fill: new THREE.Color(lighting.fill.color),
    };
  }, [dimensions, windows, lighting]);
  const first = useRef(true);
  const lastFrame = useRef(0);
  useEffect(() => {
    const state = get();
    state.gl.toneMapping = THREE.ACESFilmicToneMapping;
    state.gl.outputColorSpace = THREE.SRGBColorSpace;
    lastFrame.current = performance.now();
    blend.current = 1;
    state.invalidate();
  }, [get, target]);
  useFrame((state) => {
    if (!blend.current || !sky.current || !keyRef.current || !fill.current) return;
    const now = performance.now();
    const k =
      first.current || blend.current < 0.008
        ? 1
        : motionFraction((now - lastFrame.current) / 1000, reduced.matches);
    lastFrame.current = now;
    first.current = false;
    const key = keyRef.current,
      hemi = sky.current,
      bounce = fill.current;
    key.position.lerp(target.position, k);
    bounce.position.lerp(target.fillPosition, k);
    key.color.lerp(target.key, k);
    bounce.color.lerp(target.fill, k);
    hemi.color.lerp(target.sky, k);
    hemi.groundColor.lerp(target.ground, k);
    key.intensity = THREE.MathUtils.lerp(key.intensity, lighting.key.intensity, k);
    bounce.intensity = THREE.MathUtils.lerp(bounce.intensity, lighting.fill.intensity, k);
    hemi.intensity = THREE.MathUtils.lerp(hemi.intensity, lighting.hemisphereIntensity, k);
    state.gl.toneMappingExposure = THREE.MathUtils.lerp(state.gl.toneMappingExposure, lighting.exposure, k);
    state.scene.environmentIntensity = THREE.MathUtils.lerp(
      state.scene.environmentIntensity,
      lighting.environmentIntensity,
      k
    );
    blend.current *= 1 - k;
    if (blend.current) state.invalidate();
  });

  // Fit the shadow camera to the room so one shadow map covers it at the best
  // texel density it can; a default ±5m frustum wastes most of the map.
  useEffect(() => {
    const light = keyRef.current;
    if (!light) return;
    const cam = light.shadow.camera as THREE.OrthographicCamera;
    const half = span * 0.75 + 0.5;
    cam.left = -half;
    cam.right = half;
    cam.top = half;
    cam.bottom = -half;
    cam.near = 0.5;
    cam.far = 20;
    cam.updateProjectionMatrix();
    light.target.position.set(0, 0, 0);
    light.target.updateMatrixWorld();
  }, [span]);

  return (
    <>
      <hemisphereLight ref={sky} />
      <directionalLight
        ref={keyRef}
        castShadow
        shadow-mapSize-width={quality.shadowMapSize}
        shadow-mapSize-height={quality.shadowMapSize}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={4}
      />
      <directionalLight ref={fill} />
    </>
  );
}

// Drei recaptures its cubemap whenever its portal children change identity.
// Keep the local reflection rig stable throughout camera, draft and pack edits.
export const ReflectionStudio = memo(function ReflectionStudio({
  resolution,
  tint,
}: {
  resolution: number;
  tint: string;
}) {
  return (
    <Environment resolution={resolution} frames={1} background={false}>
      {/* Ceiling panels: what a glaze and a chrome curve reflect upward. */}
      <Lightformer
        form="rect"
        intensity={2.2}
        color={tint}
        position={[0, 4, 0]}
        rotation-x={Math.PI / 2}
        scale={[6, 4, 1]}
      />
      <Lightformer form="rect" intensity={1.1} color={tint} position={[0, 3, -4]} scale={[8, 2, 1]} />
      {/* The open side of the room, where the daylight comes from. */}
      <Lightformer
        form="rect"
        intensity={2.6}
        color="#FFFFFF"
        position={[0, 1.6, 6]}
        rotation-y={Math.PI}
        scale={[8, 3, 1]}
      />
      {/* Side strips give long edges on cylinders — a mixer bar, a riser. */}
      <Lightformer
        form="rect"
        intensity={1.4}
        color={tint}
        position={[-5, 1.5, 0]}
        rotation-y={Math.PI / 2}
        scale={[1.2, 5, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.0}
        color={tint}
        position={[5, 1.5, 0]}
        rotation-y={-Math.PI / 2}
        scale={[1.2, 5, 1]}
      />
      {/* A darker floor, so reflections have contrast and chrome reads as metal. */}
      <Lightformer
        form="rect"
        intensity={0.25}
        color="#8A847B"
        position={[0, -2, 0]}
        rotation-x={-Math.PI / 2}
        scale={[10, 10, 1]}
      />
    </Environment>
  );
});
