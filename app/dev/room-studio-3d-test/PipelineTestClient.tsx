'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import type { PlacedProduct } from '@/lib/room-studio/roomState';
import {
  clampToRoom,
  getDefaultPlacement,
  type Vec3,
} from '@/lib/room-studio/placementRules';
import { getRealWorldSize } from '@/lib/room-studio/assetResolver';
import { getRoomBounds, type RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { DEFAULT_SURFACE_STYLES } from '@/lib/room-studio/materials';
import {
  checkDimensions,
  DIMENSION_ERROR_MAX_PCT,
  DIMENSION_ERROR_PREFERRED_PCT,
} from '@/lib/room-studio/product3dAsset';
import {
  createDevTestProduct,
  DEV_TEST_FIXTURE_MM,
  DEV_TEST_FIXTURE_URL,
  DEV_TEST_MISSING_URL,
} from '@/lib/room-studio/devTestAsset';
import DevSceneHelpers from './DevSceneHelpers';

/**
 * The runtime GLB path, with nothing to sell.
 *
 * It renders the REAL `RoomScene3D` — same Canvas, same `PlacedProductNode`,
 * same `useGLTF` loader, same drag plane, same disposal effect — fed a
 * synthetic fixture instead of a product. A harness that rebuilt any of that
 * could pass while the thing it is standing in for is broken, which would make
 * it worse than no harness.
 *
 * Everything the panel reports is measured: the bounding box comes back from
 * the renderer via `onModelMeasured`, and the pass/fail uses `checkDimensions`,
 * the same function that will judge the first INAX conversion.
 */
const RoomScene3D = dynamic(() => import('@/components/room-studio/RoomScene3D'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#E9EEF1]">
      <p className="text-[13px] text-[#5B6B7A]">Đang dựng không gian…</p>
    </div>
  ),
});

/**
 * A small real bathroom. Deliberately tight: the fixture is 0.4 × 0.8 m, and in
 * a 3 × 2 m room it reads as a speck — fine for a customer looking at their own
 * space, useless for inspecting a bounding box. The placement maths is the same
 * either way.
 */
const ROOM: RoomDimensions = { length: 2, width: 1.6, height: 2.4 };
const INSTANCE_ID = 'dev-test-instance';
const QUARTER_TURN = Math.PI / 2;

type GlbMeasurement = {
  rawSize: THREE.Vector3;
  scale: number;
  renderedSize: THREE.Vector3;
  offset: THREE.Vector3;
};

