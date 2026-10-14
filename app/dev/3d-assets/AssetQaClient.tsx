'use client';

import { Suspense, useMemo, useState } from 'react';
import dynamicImport from 'next/dynamic';
import type { DimensionReview } from '@/lib/room-studio/dimensionReview';

export interface AssetRow {
  id: string;
  /** PRODUCT rows come from the registry; SYNTHETIC is the dev fixture. */
  kind: 'PRODUCT' | 'SYNTHETIC';
  brand: string;
  sku: string;
  status: string;
  relationType: string;
  sourceFormat: string;
  sourceFile: string | null;
  sourceUrl: string;
  placement: string;
  pivot: string;
  officialMm: { width: number | null; depth: number | null; height: number | null };
  glbUrl: string | null;
  measuredMm: { width: number; depth: number; height: number } | null;
  dimensionChecks: Array<{ axis: string; modelMm: number; officialMm: number; errorPct: number }> | null;
  worstErrorPct: number | null;
  metrics: {
    fileSizeBytes: number;
    triangleCount: number;
    meshCount: number;
    materialCount: number;
    textureCount: number;
    bboxMin: number[] | null;
  } | null;
  performanceTarget: { triangles: [number, number]; maxBytes: number } | null;
  qa: Record<string, boolean>;
  ready: boolean;
  note: string | null;
}

const AssetViewer = dynamicImport(() => import('./AssetViewer'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#1A1E22]">
      <p className="text-[13px] text-[#7F8C98]">Đang tải model…</p>
    </div>
  ),
});

const fmtBytes = (n: number) =>
  n >= 1_048_576 ? `${(n / 1_048_576).toFixed(2)} MB` : `${(n / 1024).toFixed(1)} KB`;

/**
 * One asset at a time, measured and displayed without flattery.
 *
 * The panel shows what the manufacturer says, what the file actually contains,
 * and the difference — then the seven QA flags, unticked, because none of them
 * is something this page can decide.
 */
