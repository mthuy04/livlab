'use client';

import { useDeferredValue, useState } from 'react';
import RoomDimensionForm, { RoomDimensions, DIMENSION_LIMITS, TILE_COLOR_OPTIONS } from '@/components/room-studio/RoomDimensionForm';
import RoomScene3D from '@/components/room-studio/RoomScene3D';
import { availableProductModels, Product3DCategory } from '@/lib/livlabProductModels';

const CATEGORY_OPTIONS: { key: Product3DCategory; label: string }[] = [
  { key: 'lavabo', label: 'Lavabo' },
  { key: 'faucet', label: 'Vòi lavabo' },
  { key: 'toilet', label: 'Bồn cầu' },
  { key: 'shower', label: 'Sen tắm' },
  { key: 'mirror', label: 'Gương' },
];

const DEFAULT_VISIBLE_CATEGORIES = new Set<string>(
  CATEGORY_OPTIONS.filter(({ key }) => availableProductModels[key]).map(({ key }) => key)
);

export default function RoomStudioClient() {
  const [dimensions, setDimensions] = useState<RoomDimensions>({
    length: DIMENSION_LIMITS.length.default,
    width: DIMENSION_LIMITS.width.default,
    height: DIMENSION_LIMITS.height.default,
  });
  const [tileColorHex, setTileColorHex] = useState<string>(TILE_COLOR_OPTIONS[0].hex);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(DEFAULT_VISIBLE_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [placedPositions, setPlacedPositions] = useState<Record<string, [number, number, number] | null>>({});

  const toggleCategory = (key: string) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handlePlacePosition = (category: string, point: [number, number, number]) => {
    setPlacedPositions((prev) => ({ ...prev, [category]: point }));
  };

  // Defers Canvas re-renders behind fast typing/clicking in the form, without
  // hand-rolled debounce logic. Placement state is deliberately excluded —
  // click-to-place needs to feel immediate, not debounced.
  const sceneInput = useDeferredValue({ ...dimensions, tileColorHex, visibleCategories });
  const floorAreaM2 = dimensions.length * dimensions.width;
  const volumeM3 = dimensions.length * dimensions.width * dimensions.height;

  return (
    <div className="pt-16 bg-[#F3F7FA] min-h-screen">
      <div className="bg-[#0B1623] py-16 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-4">Room Studio</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight max-w-2xl">
            Dựng thử phòng tắm đúng kích thước thật của bạn.
          </h1>
          <p className="text-white/60 text-lg max-w-xl leading-relaxed">
            Nhập kích thước phòng, chọn màu gạch và xem trước sản phẩm trong không gian 3D trước khi gửi yêu cầu báo giá.
          </p>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <RoomDimensionForm
                dimensions={dimensions}
                onDimensionsChange={setDimensions}
                tileColorHex={tileColorHex}
                onTileColorChange={setTileColorHex}
              />

              <p className="text-xs text-[#627386] px-1">
                Diện tích sàn: <strong className="text-[#0B1623]">{floorAreaM2.toFixed(1)} m²</strong> · Thể tích: <strong className="text-[#0B1623]">{volumeM3.toFixed(1)} m³</strong>
              </p>

              <div className="bg-white rounded-3xl border border-[#D8E2EA] p-6">
                <h3 className="text-xs font-bold text-[#0B1623] uppercase tracking-wider mb-1">Hiện sản phẩm</h3>
                <p className="text-[11px] text-[#627386] mb-4">Bấm tên sản phẩm rồi bấm vào sàn để đặt lại vị trí.</p>
                <div className="space-y-2">
                  {CATEGORY_OPTIONS.map(({ key, label }) => {
                    const available = !!availableProductModels[key];
                    const checked = visibleCategories.has(key);
                    const isActive = activeCategory === key;
                    const canActivate = available && checked;
                    return (
                      <div key={key} className="flex items-center gap-2.5 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!available}
                          onChange={() => toggleCategory(key)}
                          className="w-4 h-4 shrink-0 rounded border-[#D8E2EA] accent-[#0F3D5C] disabled:opacity-50"
                        />
                        <button
                          type="button"
                          disabled={!canActivate}
                          onClick={() => setActiveCategory((prev) => (prev === key ? null : key))}
                          className={`flex-1 text-left px-2 py-1 rounded-lg border transition-colors ${
                            isActive
                              ? 'border-[#C8A96A] bg-[#FBF6EC] text-[#0B1623] font-semibold'
                              : canActivate
                              ? 'border-transparent text-[#0B1623] hover:border-[#D8E2EA]'
                              : 'border-transparent text-[#627386]/60 cursor-not-allowed'
                          }`}
                        >
                          {label}
                          {!available && <span className="text-xs italic ml-1">(sắp có)</span>}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {activeCategory && (
                  <p className="mt-3 text-[11px] text-[#C8A96A] font-medium">Đang chờ đặt — bấm vào sàn để chọn vị trí.</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <RoomScene3D
              length={sceneInput.length}
              width={sceneInput.width}
              height={sceneInput.height}
              tileColorHex={sceneInput.tileColorHex}
              visibleCategories={sceneInput.visibleCategories}
              activeCategory={activeCategory}
              placedPositions={placedPositions}
              onPlacePosition={handlePlacePosition}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
