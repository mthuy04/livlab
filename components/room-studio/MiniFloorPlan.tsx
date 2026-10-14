'use client';

import { useRef } from 'react';
import type { PlacedProductView } from '@/lib/room-studio/useRoomStudio';
import type { UtilityPoint, UtilityPointType } from '@/lib/technical-advisor/types';
import { getRoomBounds, type RoomDimensions } from '@/lib/room-studio/roomGeometry';
import { getRealWorldSize } from '@/lib/room-studio/assetResolver';

/**
 * A top-down projection of the room that is already in the scene.
 *
 * It renders no state of its own. Every rectangle below is `placed.position`
 * and `getRealWorldSize` — the same two sources the 3D canvas reads — so the
 * plan cannot drift from the room, and a product cannot be in one place here
 * and another there. Selection is the scene's selection.
 *
 * SVG and not a second renderer: the job is orientation and a reliable way to
 * drop a technical point, not visualisation. Anything a canvas would add here
 * would be a second thing to keep in sync.
 *
 * Axes, read off the engine: X is width/left–right, Z is depth/front–back, and
 * the back wall is at −Z. The plan puts −Z at the top, so the wall the customer
 * looks at in the 3D view is the wall along the top edge of the plan.
 */

const TYPE_SYMBOL: Record<UtilityPointType, string> = {
  DRAIN: 'D',
  TOILET_WASTE: 'WC',
  COLD_WATER: 'C',
  HOT_WATER: 'H',
  ELECTRICAL: 'E',
  UNKNOWN: '?',
};

const TYPE_FILL: Record<UtilityPointType, string> = {
  DRAIN: '#4A6275',
  TOILET_WASTE: '#123C5A',
  COLD_WATER: '#3E7FA8',
  HOT_WATER: '#B4603A',
  ELECTRICAL: '#8A6A2F',
  UNKNOWN: '#8C9BAB',
};

const CATEGORY_FILL: Record<string, string> = {
  lavabo: '#7FA8C4',
  faucet: '#C8A96A',
  toilet: '#8FB0A0',
  shower: '#9AA7C4',
  mirror: '#B9C6CE',
  vanity: '#C0A88C',
  lighting: '#E2C98B',
};

interface MiniFloorPlanProps {
  dimensions: RoomDimensions;
  placedViews: PlacedProductView[];
  utilityPoints: UtilityPoint[];
  selectedInstanceId: string | null;
  onSelect: (instanceId: string | null) => void;
  /**
   * Set while the customer is choosing where a technical point goes. The plan
   * then reports the metre position of a click instead of changing selection.
   */
  pickingLabel?: string | null;
  onPick?: (position: { fromLeft: number; fromBack: number }) => void;
}

/** Drawing area in SVG units; 1 unit = 1 cm of room, so a 3m wall is 300. */
const PAD = 14;

