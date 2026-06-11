'use client';

import { getBudgetFit } from '@/lib/budget/getBudgetFit';
import { CheckCircle2, AlertCircle, Info, ChevronRight } from 'lucide-react';

export type BudgetFitCardProps = {
  total: number;
  budgetMin?: number | null;
  budgetMax?: number | null;
  compact?: boolean;
  showAdvice?: boolean;
};

export default function BudgetFitCard({
  total,
  budgetMin,
  budgetMax,
  compact = false,
  showAdvice = true
}: BudgetFitCardProps) {
  const fit = getBudgetFit({ total, budgetMin, budgetMax });

  const formatVnd = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';

  const formatRange = () => {
    if (!budgetMax) return 'Chưa xác định';
    if (!budgetMin) return `Dưới ${formatVnd(budgetMax)}`;
    return `${formatVnd(budgetMin)} - ${formatVnd(budgetMax)}`;
  };

  const getStatusColor = () => {
    switch (fit.status) {
      case 'UNDER_BUDGET': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'WITHIN_BUDGET': return 'bg-green-100 text-green-700 border-green-200';
      case 'SLIGHTLY_OVER_BUDGET': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'OVER_BUDGET': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgressColor = () => {
    switch (fit.status) {
      case 'UNDER_BUDGET': return 'bg-blue-500';
      case 'WITHIN_BUDGET': return 'bg-green-500';
      case 'SLIGHTLY_OVER_BUDGET': return 'bg-amber-500';
      case 'OVER_BUDGET': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const Icon = () => {
    switch (fit.status) {
      case 'UNDER_BUDGET':
      case 'WITHIN_BUDGET': return <CheckCircle2 className="w-4 h-4" />;
      case 'SLIGHTLY_OVER_BUDGET': return <AlertCircle className="w-4 h-4" />;
      case 'OVER_BUDGET': return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const pct = Math.min(fit.percentage, 100);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusColor()}`}>
        <Icon />
        <span>{fit.label}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#D8E2EA] p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#627386] font-bold mb-1">Tổng tạm tính</p>
          <p className="text-2xl font-bold text-[#123C5A]">{formatVnd(total)}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs uppercase tracking-wider text-[#627386] font-bold mb-1">Ngân sách dự kiến</p>
          <p className="text-sm font-bold text-[#0B1623]">{formatRange()}</p>
        </div>
      </div>

      {budgetMax && budgetMax > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1 font-medium">
            <span className="text-[#627386]">Tiến độ ngân sách</span>
            <span className="text-[#0B1623]">{fit.percentage}%</span>
          </div>
          <div className="w-full h-2 bg-[#EEF4F7] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 mt-4 pt-4 border-t border-[#EEF4F7]">
        <div className={`mt-0.5 shrink-0 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getStatusColor()}`}>
          {fit.label}
        </div>
        {showAdvice && (
          <p className="text-sm text-[#627386] leading-snug flex-1">
            {fit.description}
          </p>
        )}
      </div>
    </div>
  );
}
