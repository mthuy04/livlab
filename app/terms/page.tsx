import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Điều khoản sử dụng - LivLab',
  description: 'Điều khoản và điều kiện sử dụng dịch vụ tại LivLab.',
};

export default function TermsPage() {
  return (
    <div className="pt-24 pb-20 bg-[#F3F7FA] min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-3xl p-10 lg:p-14 shadow-sm border border-[#D8E2EA]">
          <div className="w-16 h-16 rounded-full bg-[#EEF4F7] flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-[#123C5A]" />
          </div>
          <h1 className="text-4xl font-bold text-[#0B1623] mb-6">Điều khoản sử dụng</h1>
          
          <div className="prose prose-lg text-[#627386] max-w-none">
            <p className="mb-8">
              Chào mừng bạn đến với LivLab. Bằng việc truy cập và sử dụng nền tảng của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện dưới đây.
            </p>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-6">1. Phạm vi sử dụng website</h2>
            <p className="mb-8">
              LivLab cung cấp nền tảng hỗ trợ người dùng khám phá concept thiết kế, tra cứu thông tin sản phẩm nội thất/thiết bị vệ sinh và gửi yêu cầu báo giá đến các showroom đối tác. Nền tảng không trực tiếp bán hoặc giao dịch thanh toán trực tuyến.
            </p>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-6">2. Giá và tồn kho tham khảo</h2>
            <div className="bg-[#FFF8F5] p-6 rounded-2xl border border-[#FADCCF] mb-8">
              <p className="text-[#C8A96A] m-0 font-medium">
                Mọi thông tin về giá bán và tình trạng tồn kho trên LivLab chỉ mang tính chất <strong>tham khảo</strong> tại thời điểm đăng tải. Giá trị thực tế của đơn hàng sẽ do showroom đối tác xác nhận trực tiếp với khách hàng dựa trên khảo sát thực tế và thời điểm mua hàng.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-6">3. Sản phẩm và đối tác</h2>
            <p className="mb-8">
              Thông tin sản phẩm, hình ảnh và danh sách showroom đối tác có thể thay đổi, cập nhật theo thời gian nhằm đảm bảo cung cấp dịch vụ tốt nhất. LivLab nỗ lực duy trì tính chính xác của dữ liệu nhưng không đảm bảo sản phẩm luôn sẵn có tại mọi showroom mọi lúc.
            </p>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-6">4. Trách nhiệm của người dùng</h2>
            <p className="mb-8">
              Khi gửi yêu cầu báo giá, người dùng có trách nhiệm cung cấp thông tin liên hệ chính xác để showroom có thể hỗ trợ kịp thời. Không sử dụng nền tảng cho các mục đích giả mạo, spam hoặc vi phạm pháp luật.
            </p>

            <h2 className="text-2xl font-bold text-[#0B1623] mt-10 mb-6">5. Giới hạn trách nhiệm của LivLab</h2>
            <p className="mb-8">
              Trong vai trò là nền tảng công nghệ kết nối, LivLab không chịu trách nhiệm pháp lý đối với các giao dịch mua bán, chất lượng thi công lắp đặt hay các tranh chấp phát sinh trực tiếp giữa khách hàng và showroom đối tác. Chúng tôi sẽ hỗ trợ cung cấp thông tin cần thiết để giải quyết vấn đề nếu có yêu cầu.
            </p>

            <div className="mt-12 pt-8 border-t border-[#D8E2EA]">
              <Link href="/quote-process" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0B1623] text-white font-bold rounded-full hover:bg-[#123C5A] transition-colors">
                Xem quy trình báo giá <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
