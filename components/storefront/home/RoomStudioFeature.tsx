import Image from 'next/image';
import { Container } from '@/components/storefront/primitives';
import { ArrowLink, SECTION_PAD, H2_STYLE, BODY_STYLE, TEXT, TEXT_MUTED, DIVIDER } from './editorial';

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
    <section style={{ paddingBlock: SECTION_PAD, backgroundColor: '#F5F5F3' }}>
      <Container>
        <div className="grid gap-9 lg:grid-cols-[62fr_38fr] lg:items-center lg:gap-[60px]">
          <Image
            src={ROOM_STUDIO_SCREENSHOT}
            alt="Giao diện Room Studio: nhập kích thước phòng, chọn vật liệu và thư viện sản phẩm"
            width={1700}
            height={1240}
            sizes="(max-width: 1024px) 100vw, 62vw"
            className="w-full"
            style={{ border: `1px solid ${DIVIDER}` }}
          />

          <div>
            <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: '.12em', color: TEXT_MUTED }}>ROOM STUDIO</p>
            <h2 className="mt-4" style={H2_STYLE}>Thử trước trong phòng của bạn</h2>
            <p className="mt-5" style={BODY_STYLE}>
              Nhập kích thước phòng, chọn vật liệu và đặt thiết bị thật vào đúng tỷ lệ trước khi quyết định.
            </p>

            <div className="mt-8">
              {ROWS.map((row) => (
                <p key={row} className="py-3.5" style={{ fontSize: 15, color: TEXT, borderTop: `1px solid ${DIVIDER}` }}>
                  {row}
                </p>
              ))}
            </div>

            <p className="mt-6" style={{ ...BODY_STYLE, fontSize: 14 }}>
              LivLab Expert hỗ trợ lựa chọn khi bạn cần thêm gợi ý.
            </p>

            <div className="mt-7">
              <ArrowLink href="/room-studio">MỞ ROOM STUDIO</ArrowLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
