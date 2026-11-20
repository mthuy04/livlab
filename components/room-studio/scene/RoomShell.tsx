'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { resolveSurfaceMaterial, type SurfaceStyle } from '@/lib/room-studio/materials';
import {
  nicheRect,
  type ArchitectureSettings,
  type LightingPreset,
} from '@/lib/room-studio/environment';
import StyledSurfaceMaterial, {motionFraction} from './StyledSurfaceMaterial';
import { STYLE_PACKS, styledChannel, type StylePackId, type VisualStyle } from '@/lib/room-studio/stylePacks';

import { WALLS, elementsForFlags, isWallElement, renderedWalls, openingFitsWall, wallFrame, wallOpenings, wallCutaway, type ArchitecturalElement, type RoomWall, type WallElement, type WallOpening } from '@/lib/room-studio/architecture';
import { solidWallRects, surfaceGeometry } from '@/lib/room-studio/wallMesh';
import { WindowNode, PartitionNode } from './GlassArchitecture';
import { canDrawPartition } from '@/lib/room-studio/glassGeometry';
import EntranceDoorNode from './EntranceDoorNode';

const EMPTY: never[] = [];

interface SurfaceProps {
  mineralMap: THREE.Texture | null;
  sunlightOccluder?: boolean;
  role?: 'floor' | 'walls';
  pack?: StylePackId;
  style: SurfaceStyle;
  width: number;
  height: number;
  position: [number, number, number];
  rotation: [number, number, number];
  openings?: WallOpening[];
  /** Side walls take a touch less light so the corner reads. */
  tint?: number;
  resolution: number;
  doubleSided?: boolean;
}

