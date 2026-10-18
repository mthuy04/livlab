'use client';

import Link from 'next/link';
import { Copy, ExternalLink, Minus, Plus, RotateCw, Trash2, Wallet, X } from 'lucide-react';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import { getRealWorldSize } from '@/lib/room-studio/assetResolver';
import { formatProductPrice } from '@/lib/room-studio/budgetCalculator';
import type { RoomDimensions } from '@/lib/room-studio/roomGeometry';
import type { TechnicalValidationResult } from '@/lib/technical-advisor/types';
import {
  PLACEMENT_STATUS_COLOR,
  PLACEMENT_STATUS_LABEL,
  type PlacementStatus,
} from '@/lib/room-studio/placementStatus';
import {
  MOUNTING_LABEL,
  installationHeight,
  installationHeightLabel,
  installationHeightRange,
} from '@/lib/room-studio/mounting';

interface SelectedProductToolbarProps {
  selection: PlacedProductView;
  isInQuote: boolean;
  onRotate: (instanceId: string, deltaRadians: number) => void;
  onDuplicate: (instanceId: string) => void;
  onRemove: (instanceId: string) => void;
  onAddToQuote: (view: PlacedProductView) => void;
  onDeselect: () => void;
  /** Where this placement stands; drives the fit line. */
  status?: PlacementStatus;
  /** The advisor's findings for this instance, worst first. */
  findings?: TechnicalValidationResult[];
  dimensions?: RoomDimensions;
  onSetVariant?: (instanceId: string, variant: string) => void;
  onSetInstallationHeight?: (instanceId: string, metres: number) => void;
}

/** One press of the height stepper. Fine enough for a mixer, coarse enough to be quick. */
const HEIGHT_STEP = 0.05;

const QUARTER_TURN = Math.PI / 2;

/**
 * Contextual controls for the selected product, docked under the viewport.
 *
 * Four actions and no transform gizmo. Rotation is in quarter turns, moving is
 * done by dragging the product, and there is deliberately no scale control of
 * any kind: a real SKU has one size, and a customer who could stretch a toilet
 * to fit would be evaluating a product that does not exist.
 *
 * Where a product has no runtime model, the panel says so in words rather than
 * leaving the grey volume in the scene to be read as the product's shape.
 */
