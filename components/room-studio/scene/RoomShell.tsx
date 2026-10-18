'use client';

import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { resolveSurfaceMaterial, type SurfaceStyle } from '@/lib/room-studio/materials';
import {
  glassPartitionRect,
  nicheRect,
  windowRect,
  type ArchitectureSettings,
  type LightingPreset,
} from '@/lib/room-studio/environment';
import { useSurfaceMaps } from './useSurfaceMaps';

/** An opening cut through a wall, in the wall's own 2D frame (metres, origin bottom-left). */
interface Opening {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A wall or floor as real geometry: a rectangle with its openings cut out,
 * UVs normalised to the rectangle so the PBR maps' repeat count — derived
 * from the surface's size in metres — lands every tile at its true size.
 */
function surfaceGeometry(width: number, height: number, openings: Opening[]): THREE.BufferGeometry {
  if (openings.length === 0) {
    return new THREE.PlaneGeometry(width, height);
  }
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width, height);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);
  for (const o of openings) {
    const hole = new THREE.Path();
    hole.moveTo(o.x, o.y);
    hole.lineTo(o.x, o.y + o.height);
    hole.lineTo(o.x + o.width, o.y + o.height);
    hole.lineTo(o.x + o.width, o.y);
    hole.lineTo(o.x, o.y);
    shape.holes.push(hole);
  }
  const geometry = new THREE.ShapeGeometry(shape);
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / width;
    uv[i * 2 + 1] = pos.getY(i) / height;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.translate(-width / 2, -height / 2, 0);
  return geometry;
}

interface SurfaceProps {
  style: SurfaceStyle;
  width: number;
  height: number;
  position: [number, number, number];
  rotation: [number, number, number];
  openings?: Opening[];
  /** Side walls take a touch less light so the corner reads. */
  tint?: number;
  resolution: number;
  /**
   * The point a camera must be on the FAR side of for this wall to fade — the
   * wall's plane, and the direction pointing into the room.
   */
  cutaway?: { plane: THREE.Plane } | null;
}

function Surface({ style, width, height, position, rotation, openings = [], tint = 1, resolution, cutaway }: SurfaceProps) {
  const material = resolveSurfaceMaterial(style);
  const maps = useSurfaceMaps(material, width, height, resolution);
  const geometry = useMemo(() => surfaceGeometry(width, height, openings), [width, height, openings]);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Fade, don't delete: a wall the camera is behind becomes a ghost the
  // customer can still read the room's edge from, and comes back the moment
  // the camera is inside again.
  useFrame(({ camera }) => {
    const mat = matRef.current;
    if (!mat || !cutaway) return;
    const behind = cutaway.plane.distanceToPoint(camera.position) < 0;
    const target = behind ? 0.12 : 1;
    const next = mat.opacity + (target - mat.opacity) * 0.25;
    if (Math.abs(next - mat.opacity) > 0.002) {
      mat.opacity = next;
      mat.transparent = next < 0.999;
      mat.depthWrite = next > 0.5;
      if (meshRef.current) meshRef.current.castShadow = next > 0.5;
    }
  });

  const shade = `rgb(${Math.round(255 * tint)},${Math.round(255 * tint)},${Math.round(255 * tint)})`;
  return (
    <mesh ref={meshRef} geometry={geometry} position={position} rotation={rotation} receiveShadow>
      <meshStandardMaterial
        ref={matRef}
        map={maps?.map ?? null}
        roughnessMap={maps?.roughnessMap ?? null}
        bumpMap={maps?.bumpMap ?? null}
        bumpScale={0.6}
        color={maps ? shade : material.baseColor}
        // The roughness map carries absolute values; 1 lets it through as drawn.
        roughness={maps ? 1 : material.roughness}
        metalness={material.metalness}
      />
    </mesh>
  );
}