function Surface({ style, pack, mineralMap, sunlightOccluder, role = 'walls', width, height, position, rotation, openings = EMPTY, tint = 1, resolution, doubleSided }: SurfaceProps) {
  const cuts = JSON.stringify(openings.map(({ x, y, width, height }) => ({ x, y, width, height })));
  const geometry = useMemo(() => surfaceGeometry(width, height, JSON.parse(cuts)), [width, height, cuts]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh name="wall-surface" geometry={geometry} position={position} rotation={rotation} castShadow={sunlightOccluder} receiveShadow>
      <StyledSurfaceMaterial {...{style,mineralMap,role,pack,width,height,tint,resolution,doubleSided}}/>
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

interface WallProps { mineralMap: THREE.Texture | null; sunlightOccluder: boolean; pack?:StylePackId; room: RoomDimensions; wall: RoomWall; openings: WallOpening[]; wallStyle: SurfaceStyle; resolution: number;
    cutaway: boolean; skirting: boolean; skirtColor: string; wallElements: WallElement[]; plan: boolean; legacy: boolean; selected?: string | null;
}

const Wall = memo(function Wall({ room, wall, openings, wallStyle, resolution, cutaway, skirting, skirtColor, wallElements, plan, legacy, selected, pack, mineralMap, sunlightOccluder }: WallProps) {
  const group = useRef<THREE.Group>(null);
  const frame = useMemo(() => wallFrame(room, wall), [room, wall]);
  const centre = frame.point(frame.span / 2);
  const solids = useMemo(() => solidWallRects(frame.span, room.height, openings), [frame.span, room.height, openings]);
  const caps = useMemo(() => plan
    ? solidWallRects(frame.span, 1, openings.filter(o => o.id !== 'niche').map(o => ({ ...o, y:0, height:1 })))
    : solids.filter(r => Math.abs(r.y + r.height - room.height) < 1e-8), [plan, frame.span, room.height, openings, solids]);
  const opacity = useRef(1);
  const refresh = useRef(true);
  useEffect(() => { refresh.current = true; });
  useFrame(({ camera, invalidate }) => {
    if (!group.current) return;
    const outside = wallCutaway(frame, camera.position, cutaway && !plan);
    const target = outside ? 0.12 : 1;
    if (!refresh.current && opacity.current === target) return;
    const next = opacity.current + (target - opacity.current) * 0.25;
    opacity.current = Math.abs(next - target) < 0.002 ? target : next;
    if (opacity.current !== target) invalidate();
    refresh.current = false;
    group.current.traverse(obj => {
      if (!(obj instanceof THREE.Mesh) || !(obj.material instanceof THREE.MeshStandardMaterial)) return;
      if (legacy && obj.name !== 'wall-surface') return;
      const glassOpacity = obj.material.userData.glassOpacity;
      if (typeof glassOpacity === 'number') {
        obj.material.opacity = glassOpacity * opacity.current;
        return;
      }
      obj.material.transparent = opacity.current < 1;
      obj.material.depthWrite = opacity.current > 0.5;
      obj.material.opacity = opacity.current;
      if (obj.name === 'door-leaf') obj.castShadow = !outside;
    });
  });
  const tint = wall === 'left' ? 0.94 : wall === 'right' ? 0.9 : 1;
  // Tagged so a mirror's reflection pass can draw a cut-away wall solid: the
  // fade is for the viewer's camera, and a mirror shows the room as it is.
  return <group ref={group} userData={{ livlabCutawayWall: true }}>
    <Surface mineralMap={mineralMap} sunlightOccluder={sunlightOccluder} pack={pack} style={wallStyle} width={frame.span} height={room.height} position={[centre.x, room.height/2, centre.z]}
      rotation={[0, frame.yaw, 0]} openings={openings} tint={tint} resolution={resolution} doubleSided={wallElements.length > 0} />
    {solids.filter(r => r.y === 0).map(r => {
      const p = frame.point(r.x + r.width/2, 0.006);
      return skirting && <Skirting key={r.x} length={r.width} position={[p.x, 0.04, p.z]} rotation={[0, frame.yaw, 0]} color={skirtColor} />;
    })}
    {caps.map(r => {
      const leftExtension = wall === 'back' && r.x === 0 ? 0.1 : 0;
      const rightExtension = wall === 'back' && r.x + r.width === frame.span ? 0.1 : 0;
      const p = frame.point(r.x + (r.width + rightExtension - leftExtension)/2, -0.05);
      return <mesh key={r.x} position={[p.x, room.height + 0.005, p.z]} rotation={[0, frame.yaw, 0]}>
        <boxGeometry args={[r.width + leftExtension + rightExtension, 0.01, 0.1]} /><meshStandardMaterial color="#7C848B" roughness={0.9} />
      </mesh>;
    })}
    {wallElements.map(d => d.type === 'window' ? <WindowNode key={d.id} room={room} element={d} plan={plan} selected={selected === d.id} /> : <EntranceDoorNode key={d.id} room={room} door={d} plan={plan} selected={selected === d.id} />)}
  </group>;
}, (a,b) => a.mineralMap === b.mineralMap && a.sunlightOccluder === b.sunlightOccluder && a.pack === b.pack && a.room === b.room && a.wall === b.wall && a.wallStyle === b.wallStyle && a.resolution === b.resolution &&
  a.cutaway === b.cutaway && a.skirting === b.skirting && a.skirtColor === b.skirtColor && a.plan === b.plan &&
  a.legacy === b.legacy && a.selected === b.selected && a.wallElements.length === b.wallElements.length &&
  a.wallElements.every((el,i) => el === b.wallElements[i]) && a.openings.length === b.openings.length &&
  a.openings.every((r,i) => {
    const o = b.openings[i];
    return r.x === o.x && r.y === o.y && r.width === o.width && r.height === o.height && r.id === o.id;
  }));

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

function Downlights({ dimensions, lighting, visible, styled }: { dimensions: RoomDimensions; lighting: LightingPreset; visible: boolean; styled:boolean }) {
  const { length, width, height } = dimensions;
  const points = useMemo<Array<[number, number]>>(() => {
    const nx = length > 3.2 ? 3 : 2;
    const out: Array<[number, number]> = [];
    for (let i = 0; i < nx; i++) out.push([-length / 2 + ((i + 0.5) * length) / nx, -width * 0.12]);
    return out;
  }, [length, width]);
  const group=useRef<THREE.Group>(null);
  const reduced=useMemo(()=>window.matchMedia('(prefers-reduced-motion: reduce)'),[]);
  const targetColor=useMemo(()=>new THREE.Color(lighting.downlights.color),[lighting.downlights.color]);
  useFrame((state,dt)=>{
    const target=lighting.downlights.intensity*1.6;
    const fraction=motionFraction(dt,reduced.matches);
    group.current?.traverse(obj=>{
      if(!(obj instanceof THREE.PointLight))return;
      if(Math.abs(target-obj.intensity)<.009){obj.intensity=target;obj.color.copy(targetColor);return;}
      obj.intensity=THREE.MathUtils.lerp(obj.intensity,target,fraction);
      obj.color.lerp(targetColor,fraction);state.invalidate();
    });
  });
  // Keep the light count constant so the first style switch reuses warmed product shaders.
  return (
    <group ref={group}>
      {points.map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, height - 0.01, z]}>
          {visible && (styled || lighting.downlights.intensity > 0) && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.045, 24]} />
              <meshBasicMaterial color="#FFF6E6" toneMapped={false} />
            </mesh>
          )}
          <pointLight
            position={[0, -0.05, 0]}
            intensity={0}
            distance={height * 2.2}
            decay={2}
            color="#fff4e4"
          />
        </group>
      ))}
    </group>
  );
}

