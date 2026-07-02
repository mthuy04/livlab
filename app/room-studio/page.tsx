import RoomStudioClient from './RoomStudioClient';

export const metadata = {
  title: 'Room Studio - LivLab',
  description:
    'Nhập kích thước phòng tắm thật, chọn màu gạch và xem trước sản phẩm trong không gian 3D đúng tỷ lệ trước khi gửi yêu cầu báo giá.',
};

export default function RoomStudioPage() {
  return <RoomStudioClient />;
}
