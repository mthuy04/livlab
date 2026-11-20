'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three-stdlib';
import * as THREE from 'three';
import { DEFAULT_CAMERA_FOV, getDefaultCameraFraming } from '@/lib/room-studio/roomGeometry';
import {
  focusShot,
  glideShot,
  overviewShot,
  planZoom,
  type CameraRequest,
  type Shot,
} from '@/lib/room-studio/cameraDirector';
import { VISITOR, hit, walkDelta, walkMove, walkSpawn, type WalkWorld } from '@/lib/room-studio/walkthrough';
import type { WalkInput } from '@/lib/room-studio/walkInput';

type Mode = CameraRequest['mode'];
type Snapshot = { shot: Shot; request: CameraRequest | null; zoom: number };
type Flight =
  | { kind: 'glide'; from: Shot; to: Shot; start: number }
  | { kind: 'cut'; swap: (() => void) | null; start: number };
interface Rig {
  perspective: THREE.PerspectiveCamera;
  ortho: THREE.OrthographicCamera;
  controls: OrbitControls | null;
  saved: Snapshot | null;
  flight: Flight | null;
  mode: Mode;
  request: CameraRequest | null;
  yaw: number;
  pitch: number;
  activate: (mode: Mode) => void;
}
function pose(r: Rig): Shot {
  const cam = r.mode === 'plan' ? r.ortho : r.perspective;
  return {
    eye: cam.position.clone(),
    target: r.controls?.target.clone() ?? cam.getWorldDirection(new THREE.Vector3()).add(cam.position),
  };
}
function apply(r: Rig, s: Shot) {
  const cam = r.mode === 'plan' ? r.ortho : r.perspective;
  cam.position.copy(s.eye);
  cam.lookAt(s.target);
  cam.updateMatrixWorld();
  r.controls?.target.copy(s.target);
}