export default function PipelineTestClient() {
  const [useMissingUrl, setUseMissingUrl] = useState(false);
  const [quarterTurns, setQuarterTurns] = useState(0);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(INSTANCE_ID);
  const [showCeiling, setShowCeiling] = useState(false);
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  const [showPivot, setShowPivot] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [measurement, setMeasurement] = useState<GlbMeasurement | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // `key` forces a fresh mount of the scene node when the URL changes, so the
  // missing-GLB test actually re-enters the loader instead of keeping the
  // already-resolved model.
  const product = useMemo(
    () => createDevTestProduct(useMissingUrl ? DEV_TEST_MISSING_URL : DEV_TEST_FIXTURE_URL),
    [useMissingUrl]
  );

  const size = useMemo(() => getRealWorldSize(product), [product]);

  /**
   * Placed by the production rule, not by a chosen coordinate. §16: if this
   * lands in the wall or facing it, that is the placement logic speaking and
   * the whole point of the test.
   */
  const defaultPlacement = useMemo(
    () => getDefaultPlacement({ dimensions: ROOM, size, placementType: 'floor' }, 'toilet', 0),
    [size]
  );

  const [position, setPosition] = useState<Vec3>(defaultPlacement.position);

  const placed: PlacedProduct = useMemo(
    () => ({
      instanceId: INSTANCE_ID,
      productId: product.id,
      position,
      rotationY: quarterTurns * QUARTER_TURN,
      placementType: 'floor',
      wall: 'back',
    }),
    [product.id, position, quarterTurns]
  );

  const placedViews: PlacedProductView[] = useMemo(
    () => [{ placed, product }],
    [placed, product]
  );

  const handleMove = useCallback(
    (_instanceId: string, next: Vec3) => {
      // The production clamp. No dev-only movement maths.
      setPosition(clampToRoom(next, { dimensions: ROOM, size, placementType: 'floor' }));
    },
    [size]
  );

  const handleMeasured = useCallback((next: GlbMeasurement) => {
    setMeasurement(next);
    setLoadFailed(false);
  }, []);

  const handleLoadError = useCallback(() => {
    setLoadFailed(true);
    setMeasurement(null);
  }, []);

  const resetPlacement = useCallback(() => {
    setPosition(defaultPlacement.position);
    setQuarterTurns(0);
  }, [defaultPlacement.position]);

  /* ------------------------------------------------------------ the verdict */

  const measuredMm = measurement
    ? {
        width: Math.round(measurement.renderedSize.x * 1000),
        depth: Math.round(measurement.renderedSize.z * 1000),
        height: Math.round(measurement.renderedSize.y * 1000),
      }
    : undefined;

  const dimensionResult = checkDimensions(DEV_TEST_FIXTURE_MM, measuredMm);

  const bounds = getRoomBounds(ROOM);
  /** Where the rear face sits, through the product's own rotation. */
  const rearFaceZ = position[2] - (quarterTurns % 2 === 0 ? size.depth : size.width) / 2;
  const floorGapMm = Math.round((position[1] - size.height / 2) * 1000);
  const wallGapMm = Math.round((rearFaceZ - bounds.minZ) * 1000);

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-[#0E1419] text-[#D6DEE5]">
      <header className="shrink-0 border-b border-white/10 px-5 py-3">
        <h1 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white">
          Room Studio · 3D pipeline test
        </h1>
        <p className="mt-1 text-[12px] leading-relaxed text-[#8FA0AE]">
          Hình học tổng hợp dùng để kiểm thử đường render GLB. Không phải sản phẩm, không gắn với
          SKU nào, không xuất hiện trong danh mục.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative h-[52vh] min-h-0 shrink-0 lg:h-auto lg:flex-1">
          <RoomScene3D
            dimensions={ROOM}
            floorStyle={DEFAULT_SURFACE_STYLES.floor}
            wallStyle={DEFAULT_SURFACE_STYLES.walls}
            placedViews={placedViews}
            selectedInstanceId={selectedInstanceId}
            showCeiling={showCeiling}
            onToggleCeiling={setShowCeiling}
            onSelect={setSelectedInstanceId}
            onMove={handleMove}
            onDropProduct={() => {}}
            onModelMeasured={handleMeasured}
            onModelLoadError={handleLoadError}
            devSceneOverlay={
              <DevSceneHelpers
                position={position}
                rotationY={quarterTurns * QUARTER_TURN}
                size={size}
                showBoundingBox={showBoundingBox}
                showPivot={showPivot}
                showAxes={showAxes}
              />
            }
          />
        </div>

        <aside className="min-h-0 w-full shrink-0 overflow-y-auto border-t border-white/10 px-5 py-4 lg:w-[380px] lg:border-l lg:border-t-0">
          <Section title="Kích thước">
            <Row label="Kỳ vọng" value={`${DEV_TEST_FIXTURE_MM.width} × ${DEV_TEST_FIXTURE_MM.depth} × ${DEV_TEST_FIXTURE_MM.height} mm`} />
            <Row
              label="Đo được (renderer)"
              value={
                measuredMm
                  ? `${measuredMm.width} × ${measuredMm.depth} × ${measuredMm.height} mm`
                  : loadFailed
                    ? '—'
                    : 'đang đo…'
              }
            />
            <Row
              label="Hệ số scale"
              value={measurement ? measurement.scale.toFixed(6) : '—'}
              hint="1.000000 nghĩa là file đã ở đơn vị mét, không phải scale lại"
            />

            {dimensionResult.checks.length > 0 && (
              <div className="mt-2 space-y-1">
                {dimensionResult.checks.map((check) => (
                  <div key={check.axis} className="flex items-baseline justify-between gap-3">
                    <span className="text-[12px] text-[#8FA0AE]">
                      {check.axis === 'width' ? 'Rộng (X)' : check.axis === 'depth' ? 'Sâu (Z)' : 'Cao (Y)'}
                    </span>
                    <span className="tabular-nums text-[12px] text-[#D6DEE5]">
                      {check.modelMm} / {check.officialMm} mm · sai {check.errorPct.toFixed(3)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Verdict
              worst={dimensionResult.worstErrorPct}
              failed={loadFailed}
              pending={!measurement && !loadFailed}
            />
          </Section>

          <Section title="Đặt trong phòng">
            <Row
              label="Đáy so với sàn"
              value={`${floorGapMm} mm`}
              hint="0 = đứng đúng trên sàn, âm = lún, dương = lơ lửng"
            />
            <Row
              label="Mặt sau so với tường trong"
              value={`${wallGapMm} mm`}
              hint="CLEARANCE của placementRules là 20 mm"
            />
            <Row label="Vị trí (tâm)" value={position.map((v) => v.toFixed(3)).join(' · ')} />
            <Row label="Xoay" value={`${quarterTurns * 90}°`} />
          </Section>

          <Section title="Xoay">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((turns) => (
                <button
                  key={turns}
                  type="button"
                  onClick={() => setQuarterTurns(turns)}
                  aria-pressed={quarterTurns === turns}
                  className={`flex-1 rounded border px-2 py-1.5 text-[12px] font-medium transition-colors ${
                    quarterTurns === turns
                      ? 'border-[#C8A96A] bg-[#C8A96A] text-[#0E1419]'
                      : 'border-white/15 text-[#8FA0AE] hover:border-white/40'
                  }`}
                >
                  {turns * 90}°
                </button>
              ))}
            </div>
          </Section>

          <Section title="Hiển thị QA">
            <Toggle label="Khung bao (bounding box)" value={showBoundingBox} onChange={setShowBoundingBox} />
            <Toggle label="Pivot · back-center-floor" value={showPivot} onChange={setShowPivot} />
            <Toggle label="Trục X / Y / Z" value={showAxes} onChange={setShowAxes} />
            <Toggle label="Trần phòng" value={showCeiling} onChange={setShowCeiling} />
          </Section>

          <Section title="Kiểm thử lỗi">
            <Toggle
              label="Trỏ tới file GLB không tồn tại"
              value={useMissingUrl}
              onChange={(v) => {
                setUseMissingUrl(v);
                setLoadFailed(false);
                setMeasurement(null);
              }}
            />
            <p className="mt-1 text-[12px] leading-relaxed text-[#6F8296]">
              Kỳ vọng: cảnh không sập, sản phẩm rơi về khối đúng kích thước, nhãn báo
              “Mô hình 3D hiện chưa khả dụng.”
            </p>
            {loadFailed && (
              <p className="mt-2 rounded border border-[#E8A33D]/40 bg-[#E8A33D]/10 px-2.5 py-1.5 text-[12px] text-[#E8A33D]">
                Mô hình 3D hiện chưa khả dụng. — cảnh vẫn chạy, đã rơi về khối kích thước.
              </p>
            )}
          </Section>

          <Section title="Chọn &amp; di chuyển">
            <Row label="Đang chọn" value={selectedInstanceId ?? 'không có'} />
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedInstanceId(null)}
                className="flex-1 rounded border border-white/15 px-2 py-1.5 text-[12px] text-[#8FA0AE] hover:border-white/40"
              >
                Bỏ chọn
              </button>
              <button
                type="button"
                onClick={resetPlacement}
                className="flex-1 rounded border border-white/15 px-2 py-1.5 text-[12px] text-[#8FA0AE] hover:border-white/40"
              >
                Đặt lại vị trí
              </button>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#6F8296]">
              Chạm vào khối để chọn, chạm nền trống để bỏ chọn, kéo để di chuyển — dùng đúng
              DragPlane của Room Studio.
            </p>
          </Section>

          <Section title="Nguồn">
            <Row label="GLB" value={useMissingUrl ? DEV_TEST_MISSING_URL : DEV_TEST_FIXTURE_URL} />
            <p className="mt-1 text-[12px] leading-relaxed text-[#6F8296]">
              Đường dẫn cố định trong mã nguồn. Không có tham số URL nào trỏ loader sang file khác.
            </p>
          </Section>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- bits */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 border-b border-white/10 pb-4 last:border-b-0">
      <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6F8296]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="mb-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="shrink-0 text-[12px] text-[#8FA0AE]">{label}</span>
        <span className="truncate text-right tabular-nums text-[13px] text-white">{value}</span>
      </div>
      {hint && <p className="text-[11px] leading-snug text-[#5A6B7C]">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1">
      <span className="text-[13px] text-[#B6C3CE]">{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#C8A96A]"
      />
    </label>
  );
}

/** Uses the production thresholds: ≤2% pass, ≤5% review, above that fail. */
function Verdict({
  worst,
  failed,
  pending,
}: {
  worst: number | null;
  failed: boolean;
  pending: boolean;
}) {
  if (failed) {
    return (
      <p className="mt-3 rounded bg-[#E8A33D]/15 px-2.5 py-1.5 text-[13px] font-semibold text-[#E8A33D]">
        KHÔNG TẢI ĐƯỢC MODEL
      </p>
    );
  }
  if (pending || worst === null) {
    return <p className="mt-3 text-[13px] text-[#6F8296]">Đang chờ số đo…</p>;
  }

  const tone =
    worst <= DIMENSION_ERROR_PREFERRED_PCT
      ? { text: 'ĐẠT', className: 'bg-[#2E7D52]/20 text-[#5FD39A]' }
      : worst <= DIMENSION_ERROR_MAX_PCT
        ? { text: 'CẦN XEM LẠI', className: 'bg-[#E8A33D]/15 text-[#E8A33D]' }
        : { text: 'KHÔNG ĐẠT', className: 'bg-[#C0392B]/20 text-[#F08A7E]' };

  return (
    <p className={`mt-3 rounded px-2.5 py-1.5 text-[13px] font-semibold ${tone.className}`}>
      {tone.text} · sai số lớn nhất {worst.toFixed(3)}% (ngưỡng {DIMENSION_ERROR_PREFERRED_PCT}% /{' '}
      {DIMENSION_ERROR_MAX_PCT}%)
    </p>
  );
}