interface RoomShellProps {
  enclosed?:boolean;
  visualStyle?: VisualStyle;
  dimensions: RoomDimensions;
  floorStyle: SurfaceStyle;
  wallStyle: SurfaceStyle;
  showCeiling?: boolean;
  architecture: ArchitectureSettings;
  elements?: ArchitecturalElement[];
  selectedElementId?: string | null;
  lighting: LightingPreset;
  /** Canvas width of the procedural maps; lower on a lighter scene. */
  textureResolution: number;
  /** Plan view: walls are seen edge-on, so the caps carry the drawing. */
  planView?: boolean;
}

// Legacy designs retain the open viewing side. A front entrance brings its
// own wall into the shell, with the same orbit-aware cutaway as the other walls.
function RoomShell({
  dimensions,
  floorStyle,
  wallStyle, visualStyle,
  showCeiling = false,
  architecture, elements, selectedElementId,
  lighting,
  textureResolution,
  planView = false, enclosed=false,
}: RoomShellProps) {
  const { length, width, height } = dimensions;

  const [mineralMap, setMineralMap] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let active = true;
    const texture = new THREE.TextureLoader().load('/room-studio/styles/minerals.webp', map => {
      if (!active) return;
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      // RGB channels encode independent material fields in linear data space.
      map.colorSpace = THREE.NoColorSpace;
      map.anisotropy = 4;
      setMineralMap(map);
    });
    return () => { active = false; texture.dispose(); };
  }, []);

  // Standalone legacy scene callers still pass flags. Room Studio always supplies elements.
  const layout = useMemo(() => elements ?? elementsForFlags(dimensions, [], architecture), [elements, dimensions, architecture]);
  const walls = useMemo(() => {
    const valid = layout.filter(isWallElement).filter(d => openingFitsWall(dimensions, d));
    const openings = wallOpenings(dimensions, architecture, valid);
    return (enclosed ? WALLS : renderedWalls(valid)).map(wall => ({ wall, openings: openings.filter(o => o.wall === wall),
      wallElements: valid.filter(d => d.wall === wall) }));
  }, [dimensions, architecture, layout, enclosed]);

  const wallPack = styledChannel(visualStyle, 'walls');
  const skirtColor = useMemo(() => {
    if (wallPack) return STYLE_PACKS[wallPack].walls.base;
    const c = new THREE.Color(resolveSurfaceMaterial(wallStyle).baseColor);
    c.offsetHSL(0, 0, -0.1);
    return `#${c.getHexString()}`;
  }, [wallStyle, wallPack]);

  return (
    <group>
      <Surface
        role="floor" mineralMap={mineralMap} pack={styledChannel(visualStyle,'floor')} style={floorStyle}
        width={length}
        height={width}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        resolution={textureResolution}
      />

      {walls.map(w => <Wall mineralMap={mineralMap} sunlightOccluder={!!styledChannel(visualStyle, 'lighting') && w.wallElements.some(e=>e.type==='window')} pack={styledChannel(visualStyle,'walls')} key={w.wall} {...w} room={dimensions} wallStyle={wallStyle} resolution={textureResolution}
        legacy={!layout.length} cutaway={!enclosed && architecture.cutaway} skirting={architecture.skirting} skirtColor={skirtColor} plan={planView} selected={w.wallElements.some(e => e.id === selectedElementId) ? selectedElementId : undefined} />)}

      {showCeiling && !planView && (
        <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[length, width]} />
          <meshStandardMaterial color="#F4F2EE" roughness={0.9} />
        </mesh>
      )}

      {architecture.niche && <Niche dimensions={dimensions} wallStyle={wallStyle} />}
      {layout.map(e => e.type === 'shower-partition' && canDrawPartition(dimensions, e) &&
        <PartitionNode trim={visualStyle && STYLE_PACKS[visualStyle.id].trim} key={e.id} element={e} selected={e.id === selectedElementId} plan={planView} />)}

      <Downlights styled={!!visualStyle} dimensions={dimensions} lighting={lighting} visible={showCeiling && !planView} />
    </group>
  );
}

export default memo(RoomShell);
