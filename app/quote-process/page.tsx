import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Quy trình báo giá - LivLab',
  description: 'Tìm hiểu quy trình báo giá 4 bước minh bạch và tiện lợi từ LivLab.',
};

export default function QuoteProcessPage() {
  return (
    <div className="pt-24 pb-20 bg-[#F3F7FA] min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-3xl p-10 lg:p-14 shadow-sm border border-[#D8E2EA]">
          <h1 className="text-4xl font-bold text-[#0B1623] mb-6">Quy trình báo giá</h1>
          
          <div className="prose prose-lg text-[#627386] max-w-none">
            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-6">LivLab hoạt động như thế nào?</h2>
            <p className="mb-8">
              LivLab là nền tảng số hóa trải nghiệm chọn mua thiết bị vệ sinh và nội thất phòng tắm. Chúng tôi kết nối khách hàng có nhu cầu với các showroom đối tác uy tín, giúp quá trình chọn lọc sản phẩm và nhận báo giá trở nên trực quan, chính xác và nhanh chóng hơn bao giờ hết.
            </p>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-6">Quy trình 4 bước đơn giản</h2>
            <div className="space-y-6 mb-10">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0B1623] text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h3 className="text-lg font-bold text-[#0B1623] mb-2">Chọn concept hoặc sản phẩm</h3>
                  <p>Khám phá thư viện concept phòng tắm hoặc danh mục sản phẩm từ các thương hiệu uy tín trên LivLab.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0B1623] text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h3 className="text-lg font-bold text-[#0B1623] mb-2">Thêm vào giỏ báo giá</h3>
                  <p>Lưu các sản phẩm bạn quan tâm hoặc thêm nguyên combo gợi ý vào giỏ báo giá.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#0B1623] text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h3 className="text-lg font-bold text-[#0B1623] mb-2">Gửi thông tin nhu cầu</h3>
                  <p>Điền thông tin liên hệ và các yêu cầu cụ thể (diện tích, thời gian lắp đặt dự kiến) để chúng tôi hiểu rõ nhu cầu của bạn.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#123C5A] text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div>
                  <h3 className="text-lg font-bold text-[#0B1623] mb-2">LivLab/showroom đối tác xác nhận</h3>
                  <p>Showroom đối tác sẽ kiểm tra tồn kho và liên hệ lại với bạn để cung cấp báo giá cuối cùng cũng như tư vấn phương án lắp đặt tối ưu.</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-4">Giá tham khảo là gì?</h2>
            <div className="bg-[#EEF4F7] p-6 rounded-2xl border border-[#DCEBF5] mb-8">
              <p className="text-[#123C5A] m-0 font-medium">
                Giá hiển thị trên LivLab là mức tham khảo nhằm hỗ trợ khách hàng ước lượng ngân sách. Giá cuối có thể thay đổi theo tồn kho, thời điểm, diện tích và phương án lắp đặt. Showroom sẽ xác nhận giá chính xác sau khi tư vấn.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-4">Khi nào tôi nhận được phản hồi?</h2>
            <p className="mb-8">
              Thông thường, đội ngũ tư vấn từ showroom đối tác sẽ liên hệ lại với bạn trong vòng <strong>24-48 giờ làm việc</strong> kể từ khi bạn gửi yêu cầu báo giá thành công trên hệ thống.
            </p>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-4">Cần chuẩn bị thông tin gì?</h2>
            <ul className="space-y-2 mb-10">
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-[#486581] mt-0.5 flex-shrink-0" /> Bản vẽ mặt bằng phòng tắm (nếu có)</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-[#486581] mt-0.5 flex-shrink-0" /> Kích thước dự kiến của khu vực lắp đặt</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-[#486581] mt-0.5 flex-shrink-0" /> Ngân sách tối đa có thể đầu tư</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-[#486581] mt-0.5 flex-shrink-0" /> Phong cách thiết kế yêu thích</li>
            </ul>

            <div className="mt-12 pt-8 border-t border-[#D8E2EA]">
              <Link href="/quote" className="inline-flex items-center gap-2 px-8 py-4 bg-[#123C5A] text-white font-bold rounded-full hover:bg-[#123C5A]/90 transition-colors">
                Gửi yêu cầu báo giá <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
