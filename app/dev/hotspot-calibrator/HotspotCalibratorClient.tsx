'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Concept } from '@/lib/types';
import { getStoredConcepts } from '@/lib/storage';
import { importVerifiedConceptsFromCsv } from '@/lib/importVerifiedConcepts';
import { useObjectCoverHotspots } from '@/lib/hooks/useObjectCoverHotspots';

interface CalibratedPoint {
  id: string;
  label: string;
  xPercent: number; // natural-image %, ready for the CSV hotspots column
  yPercent: number;
  displayLeft: number; // container % at click time — used only for the on-image overlay readout
  displayTop: number;
}

export default function HotspotCalibratorClient({ initialSlug }: { initialSlug?: string }) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState(initialSlug || '');
  const [points, setPoints] = useState<CalibratedPoint[]>([]);
  const [showCsvHotspots, setShowCsvHotspots] = useState(true);
  const [copied, setCopied] = useState(false);
  const { containerRef, imgRef, onImageLoad, toDisplayPercent, toNaturalPercent } = useObjectCoverHotspots<HTMLDivElement>();

  useEffect(() => {
    (async () => {
      let loaded = getStoredConcepts();
      if (!loaded || loaded.length === 0 || loaded.some((c) => c.image?.includes('placeholder'))) {
        loaded = await importVerifiedConceptsFromCsv(false);
      }
      setConcepts(loaded || []);
      setLoading(false);
    })();
  }, []);

  const bathroomConcepts = useMemo(
    () => concepts.filter((c) => c.roomType === 'Phòng tắm' || c.roomType === 'Bathroom'),
    [concepts]
  );

  const concept = useMemo(() => concepts.find((c) => c.slug === slug), [concepts, slug]);

  // Calibration points are scoped to whichever concept is currently selected.
  const handleSlugChange = (nextSlug: string) => {
    setSlug(nextSlug);
    setPoints([]);
  };

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const displayLeft = ((e.clientX - rect.left) / rect.width) * 100;
      const displayTop = ((e.clientY - rect.top) / rect.height) * 100;
      const { xPercent, yPercent } = toNaturalPercent(displayLeft, displayTop);
      setPoints((prev) => [
        ...prev,
        { id: `pt-${Date.now()}-${prev.length}`, label: '', xPercent, yPercent, displayLeft, displayTop },
      ]);
    },
    [containerRef, toNaturalPercent]
  );

  const updateLabel = (id: string, label: string) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, label } : p)));
  };

  const removePoint = (id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
  };

  const jsonOutput = useMemo(() => {
    return JSON.stringify(
      points.map((p, i) => ({
        id: `hs-${slug || 'new'}-${i + 1}`,
        productId: '',
        label: p.label || `Điểm ${i + 1}`,
        xPercent: Math.round(p.xPercent * 10) / 10,
        yPercent: Math.round(p.yPercent * 10) / 10,
      })),
      null,
      2
    );
  }, [points, slug]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
    } catch {
      // Clipboard permission can be blocked (browser/iframe policy) — the <pre> below
      // still holds the full JSON for manual select-copy as a fallback.
      setCopied(false);
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Đang tải concepts...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F7FA] pt-10 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-[#0B1623] mb-1">Hotspot Calibrator (dev-only)</h1>
        <p className="text-sm text-[#627386] mb-6">
          Click vào ảnh để lấy toạ độ. Route: <code>/dev/hotspot-calibrator?slug=...</code>
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <label className="text-xs font-semibold text-[#627386] uppercase tracking-wide">Concept:</label>
          <select
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className="text-sm border border-[#D8E2EA] rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">— chọn concept phòng tắm —</option>
            {bathroomConcepts.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title} ({c.slug})
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-[#0B1623] ml-4">
            <input
              type="checkbox"
              checked={showCsvHotspots}
              onChange={(e) => setShowCsvHotspots(e.target.checked)}
            />
            Hiện hotspot hiện tại từ CSV (đỏ)
          </label>
        </div>

        {!concept ? (
          <div className="text-sm text-[#627386]">Chọn một concept ở trên để bắt đầu.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <div
                ref={containerRef}
                onClick={handleContainerClick}
                className="relative rounded-[32px] overflow-hidden bg-[#EEF4F7] aspect-[4/3] shadow-lg border border-[#D8E2EA] cursor-crosshair"
              >
                <img
                  ref={imgRef}
                  src={concept.image}
                  alt={concept.title}
                  className="w-full h-full object-cover pointer-events-none"
                  onLoad={onImageLoad}
                />

                {showCsvHotspots &&
                  concept.hotspots.map((hotspot) => {
                    const { left, top } = toDisplayPercent(hotspot.xPercent, hotspot.yPercent);
                    return (
                      <div
                        key={hotspot.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
                        style={{ left: `${left}%`, top: `${top}%` }}
                      >
                        <span className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow" />
                        <span className="mt-1 text-[9px] font-bold text-white bg-red-500/90 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {hotspot.label} (CSV)
                        </span>
                      </div>
                    );
                  })}

                {points.map((p, i) => (
                  <div
                    key={p.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
                    style={{ left: `${p.displayLeft}%`, top: `${p.displayTop}%` }}
                  >
                    <span className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow flex items-center justify-center text-[9px] text-white font-bold">
                      {i + 1}
                    </span>
                    <span className="mt-1 text-[9px] font-bold text-white bg-blue-600/90 px-1.5 py-0.5 rounded whitespace-nowrap">
                      x: {p.displayLeft.toFixed(1)}%, y: {p.displayTop.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#627386] mt-2">
                Đỏ = hotspot đang có trong CSV. Xanh = điểm bạn vừa click. Toạ độ trên overlay là % theo khung ảnh
                đã render (đã crop bởi object-cover).
              </p>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white border border-[#D8E2EA] rounded-2xl p-4 mb-4">
                <h2 className="text-sm font-bold text-[#0B1623] mb-3">Điểm đã click ({points.length})</h2>
                {points.length === 0 ? (
                  <p className="text-xs text-[#627386]">Click vào ảnh bên trái để thêm điểm.</p>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto">
                    {points.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-2 text-xs">
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 font-bold">
                          {i + 1}
                        </span>
                        <input
                          value={p.label}
                          onChange={(e) => updateLabel(p.id, e.target.value)}
                          placeholder="Nhãn (vd: Vòi sen)"
                          className="flex-1 border border-[#D8E2EA] rounded px-2 py-1"
                        />
                        <span className="text-[10px] text-[#627386] whitespace-nowrap">
                          {p.xPercent.toFixed(1)}%, {p.yPercent.toFixed(1)}%
                        </span>
                        <button
                          onClick={() => removePoint(p.id)}
                          className="text-red-500 hover:text-red-700 font-bold px-1"
                          aria-label="Xoá điểm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#D8E2EA] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-[#0B1623]">JSON xuất (cột hotspots trong CSV)</h2>
                  <button
                    onClick={handleCopy}
                    disabled={points.length === 0}
                    className="text-xs font-semibold bg-[#123C5A] text-white px-3 py-1.5 rounded-lg disabled:opacity-40"
                  >
                    {copied ? 'Đã copy!' : 'Copy JSON'}
                  </button>
                </div>
                <p className="text-[10px] text-[#627386] mb-2">
                  xPercent/yPercent đã tự quy đổi ngược về % theo ẢNH GỐC (khớp schema CSV hiện tại), không phải %
                  theo khung hiển thị. Cần điền tay <code>productId</code> sau khi dán.
                </p>
                <pre className="text-[10px] bg-[#F3F7FA] rounded-lg p-3 overflow-x-auto max-h-[300px]">
                  {jsonOutput || '[]'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
