'use client';

export interface RoomDimensions {
  length: number;
  width: number;
  height: number;
}

export interface TileColorOption {
  name: string;
  hex: string;
}

export const TILE_COLOR_OPTIONS: TileColorOption[] = [
  { name: 'Trắng tinh khôi', hex: '#F5F5F0' },
  { name: 'Xám bê tông', hex: '#A8A8A0' },
  { name: 'Be cát', hex: '#D9CBB4' },
  { name: 'Xanh sage', hex: '#A8B5A0' },
  { name: 'Xanh navy đậm', hex: '#2C3E50' },
  { name: 'Nâu đất nung', hex: '#8B5A3C' },
];

export const DIMENSION_LIMITS: Record<keyof RoomDimensions, { min: number; max: number; default: number }> = {
  length: { min: 2.0, max: 6.0, default: 3.0 },
  width: { min: 1.5, max: 4.0, default: 2.0 },
  height: { min: 2.2, max: 3.2, default: 2.7 },
};

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

const dimensionFields: { key: keyof RoomDimensions; label: string }[] = [
  { key: 'length', label: 'Chiều dài' },
  { key: 'width', label: 'Chiều rộng' },
  { key: 'height', label: 'Chiều cao' },
];

interface RoomDimensionFormProps {
  dimensions: RoomDimensions;
  onDimensionsChange: (dimensions: RoomDimensions) => void;
  tileColorHex: string;
  onTileColorChange: (hex: string) => void;
}

export default function RoomDimensionForm({ dimensions, onDimensionsChange, tileColorHex, onTileColorChange }: RoomDimensionFormProps) {
  const handleChange = (key: keyof RoomDimensions) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { min, max } = DIMENSION_LIMITS[key];
    const clamped = clamp(parseFloat(e.target.value), min, max);
    onDimensionsChange({ ...dimensions, [key]: clamped });
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D8E2EA] p-6 space-y-8">
      <div>
        <h3 className="text-xs font-bold text-[#0B1623] uppercase tracking-wider mb-4">Kích thước phòng tắm (mét)</h3>
        <div className="grid grid-cols-1 gap-4">
          {dimensionFields.map(({ key, label }) => {
            const { min, max } = DIMENSION_LIMITS[key];
            return (
              <label key={key} className="flex flex-col gap-1.5">
                <span className="text-xs text-[#627386]">{label} ({min}–{max}m)</span>
                <input
                  type="number"
                  step={0.1}
                  min={min}
                  max={max}
                  value={dimensions[key]}
                  onChange={handleChange(key)}
                  className="px-3 py-2.5 rounded-xl border border-[#D8E2EA] text-sm text-[#0B1623] focus:outline-none focus:border-[#0F3D5C] transition-colors"
                />
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-[#0B1623] uppercase tracking-wider mb-4">Màu gạch</h3>
        <div className="flex flex-wrap gap-3">
          {TILE_COLOR_OPTIONS.map((color) => (
            <button
              key={color.hex}
              type="button"
              onClick={() => onTileColorChange(color.hex)}
              title={color.name}
              aria-label={color.name}
              aria-pressed={tileColorHex === color.hex}
              className={`w-9 h-9 rounded-full border-2 transition-all ${
                tileColorHex === color.hex ? 'border-[#0F3D5C] scale-110 shadow-md' : 'border-[#D8E2EA] hover:scale-105'
              }`}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