/** A slim skirting line along the base of one wall. */
function Skirting({ length, position, rotation, color }: { length: number; position: [number, number, number]; rotation: [number, number, number]; color: string }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <boxGeometry args={[length, 0.08, 0.012]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}

/** Dark section caps on top of the walls, so the plan view reads as a drawing. */
function WallCaps({ dimensions }: { dimensions: RoomDimensions }) {
  const { length, width, height } = dimensions;
  const t = 0.1;
  const mat = <meshStandardMaterial color="#7C848B" roughness={0.9} />;
  return (
    <group>
      <mesh position={[0, height + 0.005, -width / 2 - t / 2]}>
        <boxGeometry args={[length + t * 2, 0.01, t]} />
        {mat}
      </mesh>
      <mesh position={[-length / 2 - t / 2, height + 0.005, 0]}>
        <boxGeometry args={[t, 0.01, width]} />
        {mat}
      </mesh>
      <mesh position={[length / 2 + t / 2, height + 0.005, 0]}>
        <boxGeometry args={[t, 0.01, width]} />
        {mat}
      </mesh>
    </group>
  );
}

function Niche({ dimensions, wallStyle }: { dimensions: RoomDimensions; wallStyle: SurfaceStyle }) {
  const n = nicheRect(dimensions);
  const color = resolveSurfaceMaterial(wallStyle).baseColor;
  const z = -dimensions.width / 2 - n.depth / 2;
  return (
    <group position={[n.centreX, n.centreY, z]}>
      {/* Inside faces only: the box is drawn from within, through the opening. */}
      <mesh receiveShadow>
        <boxGeometry args={[n.width, n.height, n.depth]} />
        <meshStandardMaterial color={color} roughness={0.6} side={THREE.BackSide} />
      </mesh>
      {/* LED strip under the head of the niche. */}
      <mesh position={[0, n.height / 2 - 0.012, 0]}>
        <boxGeometry args={[n.width - 0.02, 0.006, n.depth - 0.02]} />
        <meshStandardMaterial color="#FFF3DD" emissive="#FFE6B8" emissiveIntensity={1.6} />
      </mesh>
      <pointLight position={[0, n.height / 2 - 0.05, n.depth / 2]} intensity={0.25} distance={0.8} decay={2} color="#FFE6B8" />
    </group>
  );
}

function WindowOpening({ dimensions }: { dimensions: RoomDimensions }) {
  const w = windowRect(dimensions);
  const x = -dimensions.length / 2;
  const frame = '#2F3438';
  const t = 0.035;
  return (
    <group position={[x, w.sill + w.height / 2, w.centreZ]}>
      {/* Daylight beyond the opening: an emissive panel, not a sky render. */}
      <mesh position={[-0.25, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[w.width + 0.6, w.height + 0.6]} />
        <meshBasicMaterial color="#EAF3FA" toneMapped={false} />
      </mesh>
      {[
        [0, w.height / 2, 0, t, t, w.width + t * 2],
        [0, -w.height / 2, 0, t, t, w.width + t * 2],
        [0, 0, w.width / 2, t, w.height, t],
        [0, 0, -w.width / 2, t, w.height, t],
        [0, 0, 0, t * 0.6, w.height, t * 0.6],
      ].map(([px, py, pz, sx, sy, sz], i) => (
        <mesh key={i} position={[px, py, pz]} castShadow>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial color={frame} roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[w.width, w.height]} />
        <meshStandardMaterial color="#DDE8EE" transparent opacity={0.15} roughness={0.05} metalness={0.1} />
      </mesh>
    </group>
  );
}

function GlassPartition({ dimensions }: { dimensions: RoomDimensions }) {
  const g = glassPartitionRect(dimensions);
  const zBack = -dimensions.width / 2;
  const frame = '#24282C';
  const t = 0.018;
  return (
    <group position={[g.x, 0, zBack + g.depth / 2]}>
      <mesh position={[0, g.height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[g.depth, g.height]} />
        <meshStandardMaterial
          color="#E9F1F4"
          transparent
          opacity={0.14}
          roughness={0.04}
          metalness={0.05}
          envMapIntensity={1.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Slim black profile: top rail, front post, floor channel. */}
      <mesh position={[0, g.height, 0]} castShadow>
        <boxGeometry args={[t, t, g.depth]} />
        <meshStandardMaterial color={frame} roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh position={[0, g.height / 2, g.depth / 2]} castShadow>
        <boxGeometry args={[t, g.height, t]} />
        <meshStandardMaterial color={frame} roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.006, 0]}>
        <boxGeometry args={[t * 1.4, 0.012, g.depth]} />
        <meshStandardMaterial color={frame} roughness={0.35} metalness={0.6} />
      </mesh>
    </group>
  );
}

function Downlights({ dimensions, lighting, visible }: { dimensions: RoomDimensions; lighting: LightingPreset; visible: boolean }) {
  const { length, width, height } = dimensions;
  const points = useMemo<Array<[number, number]>>(() => {
    const nx = length > 3.2 ? 3 : 2;
    const out: Array<[number, number]> = [];
    for (let i = 0; i < nx; i++) out.push([-length / 2 + ((i + 0.5) * length) / nx, -width * 0.12]);
    return out;
  }, [length, width]);
  if (lighting.downlights.intensity <= 0) return null;
  return (
    <group>
      {points.map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, height - 0.01, z]}>
          {visible && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.045, 24]} />
              <meshBasicMaterial color="#FFF6E6" toneMapped={false} />
            </mesh>
          )}
          <pointLight
            position={[0, -0.05, 0]}
            intensity={lighting.downlights.intensity * 1.6}
            distance={height * 2.2}
            decay={2}
            color={lighting.downlights.color}
          />
        </group>
      ))}
    </group>
  );
}

