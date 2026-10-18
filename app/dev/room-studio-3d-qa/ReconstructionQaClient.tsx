'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import type { Product } from '@/lib/types';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import { toRoomStudioProduct, withReconstruction, type RoomStudioProduct } from '@/lib/room-studio/productAdapter';
import {
  allReconstructions,
  envelopeOf,
  variantFile,
  type ReconstructedModel,
} from '@/lib/room-studio/reconstructionRegistry';
import { performanceTargetFor, type PlacementType } from '@/lib/room-studio/product3dAsset';
import * as ops from '@/lib/room-studio/roomState';
import { installationHeight } from '@/lib/room-studio/mounting';
import { DEFAULT_ARCHITECTURE, LIGHTING_PRESETS } from '@/lib/room-studio/environment';
import type { measureGlbForPlacement } from '@/components/room-studio/scene/PlacedProductNode';

const RoomScene3D = dynamic(() => import('@/components/room-studio/RoomScene3D'), { ssr: false });

type Measurement = ReturnType<typeof measureGlbForPlacement>;

/** A room big enough to hold every model at once, products along the back wall. */
const ROOM = { length: 6.4, width: 3.2, height: 2.8 };
const MM = 1000;

interface Case {
  key: string;
  model: ReconstructedModel;
  variant: 'web' | 'basin_only';
  product: RoomStudioProduct;
  at: [number, number];
}

const PERF_PLACEMENT: Record<ReconstructedModel['category'], PlacementType> = {
  toilet: 'FLOOR_TOILET',
  bathtub: 'FREESTANDING_BATHTUB',
  shower: 'SHOWER_COLUMN',
  lavabo: 'COUNTERTOP_BASIN',
};

/** The same synthetic catalogue row `livlab3dLibraryProducts` builds — but ungated. */
function productFor(model: ReconstructedModel, variant: 'web' | 'basin_only'): RoomStudioProduct {
  const source: Product = {
    id: `qa-${model.id}-${variant}`,
    slug: model.id,
    name: model.name,
    category: model.catalogueCategory,
    brand: model.brand,
    sku: model.sku,
    priceMin: 0,
    priceMax: 0,
    priceRange: 'Liên hệ',
    dimensions: model.envelopeLabel,
    image: model.thumbnailUrl,
    description: '',
    availability: '',
    status: '' as Product['status'],
    showroomName: '',
    showroomLocation: '',
    sellerType: '',
  };
  // Through the ordinary adapter first, so category and placement are the
  // ones the customer workspace derives, then with the reconstruction applied
  // regardless of its recorded readiness — this page is what decides it.
  return withReconstruction(toRoomStudioProduct(source), model, variant);
}

interface FileAnalysis {
  meshes: number;
  triangles: number;
  materials: Array<{ name: string; type: string; metalness: number; roughness: number }>;
  /** Primitives the file ships without NORMAL; the renderer derives creased normals for them. */
  primitivesWithoutNormals: number;
  primitives: number;
  /** Highest point in the rear and front quarter of the depth, metres. */
  rearMaxY: number;
  frontMaxY: number;
  error?: string;
}

async function analyseFile(url: string): Promise<FileAnalysis> {
  const gltf = await new GLTFLoader().loadAsync(url);
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const depth = box.max.z - box.min.z;
  let meshes = 0;
  let triangles = 0;
  let withoutNormals = 0;
  let primitives = 0;
  let rearMaxY = -Infinity;
  let frontMaxY = -Infinity;
  const mats = new Map<string, FileAnalysis['materials'][number]>();
  const v = new THREE.Vector3();
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    meshes += 1;
    const geo = mesh.geometry;
    triangles += (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
    primitives += 1;
    if (!geo.attributes.normal) withoutNormals += 1;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      if (v.z < box.min.z + depth * 0.25) rearMaxY = Math.max(rearMaxY, v.y);
      if (v.z > box.max.z - depth * 0.25) frontMaxY = Math.max(frontMaxY, v.y);
    }
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of list) {
      const std = m as THREE.MeshStandardMaterial;
      mats.set(m.uuid, {
        name: m.name,
        type: m.type,
        metalness: std.metalness ?? NaN,
        roughness: std.roughness ?? NaN,
      });
    }
  });
  return {
    meshes,
    triangles: Math.round(triangles),
    materials: [...mats.values()],
    primitivesWithoutNormals: withoutNormals,
    primitives,
    rearMaxY,
    frontMaxY,
  };
}

const pct = (a: number, b: number) => (Math.abs(a - b) / b) * 100;