export default function MiniFloorPlan({
  dimensions,
  placedViews,
  utilityPoints,
  selectedInstanceId,
  onSelect,
  pickingLabel,
  onPick,
}: MiniFloorPlanProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const bounds = getRoomBounds(dimensions);
  const roomW = dimensions.length * 100;
  const roomD = dimensions.width * 100;
  const viewW = roomW + PAD * 2;
  const viewH = roomD + PAD * 2;

  /** Room metres (centre origin) → SVG units (top-left origin). */
  const sx = (x: number) => PAD + (x - bounds.minX) * 100;
  const sz = (z: number) => PAD + (z - bounds.minZ) * 100;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!pickingLabel || !onPick || !svgRef.current) return;
    // Read the click in the SVG's own coordinate space rather than from the
    // element's pixel box: the plan is scaled to fit its panel, and a px→unit
    // conversion done by hand would be wrong at every width but one.
    const point = svgRef.current.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const screenCtm = svgRef.current.getScreenCTM();
    if (!screenCtm) return;
    const local = point.matrixTransform(screenCtm.inverse());

    const fromLeft = (local.x - PAD) / 100;
    const fromBack = (local.y - PAD) / 100;
    if (fromLeft < 0 || fromBack < 0 || fromLeft > dimensions.length || fromBack > dimensions.width) return;
    onPick({ fromLeft, fromBack });
  };

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewW} ${viewH}`}
        onClick={handleClick}
        role={pickingLabel ? 'button' : 'img'}
        aria-label={
          pickingLabel
            ? `Chọn vị trí ${pickingLabel} trên sơ đồ phòng`
            : `Sơ đồ phòng ${dimensions.length} × ${dimensions.width} mét, ${placedViews.length} sản phẩm`
        }
        className={`w-full rounded-lg border bg-white ${
          pickingLabel ? 'cursor-crosshair border-[#C8A96A]' : 'border-[#E6EDF2]'
        }`}
      >
        {/* 50cm grid, so the plan reads as a measured space, not a sketch. */}
        <defs>
          <pattern id="rs-plan-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#EDF2F5" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect x={PAD} y={PAD} width={roomW} height={roomD} fill="#FBFCFD" />
        <rect x={PAD} y={PAD} width={roomW} height={roomD} fill="url(#rs-plan-grid)" />

        {/* The back wall, drawn heavier — it is the wall at −Z that the default
            camera faces, and without it the plan has no orientation. */}
        <line x1={PAD} y1={PAD} x2={PAD + roomW} y2={PAD} stroke="#0B1623" strokeWidth="4" />
        <rect
          x={PAD}
          y={PAD}
          width={roomW}
          height={roomD}
          fill="none"
          stroke="#9AA9B6"
          strokeWidth="2"
        />

        {placedViews.map(({ placed, product }) => {
          const size = getRealWorldSize(product);
          // Yaw is about the vertical axis, so a quarter turn swaps the
          // footprint's two horizontal sides. Anything between reads as the
          // larger of the two, which keeps the plan honest about the space the
          // product needs without drawing a rotated polygon at this size.
          const quarterTurns = Math.round(placed.rotationY / (Math.PI / 2));
          const swapped = Math.abs(quarterTurns % 2) === 1;
          const w = (swapped ? size.depth : size.width) * 100;
          const d = (swapped ? size.width : size.depth) * 100;
          const isSelected = placed.instanceId === selectedInstanceId;
          const fill = CATEGORY_FILL[product.normalizedCategory] ?? '#9FB0BD';

          return (
            <g
              key={placed.instanceId}
              onClick={(e) => {
                if (pickingLabel) return;
                e.stopPropagation();
                onSelect(placed.instanceId);
              }}
              className={pickingLabel ? '' : 'cursor-pointer'}
            >
              <title>{product.name}</title>
              <rect
                x={sx(placed.position[0]) - w / 2}
                y={sz(placed.position[2]) - d / 2}
                width={w}
                height={d}
                rx={4}
                fill={fill}
                fillOpacity={isSelected ? 0.95 : 0.6}
                stroke={isSelected ? '#0B1623' : fill}
                strokeWidth={isSelected ? 4 : 2}
              />
            </g>
          );
        })}

        {utilityPoints.map((point) => {
          const cx = sx(point.position[0]);
          const cy = sz(point.position[2]);
          return (
            <g key={point.id}>
              <title>{point.label ?? point.type}</title>
              <circle cx={cx} cy={cy} r={17} fill="#FFFFFF" stroke={TYPE_FILL[point.type]} strokeWidth="3" />
              {/* A letter, not only a colour — §77, and the plan is also read
                  printed and by anyone who cannot separate these hues. */}
              <text
                x={cx}
                y={cy + 7}
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                fill={TYPE_FILL[point.type]}
              >
                {TYPE_SYMBOL[point.type]}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-2 text-[12px] text-[#7C8C9A]">
        {pickingLabel
          ? `Chạm vào sơ đồ để đặt ${pickingLabel.toLowerCase()}.`
          : `Nhìn từ trên xuống · ${dimensions.length.toFixed(1)} × ${dimensions.width.toFixed(1)} m · tường đậm là tường trong`}
      </p>
    </div>
  );
}