interface RoomShellProps {
  dimensions: RoomDimensions;
  floorStyle: SurfaceStyle;
  wallStyle: SurfaceStyle;
  showCeiling?: boolean;
  architecture: ArchitectureSettings;
  lighting: LightingPreset;
  /** Canvas width of the procedural maps; lower on a lighter scene. */
  textureResolution: number;
  /** Plan view: walls are seen edge-on, so the caps carry the drawing. */
  planView?: boolean;
}

/**
 * The parametric room: floor, back wall, left wall, right wall — and an optional
 * ceiling, off by default. The front wall (z = +width/2) is intentionally left
 * open so the customer is always looking into the room rather than at a wall,
 * and the other three fade when the camera orbits behind them.
 *
 * Context — skirting, niche, window, glass screen — belongs to the room, not
 * the quote, and each piece is switched by `architecture`.
 */
function RoomShell({
  dimensions,
  floorStyle,
  wallStyle,
  showCeiling = false,
  architecture,
  lighting,
  textureResolution,
  planView = false,
}: RoomShellProps) {
  const { length, width, height } = dimensions;

  const backOpenings = useMemo<Opening[]>(() => {
    if (!architecture.niche) return [];
    const n = nicheRect(dimensions);
    return [{ x: n.centreX - n.width / 2 + length / 2, y: n.centreY - n.height / 2, width: n.width, height: n.height }];
  }, [architecture.niche, dimensions, length]);

  const leftOpenings = useMemo<Opening[]>(() => {
    if (!architecture.window) return [];
    const w = windowRect(dimensions);
    // The left wall's own frame runs from the front (z = +width/2) to the back.
    return [{ x: width / 2 - w.centreZ - w.width / 2, y: w.sill, width: w.width, height: w.height }];
  }, [architecture.window, dimensions, width]);

  const cut = architecture.cutaway && !planView;
  const planes = useMemo(
    () => ({
      back: new THREE.Plane(new THREE.Vector3(0, 0, 1), width / 2),
      left: new THREE.Plane(new THREE.Vector3(1, 0, 0), length / 2),
      right: new THREE.Plane(new THREE.Vector3(-1, 0, 0), length / 2),
    }),
    [length, width]
  );

  const skirtColor = useMemo(() => {
    const c = new THREE.Color(resolveSurfaceMaterial(wallStyle).baseColor);
    c.offsetHSL(0, 0, -0.1);
    return `#${c.getHexString()}`;
  }, [wallStyle]);

  return (
    <group>
      <Surface
        style={floorStyle}
        width={length}
        height={width}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        resolution={textureResolution}
      />

      <Surface
        style={wallStyle}
        width={length}
        height={height}
        position={[0, height / 2, -width / 2]}
        rotation={[0, 0, 0]}
        openings={backOpenings}
        resolution={textureResolution}
        cutaway={cut ? { plane: planes.back } : null}
      />
      <Surface
        style={wallStyle}
        width={width}
        height={height}
        position={[-length / 2, height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        openings={leftOpenings}
        tint={0.94}
        resolution={textureResolution}
        cutaway={cut ? { plane: planes.left } : null}
      />
      <Surface
        style={wallStyle}
        width={width}
        height={height}
        position={[length / 2, height / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        tint={0.9}
        resolution={textureResolution}
        cutaway={cut ? { plane: planes.right } : null}
      />

      {showCeiling && !planView && (
        <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[length, width]} />
          <meshStandardMaterial color="#F4F2EE" roughness={0.9} />
        </mesh>
      )}

      {architecture.skirting && (
        <group>
          <Skirting length={length} position={[0, 0.04, -width / 2 + 0.006]} rotation={[0, 0, 0]} color={skirtColor} />
          <Skirting length={width} position={[-length / 2 + 0.006, 0.04, 0]} rotation={[0, Math.PI / 2, 0]} color={skirtColor} />
          <Skirting length={width} position={[length / 2 - 0.006, 0.04, 0]} rotation={[0, -Math.PI / 2, 0]} color={skirtColor} />
        </group>
      )}

      {architecture.niche && <Niche dimensions={dimensions} wallStyle={wallStyle} />}
      {architecture.window && <WindowOpening dimensions={dimensions} />}
      {architecture.glassPartition && <GlassPartition dimensions={dimensions} />}

      <Downlights dimensions={dimensions} lighting={lighting} visible={showCeiling && !planView} />
      <WallCaps dimensions={dimensions} />
    </group>
  );
}

export default memo(RoomShell);
