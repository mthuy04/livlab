'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import type { LightingPreset } from '@/lib/room-studio/environment';
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
}: {
  dimensions: RoomDimensions;
  lighting: LightingPreset;
  quality: RenderQuality;
}) {
  // Renderer and scene settings are written through `get()`, inside effects:
  // they are the canvas's, not this component's state.
  const get = useThree((s) => s.get);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const span = Math.max(dimensions.length, dimensions.width);

  useEffect(() => {
    const { gl } = get();
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = lighting.exposure;
  }, [get, lighting.exposure]);

  useEffect(() => {
    get().scene.environmentIntensity = lighting.environmentIntensity;
  }, [get, lighting.environmentIntensity]);

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

  const keyPosition = useMemo<[number, number, number]>(() => {
    const [x, y, z] = lighting.key.position;
    const s = Math.max(1, span / 3);
    return [x * s, y, z * s];
  }, [lighting.key.position, span]);

  return (
    <>
      <hemisphereLight args={[lighting.sky, lighting.ground, lighting.hemisphereIntensity]} />
      <directionalLight
        ref={keyRef}
        position={keyPosition}
        color={lighting.key.color}
        intensity={lighting.key.intensity}
        castShadow
        shadow-mapSize-width={quality.shadowMapSize}
        shadow-mapSize-height={quality.shadowMapSize}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={4}
      />
      <directionalLight position={[-keyPosition[0], keyPosition[1] * 0.7, -keyPosition[2] * 0.4]} color={lighting.fill.color} intensity={lighting.fill.intensity} />

      <Environment resolution={quality.environmentResolution} frames={1} background={false}>
        {/* Ceiling panels: what a glaze and a chrome curve reflect upward. */}
        <Lightformer form="rect" intensity={2.2} color={lighting.environmentTint} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} color={lighting.environmentTint} position={[0, 3, -4]} scale={[8, 2, 1]} />
        {/* The open side of the room, where the daylight comes from. */}
        <Lightformer form="rect" intensity={2.6} color="#FFFFFF" position={[0, 1.6, 6]} rotation-y={Math.PI} scale={[8, 3, 1]} />
        {/* Side strips give long edges on cylinders — a mixer bar, a riser. */}
        <Lightformer form="rect" intensity={1.4} color={lighting.environmentTint} position={[-5, 1.5, 0]} rotation-y={Math.PI / 2} scale={[1.2, 5, 1]} />
        <Lightformer form="rect" intensity={1.0} color={lighting.environmentTint} position={[5, 1.5, 0]} rotation-y={-Math.PI / 2} scale={[1.2, 5, 1]} />
        {/* A darker floor, so reflections have contrast and chrome reads as metal. */}
        <Lightformer form="rect" intensity={0.25} color="#8A847B" position={[0, -2, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
    </>
  );
}
