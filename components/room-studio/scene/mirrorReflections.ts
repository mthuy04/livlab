'use client';

/**
 * Live planar reflections for the mirrors in Room Studio.
 *
 * A mirror's silvered face is a material that only reflects an environment
 * map, and Room Studio's environment is a few studio light panels in the
 * dark — so a polished mirror read as a black disc. Real mirrors show the
 * room, so each mirror face is drawn here as a planar reflector
 * (three's `Reflector`): the room re-rendered from the camera mirrored in
 * the face's plane, clipped to that plane, projected back onto the face.
 *
 * What is and is not touched:
 *  - The GLB is not modified. The reflector is a second mesh built from the
 *    face's own triangles, so a round, arched or rectangular mirror reflects
 *    exactly inside its own outline. It sits 0.4 mm in front of the face,
 *    outside the instance that placement measures.
 *  - The file's own face stays underneath with a static room environment.
 *    That is the fallback — before the first pass, inside another mirror's
 *    reflection (no mirror-in-mirror recursion), and wherever live
 *    reflection is unavailable — so a mirror is never black.
 *
 * Cost control: Room Studio renders on demand, so reflections are redrawn
 * only in frames the scene redraws anyway. Per frame, at most two mirrors
 * (one on a low tier or a touch device) re-render, chosen by staleness and
 * on-screen size; the rest keep their last, self-consistent reflection and a
 * follow-up frame is requested. A mirror facing away or out of view costs
 * nothing. Texture size follows the mirror's share of the screen.
 */
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** The reflector sits this far in front of the file's face: no z-fighting, no visible gap. */
const FACE_OFFSET_M = 0.0004;

/** Silvered glass reflects roughly nine tenths of the light, colour-neutral. */
const SILVER_REFLECTANCE = 0.92;

/** What a reflection shows where there is no room — matches the canvas behind the scene. */
const PASS_BACKGROUND = new THREE.Color('#E9EEF1');

const MirrorShader = {
  name: 'LivLabMirrorShader',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
  },
  vertexShader: (Reflector as unknown as { ReflectorShader: { vertexShader: string } }).ReflectorShader.vertexShader,
  // The reflected room is rendered linear and HDR; it is scaled by the
  // silver's reflectance and then tone-mapped exactly like the room itself.
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    varying vec4 vUv;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      vec4 base = texture2DProj( tDiffuse, vUv );
      gl_FragColor = vec4( base.rgb * color, 1.0 );
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

interface MirrorEntry {
  gl: THREE.WebGLRenderer;
  reflector: Reflector;
  /** The face's outline corners in the reflector's own space, for culling and sizing. */
  corners: THREE.Vector3[];
  lastUpdate: number;
  allowed: boolean;
  dirty: boolean;
  /** Fraction of the screen the mirror covers, 0–1. */
  area: number;
  size: [number, number];
  disabled: boolean;
}

const entries = new Set<MirrorEntry>();
let passActive = false;
let frameNo = 0;
let selfInvalidated = false;

/** Read-only numbers for QA scripts: how many mirrors, how many passes, at what size. */
interface MirrorStats {
  mirrors: number;
  live: number;
  passes: number;
  lastFrame: number;
  sizes: [number, number][];
}
const stats: MirrorStats = { mirrors: 0, live: 0, passes: 0, lastFrame: 0, sizes: [] };
if (typeof window !== 'undefined') (window as unknown as { __livlabMirrorStats?: MirrorStats }).__livlabMirrorStats = stats;

/** `?mirrors=static` turns live reflection off, to check the fallback. */
function staticMode(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return new URLSearchParams(window.location.search).get('mirrors') === 'static';
  } catch {
    return false;
  }
}

/* ── Static fallback ───────────────────────────────────────────────────── */

const fallbackEnvironments = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

/**
 * A neutral, procedural room for the file's own mirror material to reflect —
 * three's RoomEnvironment, prefiltered once per renderer. Not a photograph.
 */
function fallbackEnvironment(gl: THREE.WebGLRenderer): THREE.Texture | null {
  const cached = fallbackEnvironments.get(gl);
  if (cached) return cached;
  try {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const texture = pmrem.fromScene(room, 0.03).texture;
    room.dispose();
    pmrem.dispose();
    fallbackEnvironments.set(gl, texture);
    return texture;
  } catch {
    return null;
  }
}

