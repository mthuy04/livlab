import Image from 'next/image';
import { ArrowLink, TEXT, TEXT_MUTED } from './editorial';

/**
 * The Room Studio teaser.
 *
 * The media is a screenshot of the running application, captured from
 * /room-studio — not another bathroom photograph. The 3D room in it is empty
 * because the capture starts from a fresh session.
 */
export const ROOM_STUDIO_SCREENSHOT = '/images/room-studio-ui.png';

const ROWS = [
  'Kích thước phòng thực',
  'Sản phẩm thật từ showroom',
  'Ngân sách và lưu ý kỹ thuật theo lựa chọn',
];

export default function RoomStudioFeature() {
  return (
    <section className="py-16 md:py-[104px]" style={{ backgroundColor: '#F4F4F1' }}>
      <div className="home-container grid items-center gap-14 md:grid-cols-[1.7fr_1fr] md:gap-20">
        <div
          className="relative aspect-[16/11] overflow-hidden bg-white"
          style={{ border: '1px solid #E4E4E2' }}
        >
          <Image
            src={ROOM_STUDIO_SCREENSHOT}
            alt="Giao diện Room Studio: nhập kích thước phòng, chọn vật liệu và thư viện sản phẩm"
            fill
            sizes="(max-width: 768px) 100vw, 65vw"
            className="object-cover object-left-top"
          />
        </div>

        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.15em', color: TEXT_MUTED }}>
            ROOM STUDIO
          </p>
          <h2
            className="mt-5 text-[30px] md:text-[38px]"
            style={{ fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.015em', color: TEXT }}
          >
            Thử trước trong
            <br />
            phòng của bạn
          </h2>
          <p className="mt-6 max-w-[430px]" style={{ fontSize: 16, lineHeight: 1.7, color: TEXT_MUTED }}>
            Nhập kích thước phòng, chọn vật liệu và đặt thiết bị thật vào đúng tỷ lệ trước khi quyết định.
          </p>

          <div className="mt-8" style={{ borderBlock: '1px solid #DEDEDC' }}>
            {ROWS.map((text, index) => (
              <p
                key={text}
                className="py-4"
                style={{
                  fontSize: 14,
                  color: TEXT,
                  borderBottom: index < ROWS.length - 1 ? '1px solid #DEDEDC' : undefined,
                }}
              >
                {text}
              </p>
            ))}
          </div>

          <p className="mt-7" style={{ fontSize: 13, color: '#777777' }}>
            LivLab Expert hỗ trợ lựa chọn khi bạn cần thêm gợi ý.
          </p>

          <div className="mt-8">
            <ArrowLink href="/room-studio">MỞ ROOM STUDIO</ArrowLink>
          </div>
        </div>
      </div>
    </section>
  );
}
