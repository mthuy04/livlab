'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Eye, ImageIcon, Trash2, X } from 'lucide-react';

import { Product } from '@/lib/types';
import { SelectedByZone } from '@/lib/visualStudioHelpers';

interface SimulatedRoom2DProps {
  roomImage: string | null;
  roomTitle?: string;
  selectedByZone: SelectedByZone;
  onSelectZone: (zone: string) => void;
  onRemoveFromZone: (zone: string) => void;
  activeZone: string | null;
}

const ZONE_LABELS: Record<string, string> = {
  mirror: 'Gương',
  lighting: 'Đèn',
  faucet: 'Vòi',
  lavabo: 'Lavabo',
  vanity: 'Tủ',
  toilet: 'Bồn cầu',
  shower: 'Sen',
  accessory: 'Phụ kiện',
  tile: 'Gạch',
};

const ZONE_POSITIONS: Record<string, { x: number; y: number }> = {
  lighting: { x: 50, y: 14 },
  mirror: { x: 66, y: 28 },
  faucet: { x: 56, y: 56 },
  lavabo: { x: 58, y: 64 },
  vanity: { x: 58, y: 73 },
  toilet: { x: 32, y: 70 },
  shower: { x: 18, y: 38 },
  accessory: { x: 76, y: 48 },
  tile: { x: 45, y: 42 },
};

function hasValidImage(url?: string | null) {
  if (!url) return false;
  if (url.includes('placeholder')) return false;
  if (url.startsWith('/images/') || url.startsWith('/assets/')) return false;
  return url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:');
}

function getProductSlug(product: Product) {
  const raw = (product as any).slug || `${product.name || ''}-${product.sku || product.id || ''}`;
  return raw
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function priceText(product?: Product | null) {
  if (!product) return '';
  if (product.priceRange) return product.priceRange;

  const min = product.priceMin;
  const max = product.priceMax;

  const fmt = (v?: number | null) => {
    if (!v) return '';
    return `${new Intl.NumberFormat('vi-VN').format(v)}đ`;
  };

  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return fmt(min);
  return 'Liên hệ báo giá';
}

function ProductThumb({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);

  if (!hasValidImage(product.image) || failed) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EEF4F7] text-[10px] font-bold uppercase text-[#123C5A]">
        {product.category?.slice(0, 6) || 'SP'}
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3F7FA]">
      <img
        src={product.image}
        alt={product.name}
        className="h-full w-full object-contain p-2"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function SimulatedRoom2D({
  roomImage,
  roomTitle = 'Không gian phòng tắm',
  selectedByZone,
  onSelectZone,
  onRemoveFromZone,
  activeZone,
}: SimulatedRoom2DProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const activeProduct = activeZone ? (selectedByZone as any)[activeZone] as Product | undefined : undefined;

  const zoneList = useMemo(() => Object.keys(ZONE_POSITIONS), []);

  const renderZonePopover = () => {
    if (!activeZone) return null;

    const pos = ZONE_POSITIONS[activeZone] || { x: 50, y: 50 };
    const product = activeProduct;

    const left = pos.x > 70 ? pos.x - 28 : pos.x + 3;
    const top = pos.y > 70 ? pos.y - 26 : pos.y + 4;

    return (
      <div
        className="absolute z-40 w-[260px] rounded-2xl border border-[#D8E2EA] bg-white/95 p-3 shadow-2xl backdrop-blur-md"
        style={{
          left: `${Math.max(4, Math.min(72, left))}%`,
          top: `${Math.max(6, Math.min(72, top))}%`,
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#C8A96A]">
              Khu vực đang chọn
            </p>
            <h3 className="text-sm font-bold text-[#0B1623]">
              {ZONE_LABELS[activeZone] || activeZone}
            </h3>
          </div>

          <button
            onClick={() => onSelectZone('')}
            className="rounded-full p-1 text-[#627386] transition hover:bg-[#F3F7FA] hover:text-[#0B1623]"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {product ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <ProductThumb product={product} />

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase text-[#627386]">
                  {product.brand}
                </p>
                <p className="line-clamp-2 text-sm font-bold text-[#0B1623]">
                  {product.name}
                </p>
                <p className="mt-1 text-xs font-bold text-[#C8A96A]">
                  {priceText(product)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onRemoveFromZone(activeZone)}
                className="flex-1 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
              >
                <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                Xóa
              </button>

              <Link
                href={`/products/${getProductSlug(product)}`}
                className="flex-1 rounded-xl bg-[#123C5A] px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-[#243629]"
              >
                <Eye className="mr-1 inline h-3.5 w-3.5" />
                Xem chi tiết
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-[#F3F7FA] p-3">
            <p className="text-sm font-semibold text-[#0B1623]">
              Chọn sản phẩm cho khu vực này
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#627386]">
              Danh sách bên phải đã được lọc theo khu vực để bạn chọn nhanh sản phẩm phù hợp.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.6rem] border border-[#D8E2EA] bg-[#EEF4F7] md:aspect-[16/10] lg:aspect-[16/9]">
      {roomImage && !imageFailed ? (
        <img
          src={roomImage}
          alt={roomTitle}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#EEF4F7] to-[#F3F7FA] text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#123C5A] shadow-sm">
            <ImageIcon className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-[#0B1623]">Chọn không gian để bắt đầu</h3>
          <p className="mt-1 max-w-sm text-sm text-[#627386]">
            Tải ảnh phòng tắm hiện tại hoặc chọn một phòng mẫu trong danh sách bên trái.
          </p>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

      <div className="absolute left-4 top-4 z-20 rounded-2xl bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#C8A96A]">
          Không gian đang xem
        </p>
        <p className="max-w-[260px] truncate text-sm font-bold text-[#0B1623]">
          {roomTitle}
        </p>
      </div>

      <div className="absolute bottom-4 left-4 z-20 rounded-2xl bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold text-[#123C5A]">
          Bấm vào từng khu vực để chọn sản phẩm phù hợp.
        </p>
      </div>

      {zoneList.map((zone) => {
        const pos = ZONE_POSITIONS[zone];
        const product = (selectedByZone as any)[zone] as Product | undefined;
        const isActive = activeZone === zone;

        return (
          <button
            key={zone}
            onClick={() => onSelectZone(zone)}
            className={`absolute z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-lg backdrop-blur transition ${
              isActive
                ? 'border-[#C8A96A] bg-[#123C5A] text-white ring-4 ring-[#C97855]/25'
                : product
                  ? 'border-white/80 bg-[#123C5A] text-white hover:bg-[#243629]'
                  : 'border-white/80 bg-white/90 text-[#0B1623] hover:bg-[#EEF4F7]'
            }`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                product ? 'bg-white text-[#123C5A]' : 'bg-[#EEF4F7] text-[#627386]'
              }`}
            >
              {product ? <Check className="h-3 w-3" /> : '+'}
            </span>
            <span>{ZONE_LABELS[zone] || zone}</span>
          </button>
        );
      })}

      {renderZonePopover()}
    </div>
  );
}