/* ── Building the reflector from the face ──────────────────────────────── */

/** The face must be flat and look along +Z in its mesh's space, or it is not reflected. */
function planarFrontFace(geometry: THREE.BufferGeometry): number | null {
  const position = geometry.getAttribute('position');
  if (!position || position.count < 3) return null;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < position.count; i++) {
    const z = position.getZ(i);
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  if (maxZ - minZ > 1e-5) return null;
  // Winding of the first non-degenerate triangle decides which way it faces.
  const index = geometry.getIndex();
  const at = (k: number) => (index ? index.getX(k) : k);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const triangles = (index ? index.count : position.count) / 3;
  for (let t = 0; t < triangles; t++) {
    a.fromBufferAttribute(position, at(t * 3));
    b.fromBufferAttribute(position, at(t * 3 + 1));
    c.fromBufferAttribute(position, at(t * 3 + 2));
    const n = new THREE.Triangle(a, b, c).getNormal(new THREE.Vector3());
    if (n.lengthSq() < 0.5) continue;
    return n.z > 0.99 ? (minZ + maxZ) / 2 : null;
  }
  return null;
}

export interface BuiltMirrors {
  reflectors: Reflector[];
  entries: MirrorEntry[];
  dispose: () => void;
}

const EMPTY: BuiltMirrors = { reflectors: [], entries: [], dispose: () => undefined };

/**
 * Finds the faces drawn in `materialName` inside one placed instance and
 * builds a reflector for each. The instance must not yet be in the scene: its
 * own transform is the reference the reflectors are positioned against, and
 * they are rendered beside it in the same transform.
 */
export function buildMirrors(instance: THREE.Object3D, materialName: string | undefined, gl: THREE.WebGLRenderer): BuiltMirrors {
  if (!materialName) return EMPTY;
  const faces: THREE.Mesh[] = [];
  instance.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.isMesh && !Array.isArray(mesh.material) && mesh.material.name === materialName) faces.push(mesh);
  });
  if (faces.length === 0) return EMPTY;

  const live = !staticMode();
  const environment = fallbackEnvironment(gl);
  const made: { reflector: Reflector; geometry: THREE.BufferGeometry; entry: MirrorEntry }[] = [];
  const fallbacks: THREE.Material[] = [];
  instance.updateWorldMatrix(true, true);
  const toInstance = instance.matrixWorld.clone().invert();

  for (const face of faces) {
    // The fallback: the file's own silver, now with a neutral room to reflect.
    const own = (face.material as THREE.MeshStandardMaterial).clone();
    if (environment) {
      own.envMap = environment;
      own.envMapIntensity = 1;
    }
    face.material = own;
    fallbacks.push(own);

    if (!live) continue;
    const z = planarFrontFace(face.geometry);
    if (z === null) {
      console.warn(`[Room Studio] ${materialName}: mirror face is not a flat +Z face; showing the static mirror.`);
      continue;
    }
    try {
      const geometry = face.geometry.clone();
      geometry.translate(0, 0, -z);
      geometry.computeBoundingBox();
      const reflector = new Reflector(geometry, {
        shader: MirrorShader,
        textureWidth: 512,
        textureHeight: 512,
        // Touch devices skip multisampling; the reflection is already smaller there.
        multisample: isCoarse() ? 0 : 4,
        clipBias: 0,
      });
      (reflector.material as THREE.ShaderMaterial).uniforms.color.value = new THREE.Color().setRGB(
        SILVER_REFLECTANCE,
        SILVER_REFLECTANCE,
        SILVER_REFLECTANCE,
        THREE.LinearSRGBColorSpace
      );
      reflector.name = 'livlab-mirror-reflection';
      reflector.castShadow = false;
      reflector.receiveShadow = false;
      // Same place as the face, nudged along the face's own normal.
      const local = toInstance.clone().multiply(face.matrixWorld).multiply(new THREE.Matrix4().makeTranslation(0, 0, z + FACE_OFFSET_M));
      local.decompose(reflector.position, reflector.quaternion, reflector.scale);

      const box = geometry.boundingBox!;
      const corners = [
        new THREE.Vector3(box.min.x, box.min.y, 0),
        new THREE.Vector3(box.max.x, box.min.y, 0),
        new THREE.Vector3(box.max.x, box.max.y, 0),
        new THREE.Vector3(box.min.x, box.max.y, 0),
      ];
      const entry: MirrorEntry = {
        gl,
        reflector,
        corners,
        lastUpdate: -1,
        allowed: false,
        dirty: true,
        area: 0,
        size: [512, 512],
        disabled: false,
      };
      wrapPass(entry);
      made.push({ reflector, geometry, entry });
    } catch (error) {
      console.warn('[Room Studio] live mirror reflection unavailable; showing the static mirror.', error);
    }
  }

  return {
    reflectors: made.map((m) => m.reflector),
    entries: made.map((m) => m.entry),
    dispose: () => {
      for (const m of made) {
        m.reflector.dispose();
        m.geometry.dispose();
      }
      fallbacks.forEach((m) => m.dispose());
    },
  };
}

