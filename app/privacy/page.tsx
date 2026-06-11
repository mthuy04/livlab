import Link from 'next/link';
import { Shield, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Chính sách bảo mật - LivLab',
  description: 'Chính sách bảo mật và cách LivLab xử lý thông tin cá nhân của bạn.',
};

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-20 bg-[#F3F7FA] min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-3xl p-10 lg:p-14 shadow-sm border border-[#D8E2EA]">
          <div className="w-16 h-16 rounded-full bg-[#EEF4F7] flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-[#123C5A]" />
          </div>
          <h1 className="text-4xl font-bold text-[#0B1623] mb-6">Chính sách bảo mật</h1>
          
          <div className="prose prose-lg text-[#627386] max-w-none">
            <p className="mb-8">
              Tại LivLab, chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu khi bạn sử dụng nền tảng của chúng tôi để chọn nội thất và yêu cầu báo giá.
            </p>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-6">1. Thông tin LivLab thu thập</h2>
            <p>Để phục vụ cho quá trình tư vấn và báo giá, chúng tôi sẽ thu thập các thông tin sau khi bạn gửi yêu cầu:</p>
            <ul className="list-disc pl-5 mb-8 space-y-2">
              <li>Họ và tên</li>
              <li>Số điện thoại liên hệ</li>
              <li>Địa chỉ email</li>
              <li>Thông tin về nhu cầu báo giá (diện tích, dự án)</li>
              <li>Danh sách các sản phẩm và concept bạn đã chọn vào giỏ</li>
            </ul>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-6">2. LivLab sử dụng thông tin để:</h2>
            <ul className="list-disc pl-5 mb-8 space-y-2">
              <li><strong>Xử lý yêu cầu báo giá:</strong> Chuyển thông tin nhu cầu của bạn đến showroom đối tác để lên báo giá chính xác.</li>
              <li><strong>Liên hệ tư vấn:</strong> Gọi điện hoặc email để làm rõ các chi tiết kỹ thuật và phương án lắp đặt.</li>
              <li><strong>Cải thiện trải nghiệm:</strong> Đề xuất các sản phẩm và concept phù hợp hơn dựa trên lịch sử tìm kiếm.</li>
            </ul>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-6">3. Cam kết bảo mật</h2>
            <div className="bg-[#EEF4F7] p-6 rounded-2xl border border-[#DCEBF5] mb-8">
              <p className="text-[#123C5A] m-0 font-medium">
                LivLab <strong>không công khai</strong> thông tin cá nhân của khách hàng và <strong>không bán</strong> dữ liệu cho các bên thứ ba vì mục đích quảng cáo không liên quan. Thông tin của bạn chỉ được chia sẻ với showroom đối tác trực tiếp thực hiện việc tư vấn và báo giá cho bạn.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-6">4. Quyền của khách hàng</h2>
            <p className="mb-8">
              Khách hàng có quyền truy cập, yêu cầu chỉnh sửa hoặc xóa thông tin liên hệ của mình khỏi hệ thống của LivLab bất kỳ lúc nào bằng cách liên hệ với bộ phận chăm sóc khách hàng.
            </p>

            <div className="mt-12 pt-8 border-t border-[#D8E2EA]">
              <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-[#123C5A] text-white font-bold rounded-full hover:bg-[#0B1623] transition-colors">
                Liên hệ LivLab <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
