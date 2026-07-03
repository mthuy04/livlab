import { Info } from 'lucide-react';

export default function DemoDataBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-100"
      title="Số liệu minh hoạ, chưa phải dữ liệu thời gian thực từ hệ thống."
    >
      <Info className="w-3 h-3" />
      Dữ liệu minh hoạ
    </span>
  );
}