/* ── One reflection pass ───────────────────────────────────────────────── */

/**
 * Walls the viewer's camera has faded (the cut-away) are drawn solid for the
 * reflection: the fade is a viewing aid, and the mirror shows the room.
 */
function solidifyCutawayWalls(scene: THREE.Object3D): () => void {
  const changed: { material: THREE.MeshStandardMaterial; transparent: boolean; opacity: number; depthWrite: boolean }[] = [];
  scene.traverse((node) => {
    if (!node.userData.livlabCutawayWall) return;
    node.traverse((child) => {
      const mesh = child as THREE.Mesh;
      const material = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (!mesh.isMesh || !material || Array.isArray(material) || !(material instanceof THREE.MeshStandardMaterial)) return;
      if (typeof material.userData.glassOpacity === 'number' || material.opacity >= 1) return;
      changed.push({ material, transparent: material.transparent, opacity: material.opacity, depthWrite: material.depthWrite });
      material.transparent = false;
      material.opacity = 1;
      material.depthWrite = true;
    });
  });
  return () => {
    for (const c of changed) {
      c.material.transparent = c.transparent;
      c.material.opacity = c.opacity;
      c.material.depthWrite = c.depthWrite;
    }
  };
}

function wrapPass(entry: MirrorEntry) {
  const render = entry.reflector.onBeforeRender;
  entry.reflector.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
    // Inside another mirror's pass this mirror is hidden anyway; never recurse.
    if (passActive || !entry.allowed || entry.disabled) return;
    entry.allowed = false;
    passActive = true;
    const hidden: Reflector[] = [];
    for (const other of entries) {
      if (other !== entry && other.reflector.visible) {
        other.reflector.visible = false;
        hidden.push(other.reflector);
      }
    }
    const restoreWalls = solidifyCutawayWalls(scene);
    const sceneRoot = scene as THREE.Scene;
    const background = sceneRoot.background;
    if (!background) sceneRoot.background = PASS_BACKGROUND;
    try {
      render.call(this, renderer, scene, camera, geometry, material, group);
      entry.lastUpdate = frameNo;
      entry.dirty = false;
      stats.passes++;
    } catch (error) {
      // Live reflection failed on this device: keep the static mirror.
      entry.disabled = true;
      entry.reflector.visible = false;
      console.warn('[Room Studio] mirror reflection pass failed; showing the static mirror.', error);
    } finally {
      sceneRoot.background = background;
      restoreWalls();
      hidden.forEach((r) => (r.visible = true));
      passActive = false;
    }
  };
}

/* ── Scheduling across all mirrors in the scene ────────────────────────── */

let coarsePointer: boolean | null = null;
const isCoarse = () => {
  if (coarsePointer === null) {
    try {
      coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    } catch {
      coarsePointer = false;
    }
  }
  return coarsePointer;
};

const frustum = new THREE.Frustum();
const projScreen = new THREE.Matrix4();
const worldBox = new THREE.Box3();
const corner = new THREE.Vector3();
const normal = new THREE.Vector3();
const toCamera = new THREE.Vector3();
const origin = new THREE.Vector3();
const buffer = new THREE.Vector2();
const rotation = new THREE.Matrix4();