export default function SelectedProductToolbar({
  selection,
  isInQuote,
  onRotate,
  onDuplicate,
  onRemove,
  onAddToQuote,
  onDeselect,
  status,
  findings = [],
  dimensions,
  onSetVariant,
  onSetInstallationHeight,
}: SelectedProductToolbarProps) {
  const { placed, product } = selection;
  const size = getRealWorldSize(product);
  const mm = (metres: number) => Math.round(metres * 1000);
  const height = installationHeight(product, placed);
  const heightRange = installationHeightRange(product);
  const heightLabel = installationHeightLabel(product);
  const recon = product.reconstruction;
  // The finding a customer should read first: a real placement problem, else
  // the first thing the advisor wants checked.
  const headline =
    findings.find((f) => f.placementIssue) ?? findings.find((f) => f.severity !== 'SUITABLE') ?? null;

  return (
    <div className="flex flex-col gap-3 border-t border-[#E1E8ED] bg-white px-4 py-3 md:flex-row md:items-center md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-[#EDF2F5] bg-[#F8F8F7]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-contain p-0.5"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[11px] text-[#9AA9B6]">
              {product.normalizedCategory.slice(0, 3)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[12px] uppercase tracking-[0.08em] text-[#8C9BAB]">
            {product.brand || product.category}
            {product.sku && <span className="normal-case tracking-normal"> · {product.sku}</span>}
          </span>
          <h3 className="line-clamp-1 text-[14px] font-medium text-[#0B1623]" title={product.name}>
            {product.name}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-[#8C9BAB]">
            <span className="font-semibold text-[#0B1623]">{formatProductPrice(product)}</span>
            {/* §70: always W × D × H, customer-facing, from the same source the
                scene volume is built from. */}
            <span className="tabular-nums">
              {mm(size.width)} × {mm(size.depth)} × {mm(size.height)} mm
            </span>
            {/* Three states, not two. "Đang cập nhật" was shown for everything
                that is not VERIFIED_3D, which became wrong the moment a product
                could carry a stand-in: the customer reads "the 3D model is
                being updated" while a 3D model is on screen in front of them.
                A stand-in says what it is; only a product with no geometry at
                all is still waiting for one. */}
            {product.capability === 'PROTOTYPE_3D' ? (
              <span
                className="whitespace-nowrap text-[#2F7D5B]"
                title="Mô hình 3D LivLab tái tạo từ ảnh và bản vẽ của hãng: đúng kích thước tổng thể, hướng và cách lắp; không phải file 3D chính hãng."
              >
                Mô hình 3D tái tạo
              </span>
            ) : (
              product.capability !== 'VERIFIED_3D' &&
              (product.illustrativeModel ? (
                // Just the caveat. The true dimensions are the span immediately
                // before this one, so repeating "kích thước thật" here only
                // makes the bar wrap and squeeze the viewport.
                <span className="whitespace-nowrap text-[#8C9BAB]">Hình khối minh hoạ</span>
              ) : (
                <span className="text-[#A8691F]">Mô hình 3D đang cập nhật</span>
              ))
            )}
          </p>
          {/* The fit line: how this product sits in this room, in one row. */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            {status && (
              <span className="flex items-center gap-1.5 font-medium" style={{ color: PLACEMENT_STATUS_COLOR[status] }}>
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: PLACEMENT_STATUS_COLOR[status] }} />
                {PLACEMENT_STATUS_LABEL[status]}
              </span>
            )}
            <span className="text-[#8C9BAB]">{MOUNTING_LABEL[placed.placementType] ?? placed.placementType}</span>
            {dimensions && (
              <span className="tabular-nums text-[#8C9BAB]">
                Phòng {dimensions.length.toFixed(2).replace('.', ',')} × {dimensions.width.toFixed(2).replace('.', ',')} m
              </span>
            )}
            {height !== null && heightRange && heightLabel && onSetInstallationHeight && (
              <span className="flex items-center gap-1 text-[#3F4F5C]">
                <span className="text-[#8C9BAB]">{heightLabel}</span>
                <button
                  type="button"
                  aria-label={`Hạ ${heightLabel.toLowerCase()} 5cm`}
                  disabled={height <= heightRange[0] + 1e-6}
                  onClick={() => onSetInstallationHeight(placed.instanceId, height - HEIGHT_STEP)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-[#D8E2EA] disabled:opacity-40"
                >
                  <Minus className="h-3 w-3" aria-hidden />
                </button>
                <span className="w-[52px] text-center font-semibold tabular-nums">{mm(height)} mm</span>
                <button
                  type="button"
                  aria-label={`Nâng ${heightLabel.toLowerCase()} 5cm`}
                  disabled={height >= heightRange[1] - 1e-6}
                  onClick={() => onSetInstallationHeight(placed.instanceId, height + HEIGHT_STEP)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-[#D8E2EA] disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" aria-hidden />
                </button>
              </span>
            )}
            {recon && recon.variants.length > 1 && onSetVariant && (
              <span className="flex overflow-hidden rounded border border-[#D8E2EA]" role="group" aria-label="Phiên bản mô hình">
                {recon.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={recon.variant === v.id}
                    onClick={() => onSetVariant(placed.instanceId, v.id)}
                    className={`px-2 py-0.5 ${
                      recon.variant === v.id ? 'bg-[#EEF4F7] font-semibold text-[#0B1623]' : 'text-[#5B6B7A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </span>
            )}
          </div>
          {headline && (
            <p className="mt-0.5 line-clamp-1 text-[12px] text-[#5B6B7A]" title={headline.message}>
              {headline.title}
              {headline.suggestedAction ? ` — ${headline.suggestedAction}` : ''}
            </p>
          )}
          {recon?.illustrativeParts && (
            <p className="mt-0.5 text-[12px] text-[#A8691F]">{recon.illustrativeParts}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <IconAction
          label="Xoay 90°"
          onClick={() => onRotate(placed.instanceId, QUARTER_TURN)}
          icon={<RotateCw className="h-4 w-4" aria-hidden />}
        />
        <IconAction
          label="Nhân đôi"
          onClick={() => onDuplicate(placed.instanceId)}
          icon={<Copy className="h-4 w-4" aria-hidden />}
        />
        <Link
          href={`/products/${product.slug || product.id}`}
          target="_blank"
          title="Chi tiết"
          aria-label={`Xem chi tiết ${product.name}`}
          className="flex h-9 items-center gap-1.5 rounded border border-[#D8E2EA] px-2.5 text-[12px] font-medium text-[#3F4F5C] transition-colors hover:border-[#0B2239]"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          <span className="hidden lg:inline">Chi tiết</span>
        </Link>
        <IconAction
          label="Xoá khỏi phòng"
          onClick={() => onRemove(placed.instanceId)}
          icon={<Trash2 className="h-4 w-4" aria-hidden />}
          danger
        />
        <button
          type="button"
          onClick={() => onAddToQuote(selection)}
          className="flex h-9 items-center gap-1.5 rounded bg-[color:var(--tenant-ui-primary,#123C5A)] px-3 text-[12px] font-semibold text-[color:var(--tenant-ui-primary-contrast,#FFFFFF)] transition-colors hover:bg-[color:var(--tenant-ui-primary-hover,#0D2B42)]"
        >
          <Wallet className="h-4 w-4" aria-hidden />
          {isInQuote ? 'Đã trong giỏ' : 'Vào giỏ'}
        </button>
        <IconAction
          label="Bỏ chọn"
          onClick={onDeselect}
          icon={<X className="h-4 w-4" aria-hidden />}
        />
      </div>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  icon,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded border border-[#D8E2EA] transition-colors ${
        danger
          ? 'text-[#8C9BAB] hover:border-[#B4322A] hover:text-[#B4322A]'
          : 'text-[#3F4F5C] hover:border-[#0B2239]'
      }`}
    >
      {icon}
    </button>
  );
}
