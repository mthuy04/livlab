'use client';

import { BudgetRange, RoomType, StyleType } from '@/lib/types';
import { Search, X } from 'lucide-react';

interface ConceptFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  roomType: RoomType | 'All';
  onRoomTypeChange: (v: RoomType | 'All') => void;
  style: StyleType | 'All';
  onStyleChange: (v: StyleType | 'All') => void;
  budget: BudgetRange | 'All';
  onBudgetChange: (v: BudgetRange | 'All') => void;
  total: number;
  filtered: number;
}

const roomTypes: Array<{ value: RoomType | 'All'; label: string }> = [
  { value: 'All',          label: 'Tất cả' },
  { value: 'Phòng tắm',    label: 'Phòng tắm' },
  { value: 'Bếp',          label: 'Bếp' },
  { value: 'Phòng khách',  label: 'Phòng khách' },
  { value: 'Studio',       label: 'Studio' },
  { value: 'Homestay',     label: 'Homestay' },
  { value: 'Góc chức năng',label: 'Góc chức năng' },
];

const styles: Array<{ value: StyleType | 'All'; label: string }> = [
  { value: 'All',          label: 'Tất cả' },
  { value: 'Minimal',      label: 'Minimal' },
  { value: 'Japandi',      label: 'Japandi' },
  { value: 'Modern',       label: 'Modern' },
  { value: 'Hotel',        label: 'Hotel' },
  { value: 'Warm Neutral', label: 'Warm Neutral' },
  { value: 'Luxury',       label: 'Luxury' },
  { value: 'Budget',       label: 'Budget' },
  { value: 'Boutique',     label: 'Boutique' },
  { value: 'Compact',      label: 'Compact' },
];

const budgets: Array<{ value: BudgetRange | 'All'; label: string }> = [
  { value: 'All',           label: 'Tất cả' },
  { value: 'Dưới 30 triệu', label: 'Dưới 30 triệu' },
  { value: '30–60 triệu',   label: '30–60 triệu' },
  { value: 'Trên 60 triệu', label: 'Trên 60 triệu' },
];

function FilterBtn<T extends string>({ value, active, onClick, label }: { value: T; active: boolean; onClick: (v: T) => void; label: string }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-[#123C5A] text-white'
          : 'bg-white text-[#627386] border border-[#D8E2EA] hover:border-[#123C5A] hover:text-[#0B1623]'
      }`}
    >
      {label}
    </button>
  );
}

export default function ConceptFilters({
  search, onSearchChange, roomType, onRoomTypeChange, style, onStyleChange,
  budget, onBudgetChange, total, filtered,
}: ConceptFiltersProps) {
  const hasFilters = search || roomType !== 'All' || style !== 'All' || budget !== 'All';

  return (
    <div className="bg-white border border-[#D8E2EA] rounded-2xl p-5 space-y-5 shadow-sm">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#627386]" />
        <input
          type="text"
          placeholder="Tìm concept theo phong cách, phòng hoặc ngân sách…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#F3F7FA] border border-[#D8E2EA] rounded-xl text-sm text-[#0B1623] placeholder-text-muted/70 focus:outline-none focus:border-[#123C5A] transition-colors"
        />
      </div>

      {/* Loại phòng */}
      <div>
        <p className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-2.5">Loại phòng</p>
        <div className="flex flex-wrap gap-2">
          {roomTypes.map((r) => (
            <FilterBtn key={r.value} value={r.value} active={roomType === r.value} onClick={onRoomTypeChange} label={r.label} />
          ))}
        </div>
      </div>

      {/* Phong cách */}
      <div>
        <p className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-2.5">Phong cách</p>
        <div className="flex flex-wrap gap-2">
          {styles.map((s) => (
            <FilterBtn key={s.value} value={s.value} active={style === s.value} onClick={onStyleChange} label={s.label} />
          ))}
        </div>
      </div>

      {/* Ngân sách */}
      <div>
        <p className="text-xs font-bold text-[#627386] uppercase tracking-wider mb-2.5">Ngân sách</p>
        <div className="flex flex-wrap gap-2">
          {budgets.map((b) => (
            <FilterBtn key={b.value} value={b.value} active={budget === b.value} onClick={onBudgetChange} label={b.label} />
          ))}
        </div>
      </div>

      {/* Count + Clear */}
      <div className="flex items-center justify-between pt-2 border-t border-[#D8E2EA]">
        <p className="text-xs text-[#627386]">
          Hiển thị <span className="font-bold text-[#0B1623]">{filtered}</span>/{total} concept
        </p>
        {hasFilters && (
          <button
            onClick={() => { onSearchChange(''); onRoomTypeChange('All'); onStyleChange('All'); onBudgetChange('All'); }}
            className="flex items-center gap-1 text-xs text-[#C8A96A] hover:text-[#0B1623] transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}