export default function AssetQaClient({
  rows,
  qaChecks,
  dimensionReviews,
}: {
  rows: AssetRow[];
  qaChecks: string[];
  dimensionReviews: DimensionReview[];
}) {
  const loadable = useMemo(() => rows.filter((r) => r.glbUrl), [rows]);
  const [selectedId, setSelectedId] = useState<string | null>(loadable[0]?.id ?? rows[0]?.id ?? null);
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showPivot, setShowPivot] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-[#13171A] text-[#CBD5DD]">
      <header className="shrink-0 border-b border-white/10 px-5 py-3">
        <h1 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white">
          3D asset QA
        </h1>
        <p className="mt-1 text-[12px] text-[#7F8C98]">
          Bàn kiểm model đã convert. Nền trung tính, không phòng tắm — một model chỉ đẹp khi
          có gạch men là model đang được căn phòng che lỗi.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* ------------------------------------------------------- the list */}
        <aside className="min-h-0 w-full shrink-0 overflow-y-auto border-b border-white/10 lg:w-[270px] lg:border-b-0 lg:border-r">
          {rows.map((row) => {
            const active = row.id === selectedId;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                className={`block w-full border-b border-white/5 px-4 py-3 text-left transition-colors ${
                  active ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-medium text-white">
                    {row.kind === 'SYNTHETIC' ? 'TEST FIXTURE' : `${row.brand} ${row.sku}`}
                  </span>
                  {row.ready && (
                    <span className="rounded bg-[#2E7D52] px-1.5 text-[11px] font-semibold text-white">
                      READY
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[12px] text-[#7F8C98]">
                  {row.status}
                  {row.glbUrl ? ' · có GLB' : ' · chưa có GLB'}
                </div>
              </button>
            );
          })}

          {dimensionReviews.length > 0 && (
            <div className="border-t border-white/10 px-4 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C79A4B]">
                Kích thước cần xác minh
              </p>
              {dimensionReviews.map((review) => (
                <p key={review.sku} className="mt-1.5 text-[12px] leading-relaxed text-[#7F8C98]">
                  <span className="text-[#CBD5DD]">
                    {review.brand} {review.sku}
                  </span>{' '}
                  — {review.catalogueValue}. Không được READY khi chưa giải quyết.
                </p>
              ))}
            </div>
          )}
        </aside>

        {/* ----------------------------------------------------- the viewer */}
        <div className="relative min-h-[46svh] flex-1 lg:min-h-0">
          {selected?.glbUrl ? (
            <Suspense fallback={null}>
              <AssetViewer
                key={selected.glbUrl}
                url={selected.glbUrl}
                pivot={selected.pivot}
                showBoundingBox={showBoundingBox}
                showAxes={showAxes}
                showPivot={showPivot}
                wireframe={wireframe}
                resetSignal={resetSignal}
              />
            </Suspense>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1A1E22] px-8 text-center">
              <div>
                <p className="text-[14px] text-[#CBD5DD]">Chưa có file GLB cho asset này.</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#7F8C98]">
                  Nguồn của hãng là <code className="text-[#CBD5DD]">{selected?.sourceFormat}</code>, cần
                  3ds Max export sang FBX trước. Trạng thái: WAITING_FOR_REAL_FBX.
                </p>
              </div>
            </div>
          )}

          {selected?.glbUrl && (
            <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
              <ViewerToggle label="Khung bao" value={showBoundingBox} onChange={setShowBoundingBox} />
              <ViewerToggle label="Trục" value={showAxes} onChange={setShowAxes} />
              <ViewerToggle label="Pivot" value={showPivot} onChange={setShowPivot} />
              <ViewerToggle label="Wireframe" value={wireframe} onChange={setWireframe} />
              <button
                type="button"
                onClick={() => setResetSignal((n) => n + 1)}
                className="rounded border border-white/20 bg-black/40 px-2.5 py-1 text-[12px] text-[#CBD5DD] backdrop-blur transition-colors hover:border-white/50"
              >
                Góc chuẩn
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------ the sheet */}
        <aside className="min-h-0 w-full shrink-0 overflow-y-auto border-t border-white/10 px-5 py-4 lg:w-[380px] lg:border-l lg:border-t-0">
          {selected ? <Sheet row={selected} qaChecks={qaChecks} /> : <p>Chọn một asset.</p>}
        </aside>
      </div>
    </div>
  );
}

function Sheet({ row, qaChecks }: { row: AssetRow; qaChecks: string[] }) {
  const verdict =
    row.worstErrorPct === null
      ? null
      : row.worstErrorPct <= 2
        ? { text: 'PASS', cls: 'bg-[#2E7D52]/20 text-[#5FD39A]' }
        : row.worstErrorPct <= 5
          ? { text: 'REVIEW', cls: 'bg-[#C79A4B]/15 text-[#E8A33D]' }
          : { text: 'FAIL', cls: 'bg-[#C0392B]/20 text-[#F08A7E]' };

  return (
    <>
      {row.kind === 'SYNTHETIC' && (
        <p className="mb-4 rounded border border-[#C79A4B]/40 bg-[#C79A4B]/10 px-3 py-2 text-[12px] leading-relaxed text-[#E8A33D]">
          {row.note}
        </p>
      )}

      <Section title="Danh tính">
        <Row label="Mã" value={row.kind === 'SYNTHETIC' ? 'không có — đây không phải sản phẩm' : `${row.brand} ${row.sku}`} />
        <Row label="Quan hệ nguồn" value={row.relationType} />
        <Row label="Định dạng gốc" value={row.sourceFormat} />
        {row.sourceFile && <Row label="File hãng" value={row.sourceFile} />}
        <Row label="Trạng thái" value={row.status} />
        <Row label="Đặt" value={`${row.placement} · ${row.pivot}`} />
      </Section>

      <Section title="Kích thước">
        <Row
          label="Hãng công bố"
          value={
            row.officialMm.width
              ? `${row.officialMm.width} × ${row.officialMm.depth} × ${row.officialMm.height} mm`
              : '— chưa có'
          }
        />
        <Row
          label="Đo từ file"
          value={
            row.measuredMm
              ? `${row.measuredMm.width} × ${row.measuredMm.depth} × ${row.measuredMm.height} mm`
              : '— chưa có GLB'
          }
        />
        {row.dimensionChecks?.map((check) => (
          <Row
            key={check.axis}
            label={check.axis}
            value={`${check.modelMm} / ${check.officialMm} mm · sai ${check.errorPct.toFixed(3)}%`}
          />
        ))}
        {verdict && (
          <p className={`mt-2 rounded px-2.5 py-1.5 text-[13px] font-semibold ${verdict.cls}`}>
            {verdict.text} · sai số lớn nhất {row.worstErrorPct!.toFixed(3)}% (ngưỡng 2% / 5%)
          </p>
        )}
        {row.metrics?.bboxMin && (
          <Row
            label="Gốc toạ độ"
            value={
              Math.abs(row.metrics.bboxMin[1]) < 1e-3 && Math.abs(row.metrics.bboxMin[2]) < 1e-3
                ? 'back-center-floor ✓'
                : `minY=${row.metrics.bboxMin[1]} minZ=${row.metrics.bboxMin[2]} — không ở back-center-floor`
            }
          />
        )}
      </Section>

      {row.metrics && (
        <Section title="Chỉ số file">
          <Row label="Dung lượng" value={fmtBytes(row.metrics.fileSizeBytes)} />
          <Row label="Tam giác" value={String(row.metrics.triangleCount)} />
          <Row label="Mesh" value={String(row.metrics.meshCount)} />
          <Row label="Vật liệu" value={String(row.metrics.materialCount)} />
          <Row label="Texture" value={String(row.metrics.textureCount)} />
          {row.performanceTarget && (
            <Row
              label="Ngưỡng"
              value={`${row.performanceTarget.triangles[0]}–${row.performanceTarget.triangles[1]} tris · ${fmtBytes(row.performanceTarget.maxBytes)}`}
            />
          )}
        </Section>
      )}

      <Section title={`Cờ QA — READY cần đủ ${qaChecks.length}`}>
        {qaChecks.map((flag) => (
          <p key={flag} className="py-0.5 text-[13px] text-[#CBD5DD]">
            <span className="mr-2 text-[#7F8C98]">[{row.qa[flag] ? 'x' : ' '}]</span>
            {flag}
          </p>
        ))}
        <p
          className={`mt-2 rounded px-2.5 py-1.5 text-[13px] font-semibold ${
            row.ready ? 'bg-[#2E7D52]/20 text-[#5FD39A]' : 'bg-white/5 text-[#7F8C98]'
          }`}
        >
          isRoomStudioReady: {String(row.ready)}
        </p>
      </Section>

      {row.kind === 'PRODUCT' && (
        <Section title="Người phải tự xác nhận">
          {[
            'đúng sản phẩm này, không phải model cùng họ',
            'hình dáng khớp catalogue của hãng',
            'mặt trước ra phòng, mặt sau áp tường',
            'đứng trên sàn, không lơ lửng, không lún',
            'sứ trắng không vàng, mạ vẫn ra kim loại',
            'đủ thân, nắp, két, nút xả',
            'không có mảnh rác hình học, không mặt lật',
          ].map((line) => (
            <p key={line} className="py-0.5 text-[13px] leading-relaxed text-[#9FAEBA]">
              <span className="mr-2 text-[#7F8C98]">[ ]</span>
              {line}
            </p>
          ))}
        </Section>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 border-b border-white/10 pb-4 last:border-b-0">
      <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6C7B88]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="shrink-0 text-[12px] text-[#7F8C98]">{label}</span>
      <span className="truncate text-right text-[13px] text-white">{value}</span>
    </div>
  );
}

function ViewerToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={`rounded border px-2.5 py-1 text-[12px] backdrop-blur transition-colors ${
        value
          ? 'border-[#C8A96A] bg-[#C8A96A] text-[#13171A]'
          : 'border-white/20 bg-black/40 text-[#CBD5DD] hover:border-white/50'
      }`}
    >
      {label}
    </button>
  );
}