export default function ReconstructionQaClient() {
  const cases = useMemo<Case[]>(() => {
    const out: Case[] = [];
    const xs = [-2.6, -1.75, -0.4, 1.25, 2.05, 2.75];
    let i = 0;
    for (const model of allReconstructions()) {
      for (const variant of model.roomVariants) {
        out.push({ key: `${model.sku}:${variant}`, model, variant, product: productFor(model, variant), at: [xs[i++] ?? 0, -1] });
      }
    }
    return out;
  }, []);

  // Place every case with the real placement rules, as "+ THÊM" would.
  const { state, instanceOf } = useMemo(() => {
    let s = ops.setDimensions(ops.createInitialRoomState(), ROOM);
    s = ops.setSurfaceStyle(s, 'floor', { material: 'porcelain', color: 'light-grey', finish: 'matte' });
    s = ops.setSurfaceStyle(s, 'walls', { material: 'porcelain', color: 'white', finish: 'matte' });
    const map = new Map<string, string>();
    for (const c of cases) {
      const id = `qa_${c.key}`;
      // Default placement — the rule under test — then slid along the wall
      // only, so the wall gap and mounting heights are the rules' own.
      s = ops.addProduct(s, c.product, { instanceId: id });
      const placed = s.placedProducts.find((p) => p.instanceId === id);
      if (placed) {
        s = ops.updatePlacement(s, id, { position: [c.at[0], placed.position[1], placed.position[2]] });
      }
      map.set(c.key, id);
    }
    return { state: s, instanceOf: map };
  }, [cases]);

  const views = useMemo<PlacedProductView[]>(
    () =>
      state.placedProducts.map((placed) => ({
        placed,
        product: cases.find((c) => instanceOf.get(c.key) === placed.instanceId)!.product,
      })),
    [state, cases, instanceOf]
  );

  // First measurement per instance wins: the renderer reports again on every
  // re-render, and the first is the one taken as the model loaded.
  const [measured, setMeasured] = useState<Record<string, Measurement>>({});
  const measuredCount = Object.keys(measured).length;
  const onMeasured = useCallback((m: Measurement, instanceId: string) => {
    setMeasured((prev) => (prev[instanceId] ? prev : { ...prev, [instanceId]: m }));
  }, []);
  const [loadErrors, setLoadErrors] = useState(0);

  const [analysis, setAnalysis] = useState<Record<string, FileAnalysis>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Record<string, FileAnalysis> = {};
      for (const c of cases) {
        const url = variantFile(c.model, c.variant).url;
        try {
          out[c.key] = await analyseFile(url);
        } catch (e) {
          out[c.key] = {
            meshes: 0, triangles: 0, materials: [], primitivesWithoutNormals: 0, primitives: 0, rearMaxY: NaN, frontMaxY: NaN,
            error: String(e),
          };
        }
      }
      if (!cancelled) setAnalysis(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [cases]);


  const results = useMemo(() => {
    return cases.map((c) => {
      const file = variantFile(c.model, c.variant);
      const env = envelopeOf(file);
      const instanceId = instanceOf.get(c.key)!;
      const placed = state.placedProducts.find((p) => p.instanceId === instanceId)!;
      const m = measured[instanceId];
      const a = analysis[c.key];
      const ref = c.model.referenceDimensionsMm;

      const measuredMm = m
        ? { width: m.rawSize.x * MM, depth: m.rawSize.z * MM, height: m.rawSize.y * MM }
        : null;
      const fileMm = { width: env.width * MM, depth: env.depth * MM, height: env.height * MM };
      const boundsErr = measuredMm
        ? Math.max(pct(measuredMm.width, fileMm.width), pct(measuredMm.depth, fileMm.depth), pct(measuredMm.height, fileMm.height))
        : null;

      // Reference: the manufacturer's figures, mapped onto the model's axes.
      let refChecks: Array<{ axis: string; ref: number; got: number; errPct: number }> = [];
      if (measuredMm) {
        if (c.model.category === 'bathtub') {
          refChecks = [
            { axis: 'length (X)', ref: ref.length, got: measuredMm.width, errPct: pct(measuredMm.width, ref.length) },
            { axis: 'width (Z)', ref: ref.width, got: measuredMm.depth, errPct: pct(measuredMm.depth, ref.width) },
            { axis: 'height (Y)', ref: ref.height, got: measuredMm.height, errPct: pct(measuredMm.height, ref.height) },
          ];
        } else if (c.model.category === 'shower') {
          // No box on the spec sheet: the reach is. Depth = riser offset (a
          // modelling assumption, 72 mm) + reach 350 + half the 203 head.
          const expectedDepth = 72 + ref.riserToRainheadCentre + ref.rainheadDiameter / 2;
          refChecks = [{ axis: 'reach depth (Z)', ref: expectedDepth, got: measuredMm.depth, errPct: pct(measuredMm.depth, expectedDepth) }];
        } else if (c.variant === 'basin_only' || c.model.category === 'toilet') {
          refChecks = [
            { axis: 'width (X)', ref: ref.width, got: measuredMm.width, errPct: pct(measuredMm.width, ref.width) },
            { axis: 'depth (Z)', ref: ref.depth, got: measuredMm.depth, errPct: pct(measuredMm.depth, ref.depth) },
            { axis: 'height (Y)', ref: ref.height, got: measuredMm.height, errPct: pct(measuredMm.height, ref.height) },
          ];
        } else {
          // Basin with its illustrative faucet: the basin's plan is checked,
          // the height is the faucet's and has no reference.
          refChecks = [
            { axis: 'width (X)', ref: ref.width, got: measuredMm.width, errPct: pct(measuredMm.width, ref.width) },
            { axis: 'depth (Z)', ref: ref.depth, got: measuredMm.depth, errPct: pct(measuredMm.depth, ref.depth) },
          ];
        }
      }
      const worstRef = refChecks.length ? Math.max(...refChecks.map((r) => r.errPct)) : null;

      // Origin and orientation, from the file's own bounds and vertices.
      const b = file.boundsM;
      let orientation = false;
      let orientationNote = '';
      if (c.model.category === 'toilet') {
        orientation =
          Math.abs(b.min[1]) < 1e-4 && Math.abs(b.min[2]) < 1e-4 && Math.abs(b.min[0] + b.max[0]) < 1e-4 &&
          !!a && a.rearMaxY > a.frontMaxY + 0.1;
        orientationNote = a ? `két nước phía sau: cao ${Math.round(a.rearMaxY * MM)} mm (sau) / ${Math.round(a.frontMaxY * MM)} mm (trước) → mặt trước +Z` : '';
      } else if (c.model.category === 'bathtub') {
        orientation = Math.abs(b.min[1]) < 1e-4 && b.max[0] - b.min[0] > b.max[2] - b.min[2];
        orientationNote = 'đáy y=0, chiều dài theo X';
      } else if (c.model.category === 'shower') {
        orientation = Math.abs(b.min[2]) < 1e-4 && b.min[1] < 0 && b.max[1] > 0;
        orientationNote = 'mặt tường z=0, gốc tại tâm bộ trộn (y=0 nằm trong thân)';
      } else {
        orientation = Math.abs(b.min[1]) < 1e-4 && Math.abs(b.min[2]) < 1e-4 && (!a || a.rearMaxY >= a.frontMaxY - 1e-4);
        orientationNote = 'đáy chậu y=0, mặt sau z=0';
      }

      // Mounting, as the real placement rules put it in this room.
      const size = { w: env.width, h: env.height };
      const bottom = placed.position[1] - size.h / 2;
      const back = placed.position[2] - env.depth / 2 - -ROOM.width / 2;
      let mounting = false;
      let mountingNote = '';
      const mt = c.model.mounting;
      if (mt.kind === 'FLOOR') {
        mounting = Math.abs(bottom) < 1e-4 && Math.abs(back - mt.wallGapMm / MM) < 1e-4;
        mountingNote = `đáy ${Math.round(bottom * MM)} mm · cách tường ${Math.round(back * MM)} mm`;
      } else if (mt.kind === 'WALL_MIXER') {
        const mixer = installationHeight(c.product, placed) ?? NaN;
        mounting = Math.abs(mixer - mt.mixerHeightMm.default / MM) < 1e-4 && Math.abs(back) < 0.002;
        mountingNote = `bộ trộn ${Math.round(mixer * MM)} mm · sát tường ${Math.round(back * MM)} mm`;
      } else {
        mounting = Math.abs(bottom - mt.counterHeightMm.default / MM) < 1e-4;
        mountingNote = `đáy chậu ${Math.round(bottom * MM)} mm trên sàn (mặt bàn)`;
      }

      const target = performanceTargetFor(PERF_PLACEMENT[c.model.category]);
      const performance = !!target && file.bytes <= target.maxBytes && file.triangles <= target.triangles[1];
      const hasMetal = !!a && a.materials.some((mm) => mm.metalness >= 0.7);
      const allPbr = !!a && a.materials.length > 0 && a.materials.every((mm) => /MeshStandardMaterial|MeshPhysicalMaterial/.test(mm.type));
      // PBR factors from the file, and chrome present where the product has
      // chrome. Missing normals are a finding, not a failure: the renderer
      // derives creased normals for them (see PlacedProductNode).
      const materialsPbr = allPbr && hasMetal;

      const checks = {
        loads: !!m && !a?.error,
        boundsMatchFile: boundsErr !== null && boundsErr <= 0.05,
        dimensionsMatchReference: worstRef !== null && worstRef <= 0.5,
        originAndOrientation: orientation,
        mounting,
        materialsPbr,
        performance,
      };
      return {
        sku: c.model.sku,
        variant: c.variant,
        url: file.url,
        measuredMm: measuredMm && {
          width: +measuredMm.width.toFixed(2),
          depth: +measuredMm.depth.toFixed(2),
          height: +measuredMm.height.toFixed(2),
        },
        rendererScale: m ? +m.scale.toFixed(6) : null,
        boundsErrorPct: boundsErr,
        referenceChecks: refChecks.map((r) => ({ ...r, got: +r.got.toFixed(2), errPct: +r.errPct.toFixed(4) })),
        worstReferenceErrorPct: worstRef,
        orientationNote,
        mountingNote,
        placedPosition: placed.position.map((n) => +n.toFixed(4)),
        meshes: a?.meshes,
        triangles: a?.triangles,
        bytes: file.bytes,
        materials: a?.materials,
        metalMaterials: a?.materials.filter((mm) => mm.metalness >= 0.7).map((mm) => mm.name),
        primitivesWithoutNormals: a ? `${a.primitivesWithoutNormals}/${a.primitives}` : null,
        performanceTarget: target,
        checks,
        pass: Object.values(checks).every(Boolean),
      };
    });
  }, [cases, state, instanceOf, analysis, measured]);

  const done = measuredCount + loadErrors >= cases.length && Object.keys(analysis).length === cases.length;
  useEffect(() => {
    if (!done) return;
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    const gpu = gl && ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';
    (window as unknown as { __INAX_QA?: unknown }).__INAX_QA = {
      generatedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      gpu,
      room: ROOM,
      loadErrors,
      results,
    };
  }, [done, results, loadErrors]);

  return (
    <div className="flex h-[100svh] flex-col bg-[#0E1A26] text-white">
      <header className="shrink-0 px-5 py-3">
        <h1 className="text-[15px] font-semibold">QA mô hình 3D tái tạo — chạy trong renderer Room Studio</h1>
        <p className="text-[12px] text-[#8FA0AE]">
          {done ? 'Xong' : 'Đang đo…'} · {measuredCount}/{cases.length} mô hình đã đo · lỗi tải {loadErrors} · kết quả
          đầy đủ trong <code>window.__INAX_QA</code>
        </p>
      </header>
      <div className="relative min-h-0 flex-1">
        <RoomScene3D
          dimensions={state.dimensions}
          floorStyle={state.surfaceStyles.floor}
          wallStyle={state.surfaceStyles.walls}
          lighting={LIGHTING_PRESETS.studio}
          architecture={{ ...DEFAULT_ARCHITECTURE, cutaway: false }}
          placedViews={views}
          selectedInstanceId={null}
          showCeiling={false}
          onToggleCeiling={() => undefined}
          onSelect={() => undefined}
          onMove={() => undefined}
          onDropProduct={() => undefined}
          onModelMeasured={onMeasured}
          onModelLoadError={() => setLoadErrors((n) => n + 1)}
        />
      </div>
      <div className="max-h-[38vh] shrink-0 overflow-auto px-5 py-3 text-[12px]">
        <table className="w-full border-collapse">
          <thead className="text-left text-[#8FA0AE]">
            <tr>
              <th className="py-1 pr-3">SKU</th>
              <th className="pr-3">Đo (W×D×H mm)</th>
              <th className="pr-3">Sai số tham chiếu</th>
              <th className="pr-3">Hướng / gốc</th>
              <th className="pr-3">Lắp đặt</th>
              <th className="pr-3">Vật liệu kim loại</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={`${r.sku}:${r.variant}`} className="border-t border-white/10 align-top">
                <td className="py-1 pr-3 font-semibold">
                  {r.sku} <span className="font-normal text-[#8FA0AE]">{r.variant}</span>
                </td>
                <td className="pr-3 tabular-nums">
                  {r.measuredMm ? `${r.measuredMm.width} × ${r.measuredMm.depth} × ${r.measuredMm.height}` : '—'}
                </td>
                <td className="pr-3 tabular-nums">
                  {r.worstReferenceErrorPct === null ? '—' : `${r.worstReferenceErrorPct.toFixed(3)} %`}
                </td>
                <td className="pr-3">{r.orientationNote}</td>
                <td className="pr-3">{r.mountingNote}</td>
                <td className="pr-3">{r.metalMaterials?.join(', ') || '—'}</td>
                <td className={r.pass ? 'text-[#7FD3A8]' : 'text-[#F2A07A]'}>
                  {r.pass ? 'ĐẠT' : Object.entries(r.checks).filter(([, ok]) => !ok).map(([k]) => k).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