function direct(state: { gl: THREE.WebGLRenderer; camera: THREE.Camera; invalidate: () => void }) {
  const { gl, camera } = state;
  frameNo++;
  stats.lastFrame = frameNo;
  const mine = [...entries].filter((e) => e.gl === gl && !e.disabled);
  stats.mirrors = mine.length;
  stats.live = mine.length;
  stats.sizes = mine.map((e) => e.size);

  // Every frame Room Studio draws is drawn because something changed — except
  // the follow-ups this scheduler asks for itself.
  if (selfInvalidated) selfInvalidated = false;
  else mine.forEach((e) => (e.dirty = true));

  const tier = gl.domElement.closest('[data-render-tier]')?.getAttribute('data-render-tier') === 'low' ? 'low' : 'high';
  const light = tier === 'low' || isCoarse();
  const budget = light ? 1 : 2;
  const maxLong = tier === 'low' ? 512 : isCoarse() ? 768 : 1024;

  camera.updateMatrixWorld();
  projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(projScreen);
  const candidates: MirrorEntry[] = [];
  for (const e of mine) {
    e.allowed = false;
    const r = e.reflector;
    r.updateWorldMatrix(true, false);
    let shown = true;
    for (let o: THREE.Object3D | null = r; o; o = o.parent) if (!o.visible) shown = false;
    if (!shown) continue;
    origin.setFromMatrixPosition(r.matrixWorld);
    rotation.extractRotation(r.matrixWorld);
    normal.set(0, 0, 1).applyMatrix4(rotation);
    toCamera.setFromMatrixPosition(camera.matrixWorld).sub(origin);
    if (toCamera.dot(normal) <= 0) continue; // seen from behind: nothing to reflect
    worldBox.makeEmpty();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of e.corners) {
      corner.copy(c).applyMatrix4(r.matrixWorld);
      worldBox.expandByPoint(corner);
      corner.applyMatrix4(projScreen);
      minX = Math.min(minX, corner.x); maxX = Math.max(maxX, corner.x);
      minY = Math.min(minY, corner.y); maxY = Math.max(maxY, corner.y);
    }
    if (!frustum.intersectsBox(worldBox)) continue;
    const w = Math.min(1, maxX) - Math.max(-1, minX);
    const h = Math.min(1, maxY) - Math.max(-1, minY);
    e.area = w > 0 && h > 0 ? (w * h) / 4 : 0;
    if (e.dirty) candidates.push(e);
  }

  candidates.sort((a, b) => a.lastUpdate - b.lastUpdate || b.area - a.area);
  const now = candidates.slice(0, budget);
  for (const e of now) {
    e.allowed = true;
    // The reflection covers the whole view; its resolution follows how much
    // of the screen this mirror actually occupies.
    gl.getDrawingBufferSize(buffer);
    const share = Math.min(1, Math.max(0.4, 0.4 + Math.sqrt(e.area) * 1.4));
    let width = buffer.x * share;
    let height = buffer.y * share;
    const long = Math.max(width, height);
    if (long > maxLong) {
      width *= maxLong / long;
      height *= maxLong / long;
    }
    width = Math.max(64, Math.round(width / 32) * 32);
    height = Math.max(64, Math.round(height / 32) * 32);
    const [cw, ch] = e.size;
    if (Math.abs(width - cw) / cw > 0.2 || Math.abs(height - ch) / ch > 0.2) {
      e.reflector.getRenderTarget().setSize(width, height);
      e.size = [width, height];
    }
  }
  if (candidates.length > now.length) {
    selfInvalidated = true;
    state.invalidate();
  }
}

/**
 * Live reflections for the mirror faces of one placed instance. Returns the
 * reflector meshes to render beside the instance, in the same transform.
 */
export function useMirrorReflections(instance: THREE.Object3D, materialName: string | undefined): Reflector[] {
  const gl = useThree((s) => s.gl);
  const built = useMemo(() => buildMirrors(instance, materialName, gl), [instance, materialName, gl]);

  useEffect(() => {
    built.entries.forEach((e) => entries.add(e));
    return () => {
      built.entries.forEach((e) => entries.delete(e));
      built.dispose();
    };
  }, [built]);

  useFrame((state) => {
    // One scheduler per renderer: the first registered mirror runs it.
    if (built.entries.length === 0) return;
    const leader = [...entries].find((e) => e.gl === state.gl);
    if (leader !== built.entries[0]) return;
    direct(state);
  });

  return built.reflectors;
}
