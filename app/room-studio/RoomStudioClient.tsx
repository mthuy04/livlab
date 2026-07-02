'use client';

import { useDeferredValue, useState } from 'react';
import RoomDimensionForm, { RoomDimensions, DIMENSION_LIMITS, TILE_COLOR_OPTIONS } from '@/components/room-studio/RoomDimensionForm';
import RoomScene3D from '@/components/room-studio/RoomScene3D';

export default function RoomStudioClient() {
  const [dimensions, setDimensions] = useState<RoomDimensions>({
    length: DIMENSION_LIMITS.length.default,
    width: DIMENSION_LIMITS.width.default,
    height: DIMENSION_LIMITS.height.default,
  });
  const [tileColorHex, setTileColorHex] = useState<string>(TILE_COLOR_OPTIONS[0].hex);

  // Defers Canvas re-renders behind fast typing/clicking in the form, without
  // hand-rolled debounce logic.
  const sceneInput = useDeferredValue({ ...dimensions, tileColorHex });

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
            <div className="sticky top-24">
              <RoomDimensionForm
                dimensions={dimensions}
                onDimensionsChange={setDimensions}
                tileColorHex={tileColorHex}
                onTileColorChange={setTileColorHex}
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <RoomScene3D
              length={sceneInput.length}
              width={sceneInput.width}
              height={sceneInput.height}
              tileColorHex={sceneInput.tileColorHex}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