export default function RoomCameraControls({
  request,
  world,
  spawn,
  input,
  curtain,
  enabled,
  obstruction,
  onProjection,
}: {
  request: CameraRequest;
  world: WalkWorld;
  spawn: ReturnType<typeof walkSpawn>;
  input: WalkInput;
  obstruction: RefObject<HTMLParagraphElement | null>;
  curtain: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  onProjection: (projection: 'orbit' | 'plan' | 'inside') => void;
}) {
  const get = useThree((s) => s.get),
    size = useThree((s) => s.size);
  const rig = useRef<Rig | null>(null);
  useLayoutEffect(() => {
    const state = get(),
      perspective = state.camera as THREE.PerspectiveCamera;
    const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 80);
    // R3F resizes the main perspective camera. The plan frustum is in CSS pixels.
    Object.assign(ortho, { manual: true });
    const r: Rig = {
      perspective,
      ortho,
      controls: null,
      saved: null,
      mode: 'overview',
      request: null,
      flight: null,
      yaw: 0,
      pitch: 0,
      activate,
    };
    function interrupt() {
      if (r.flight?.kind === 'cut') r.flight.swap?.();
      r.flight = null;
      if (curtain.current) curtain.current.style.setProperty('opacity', '0');
    }
    function activate(mode: Mode) {
      r.controls?.dispose();
      r.controls = null;
      r.mode = mode;
      const plan = mode === 'plan',
        cam = plan ? ortho : perspective;
      perspective.fov = mode === 'walkthrough' ? 67 : DEFAULT_CAMERA_FOV;
      perspective.updateProjectionMatrix();
      if (mode !== 'walkthrough') {
        const c = new OrbitControls(cam, state.events.connected || state.gl.domElement);
        c.enableDamping = true;
        c.dampingFactor = 0.12;
        c.rotateSpeed = 0.7;
        c.zoomSpeed = 0.8;
        c.panSpeed = 0.8;
        c.screenSpacePanning = true;
        c.enableRotate = !plan;
        if (plan) {
          c.mouseButtons.LEFT = THREE.MOUSE.PAN;
          c.touches.ONE = THREE.TOUCH.PAN;
        }
        c.minPolarAngle = plan ? 0.0001 : 0.06;
        c.maxPolarAngle = plan ? 0.0001 : Math.PI / 2 - 0.12;
        c.minDistance = 0.25;
        c.maxDistance = 80;
        c.addEventListener('change', () => state.invalidate());
        r.controls = c;
      }
      state.set({ camera: cam, controls: r.controls });
      onProjection(plan ? 'plan' : mode === 'walkthrough' ? 'inside' : 'orbit');
    }
    const canvas = state.gl.domElement;
    canvas.addEventListener('pointerdown', interrupt, true);
    canvas.addEventListener('wheel', interrupt, true);
    rig.current = r;
    input.connect(() => {
      if (r.mode === 'walkthrough' || r.request?.mode === 'walkthrough') interrupt();
      state.invalidate();
    });
    return () => {
      r.controls?.dispose();
      canvas.removeEventListener('pointerdown', interrupt, true);
      canvas.removeEventListener('wheel', interrupt, true);
      state.set({ camera: perspective, controls: null });
      input.connect(null);
      rig.current = null;
    };
  }, [get, input, curtain, onProjection]);

  const zoomBase = useRef(1);
  useLayoutEffect(() => {
    const r = rig.current;
    if (!r) return;
    const z = planZoom(world.room, size.width, size.height),
      cam = r.ortho;
    cam.left = -size.width / 2;
    cam.right = size.width / 2;
    cam.top = size.height / 2;
    cam.bottom = -size.height / 2;
    cam.zoom *= z / zoomBase.current;
    zoomBase.current = z;
    cam.updateProjectionMatrix();
    if (r.mode === 'plan' && r.controls) {
      r.controls.minZoom = z * 0.45;
      r.controls.maxZoom = z * 8;
    }
    get().invalidate();
  }, [size.width, size.height, world.room, get]);

  useLayoutEffect(() => {
    const r = rig.current;
    if (!r || r.request === request) return;
    const previousRequest = r.request;
    const initial = !previousRequest;
    if (request.mode === 'walkthrough' && r.flight?.kind === 'cut') r.flight.swap?.();
    const active = r.mode;
    const from = pose(r);
    r.flight = null;
    r.request = request;
    if (curtain.current) curtain.current.style.setProperty('opacity', '0');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = get(),
      aspect = state.size.width / state.size.height;
    const saved = r.saved;
    if (request.mode === 'walkthrough' && !saved)
      r.saved = { shot: from, request: previousRequest, zoom: r.ortho.zoom / zoomBase.current };
    const entering = request.mode === 'walkthrough',
      restoring = !!saved && !entering && saved.request === request;
    if (!entering && !restoring) r.saved = null;
    const goal = restoring
      ? saved.shot
      : request.bounds
      ? focusShot(request.bounds, world, aspect, from.eye.clone().sub(from.target))
      : overviewShot(world.room, aspect);
    function swap() {
      if (!r) return;
      r.activate(request.mode);
      if (entering && spawn) {
        r.yaw = spawn.yaw;
        r.pitch = 0;
        r.perspective.rotation.order = 'YXZ';
        r.perspective.position.set(spawn.x, VISITOR.eye, spawn.z);
        r.perspective.rotation.set(0, spawn.yaw, 0, 'YXZ');
      } else if (request.mode === 'plan') {
        const z = zoomBase.current;
        r.ortho.zoom = restoring ? saved!.zoom * z : z;
        r.ortho.updateProjectionMatrix();
        if (r.controls) {
          r.controls.minZoom = z * 0.45;
          r.controls.maxZoom = z * 8;
        }
        apply(
          r,
          restoring
            ? goal
            : { eye: new THREE.Vector3(0, world.room.height + 6, 0.0008), target: new THREE.Vector3() }
        );
      } else {
        r.perspective.rotation.order = 'XYZ';
        apply(r, goal);
        if (r.controls)
          r.controls.maxDistance = Math.max(
            goal.eye.distanceTo(goal.target) * 2,
            getDefaultCameraFraming(world.room, aspect).maxDistance
          );
      }
      if (restoring) r.saved = null;
    }
    let cut = entering || restoring || request.mode === 'plan' || active === 'plan';
    // Don't run a visible flight through a wall or the body of another fixture.
    if (!cut && !initial)
      for (let i = 1; i <= 12; i++) {
        const { eye } = glideShot(from, goal, i / 12);
        if (hit(world, eye, 0.09, eye.y - 0.08, eye.y + 0.08)) {
          cut = true;
          break;
        }
      }
    if (initial || reduced) swap();
    else if (cut) {
      r.flight = { kind: 'cut', swap, start: performance.now() };
    } else {
      r.activate(request.mode);
      apply(r, from);
      r.flight = { kind: 'glide', from, to: goal, start: performance.now() };
    }
    state.invalidate();
  }, [request, world, spawn, get, input, curtain]);

  useLayoutEffect(() => {
    if (rig.current?.controls) rig.current.controls.enabled = enabled;
  }, [enabled]);

  useFrame((state, dt) => {
    const r = rig.current;
    if (!r) return;
    const f = r.flight,
      now = performance.now();
    if (f) {
      const t = Math.min(1, (now - f.start) / (f.kind === 'cut' ? 260 : 420));
      if (f.kind === 'glide') apply(r, glideShot(f.from, f.to, t));
      else {
        if (t >= 0.5 && f.swap) {
          const swap = f.swap;
          f.swap = null;
          swap();
        }
        if (curtain.current) curtain.current.style.setProperty('opacity', String(1 - Math.abs(2 * t - 1)));
      }
      if (t === 1) r.flight = null;
      state.invalidate();
      return;
    }
    if (r.mode !== 'walkthrough') {
      if (r.controls?.enabled) r.controls.update();
      return;
    }
    const { dx, dy, side, forward, elapsed } = input.read(dt, now);
    r.yaw -= dx * 0.004;
    r.pitch = THREE.MathUtils.clamp(r.pitch - dy * 0.004, -1.18, 1.18);
    r.perspective.rotation.set(r.pitch, r.yaw, 0, 'YXZ');
    if (side || forward) {
      const delta = walkDelta(r.yaw, side, forward, VISITOR.speed * elapsed);
      const p = walkMove(world, r.perspective.position, delta.x, delta.z);
      const note = obstruction.current;
      if (note?.hidden === p.blocked) note.toggleAttribute('hidden', !p.blocked);
      r.perspective.position.set(p.x, VISITOR.eye, p.z);
      state.invalidate();
    }
  }, -1);
  return null;
}
