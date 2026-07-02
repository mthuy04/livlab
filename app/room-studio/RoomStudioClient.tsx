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

  const toggleCategory = (key: string) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Defers Canvas re-renders behind fast typing/clicking in the form, without
  // hand-rolled debounce logic.
  const sceneInput = useDeferredValue({ ...dimensions, tileColorHex, visibleCategories });

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

              <div className="bg-white rounded-3xl border border-[#D8E2EA] p-6">
                <h3 className="text-xs font-bold text-[#0B1623] uppercase tracking-wider mb-4">Hiện sản phẩm</h3>
                <div className="space-y-3">
                  {CATEGORY_OPTIONS.map(({ key, label }) => {
                    const available = !!availableProductModels[key];
                    const checked = visibleCategories.has(key);
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-2.5 text-sm ${available ? 'text-[#0B1623] cursor-pointer' : 'text-[#627386] cursor-not-allowed'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!available}
                          onChange={() => toggleCategory(key)}
                          className="w-4 h-4 rounded border-[#D8E2EA] accent-[#0F3D5C] disabled:opacity-50"
                        />
                        <span className={!available ? 'opacity-50' : ''}>{label}</span>
                        {!available && <span className="text-xs italic text-[#627386]/70">(sắp có)</span>}
                      </label>
                    );
                  })}
                </div>
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
