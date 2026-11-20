'use client';

import Image from 'next/image';
import { STYLE_IDS, STYLE_PACKS, type StylePackId } from '@/lib/room-studio/stylePacks';
import { describeSurfaceStyle } from '@/lib/room-studio/materials';
import type { RoomState } from '@/lib/room-studio/roomState';
import { roomLighting } from '@/lib/room-studio/stylePacks';
import type { RoomProposal } from '@/lib/room-studio/roomProposal';

export default function StyleSwitcher({
  room,
  proposal,
  choose,
  apply,
  discard,
}: {
  room: RoomState;
  proposal: RoomProposal | null;
  choose: (id: StylePackId) => void;
  apply: () => void;
  discard: () => void;
}) {
  const active = room.visualStyle;
  const after = proposal?.preview;
  const operation = proposal?.operations[0];
  const selected = operation?.op === 'style' ? operation.id : active?.id;
  return (
    <section className="border-b border-[#dfe4e6] pb-4" aria-label="Phong cách phòng">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider">Phong cách</h3>
      <div className="grid grid-cols-3 gap-1.5">
        {STYLE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={selected === id}
            onClick={() => choose(id)}
            className={
              'overflow-hidden rounded border text-left focus-visible:outline-2 focus-visible:outline-offset-2 ' +
              (selected === id ? 'border-[#997b42] bg-[#f8f5ee]' : 'border-[#e0e4e7] bg-white')
            }
          >
            <Image
              src={'/room-studio/styles/' + id + '.jpg'}
              unoptimized
              alt=""
              width={192}
              height={130}
              className="aspect-[3/2] w-full object-cover"
            />
            <span className="block px-1.5 py-2 text-[10px] font-bold uppercase leading-tight">
              {STYLE_PACKS[id].name}
            </span>
          </button>
        ))}
      </div>
      {selected && <p className="mt-2 text-[12px] text-[#58636a]">{STYLE_PACKS[selected].description}</p>}
      {proposal ? (
        <div className="mt-2 space-y-2 text-xs" aria-live="polite">
          <p>
            <strong>Xem trước</strong> · Vật liệu và ánh sáng
          </p>
          {after && (
            <details>
              <summary className="cursor-pointer">Chi tiết thay đổi</summary>
              <dl className="mt-2 space-y-2">
                {(['floor', 'walls'] as const).map((k) => (
                  <div key={k}>
                    <dt className="font-medium">{k === 'floor' ? 'Sàn' : 'Tường'}</dt>
                    <dd>
                      {describeSurfaceStyle(room.surfaceStyles[k])} →{' '}
                      {describeSurfaceStyle(after.surfaceStyles[k])}
                    </dd>
                  </div>
                ))}
                <div>
                  <dt className="font-medium">Ánh sáng</dt>
                  <dd>
                    {roomLighting(active, room.lighting).name} → {selected && STYLE_PACKS[selected].name}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Chi tiết kiến trúc</dt>
                  <dd>Nẹp kính và tủ dưới chậu rửa</dd>
                </div>
              </dl>
            </details>
          )}
          {proposal.errors.map((message) => (
            <p key={message} role="alert">
              {message}
            </p>
          ))}
          <div className="flex gap-2">
            <button type="button" className="rounded border px-3 py-2" onClick={discard}>
              Bỏ qua
            </button>
            <button
              type="button"
              className="rounded bg-[#172733] px-3 py-2 text-white disabled:opacity-40"
              disabled={!proposal.eligible}
              onClick={apply}
            >
              Áp dụng
            </button>
          </div>
        </div>
      ) : (
        !!active?.overrides.length && (
          <p className="mt-1 text-xs">
            Đã tùy chỉnh ·{' '}
            {active.overrides
              .map((k) => ({ floor: 'sàn', walls: 'tường', lighting: 'ánh sáng' }[k]))
              .join(', ')}
          </p>
        )
      )}
    </section>
  );
}
