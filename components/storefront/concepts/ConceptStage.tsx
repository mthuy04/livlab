'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { X } from 'lucide-react';
import { ProductImagePlaceholder, StageImage } from '@/components/storefront/catalog/ProductImage';
import { opticalScale } from '@/lib/storefront/catalogTypes';
import { TEXT, TEXT_FAINT, TEXT_MUTED } from '@/components/storefront/home/editorial';
import { formatVnd } from '@/lib/storefront/productDetailTypes';
import {
  MATCH_LABEL,
  TARGET_LABEL,
  type ConceptHotspotView,
} from '@/lib/storefront/conceptTypes';
import { CONCEPT_IMAGE_HEIGHT, CONCEPT_IMAGE_WIDTH } from '@/lib/storefront/conceptLibrary';

/**
 * The room, with its products on it.
 *
 * Coordinates are percentages of the 1448×1086 asset, and the stage is 4:3 —
 * the asset's own ratio — so the frame never crops and a point written once
 * lands on the same fixture at 1536px and at 390px. This is the reason the
 * stage refuses to take an arbitrary crop: an `object-fit: cover` into any
 * other ratio slides every fixture under a coordinate that did not move, and
 * the hotspot quietly starts naming the tile next to the basin.
 *
 * Each hotspot is a real `<button>` with a label naming the fixture, because
 * a div with a click handler is invisible to a keyboard and to a screen
 * reader, and "the products are in the picture" is not a thing you can say to
 * someone who cannot see the picture.
 */

type Props = {
  image: string;
  imageAlt: string;
  hotspots: ConceptHotspotView[];
};

export default function ConceptStage({ image, imageAlt, hotspots }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [isPhone, setIsPhone] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsPhone(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Escape closes, and a click anywhere outside the open hotspot closes.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest('[data-hotspot-ui]')) setOpenId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [openId]);

  const open = hotspots.find((h) => h.id === openId) ?? null;

  /**
   * A double vanity puts two hotspots on two basins, and "Xem sản phẩm tại vị
   * trí lavabo" twice is two identical stops for anyone moving through the
   * stage by keyboard. Repeated fixtures get numbered; a fixture that appears
   * once is left alone, because "bồn tắm 1" of one is noise.
   */
  const label = (h: ConceptHotspotView) => {
    const sameType = hotspots.filter((o) => o.targetType === h.targetType);
    const base = `Xem sản phẩm tại vị trí ${TARGET_LABEL[h.targetType]}`;
    return sameType.length > 1 ? `${base} ${sameType.indexOf(h) + 1}/${sameType.length}` : base;
  };

  return (
    <div>
      <div className="concept-stage" ref={stageRef}>
        <Image
          src={image}
          alt={imageAlt}
          width={CONCEPT_IMAGE_WIDTH}
          height={CONCEPT_IMAGE_HEIGHT}
          sizes="(max-width: 1023px) 100vw, 1000px"
          priority
          className="concept-stage-image"
        />

        {visible &&
          hotspots.map((h) => (
            <div key={h.id} data-hotspot-ui>
              <button
                type="button"
                className="concept-hotspot"
                aria-expanded={openId === h.id}
                aria-label={label(h)}
                style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }}
                onClick={() => setOpenId(openId === h.id ? null : h.id)}
              />
              {!isPhone && openId === h.id && <Popover hotspot={h} />}
            </div>
          ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-6">
        <button
          type="button"
          onClick={() => {
            setVisible(!visible);
            setOpenId(null);
          }}
          className="transition-opacity hover:opacity-60"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.10em', color: TEXT }}
        >
          {visible ? 'ẨN SẢN PHẨM' : 'HIỆN SẢN PHẨM'}
        </button>
        <p style={{ fontSize: 12, color: TEXT_FAINT }}>
          Chạm vào các điểm trên ảnh để xem sản phẩm
        </p>
      </div>

      {isPhone && open && (
        <div
          className="concept-hotspot-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={label(open)}
          data-hotspot-ui
        >
          <div className="concept-hotspot-sheet-panel">
            <div className="mb-3 flex justify-end">
              <button type="button" onClick={() => setOpenId(null)} aria-label="Đóng" autoFocus>
                <X size={20} strokeWidth={1.4} color={TEXT} />
              </button>
            </div>
            <ProductPreview hotspot={open} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Anchored to the hotspot, flipped toward the middle when the point is near an
 * edge, so a basin at 89% across does not open a panel off the side of the
 * stage.
 */
function Popover({ hotspot }: { hotspot: ConceptHotspotView }) {
  const flipX = hotspot.xPct > 58;
  const flipY = hotspot.yPct > 56;

  return (
    <div
      className="concept-popover"
      style={{
        left: `${hotspot.xPct}%`,
        top: `${hotspot.yPct}%`,
        transform: `translate(${flipX ? 'calc(-100% - 20px)' : '20px'}, ${
          flipY ? 'calc(-100% - 18px)' : '18px'
        })`,
      }}
    >
      <ProductPreview hotspot={hotspot} />
    </div>
  );
}

function ProductPreview({ hotspot }: { hotspot: ConceptHotspotView }) {
  const p = hotspot.product;

  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '.11em',
          color: TEXT_FAINT,
          textTransform: 'uppercase',
        }}
      >
        {MATCH_LABEL[hotspot.match]}
      </p>

      <div className="mt-3 flex gap-3.5">
        <div style={{ width: 76, flexShrink: 0 }}>
          {p.imagePresentable && p.image ? (
            <StageImage
              src={p.image}
              alt={p.name}
              stage="#F8F8F7"
              occupancy={opticalScale(p.category, p.name) * 0.82}
            />
          ) : (
            <div style={{ aspectRatio: '1' }}>
              <ProductImagePlaceholder brand={p.brand} sku={p.sku} />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', color: TEXT_FAINT }}>
            {p.brand.toUpperCase()}
          </p>
          <p style={{ marginTop: 4, fontSize: 13.5, lineHeight: 1.4, color: TEXT }}>{p.name}</p>
          {p.sku && (
            <p style={{ marginTop: 4, fontSize: 11.5, color: TEXT_FAINT }}>{p.sku}</p>
          )}
          {p.showroomPrice != null && p.showroomPrice > 0 && (
            <p style={{ marginTop: 7, fontSize: 14, fontWeight: 500, color: TEXT }}>
              {formatVnd(p.showroomPrice)}
            </p>
          )}
        </div>
      </div>

      <p className="mt-3.5">
        <Link
          href={p.href as Route}
          className="transition-opacity hover:opacity-60"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: TEXT }}
        >
          XEM CHI TIẾT →
        </Link>
      </p>

      {hotspot.match === 'CLOSE_VISUAL_MATCH' && (
        <p style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.5, color: TEXT_MUTED }}>
          Gợi ý sản phẩm tương đồng với thiết bị trong ảnh, không phải ảnh chụp chính sản phẩm này.
        </p>
      )}
    </div>
  );
}
