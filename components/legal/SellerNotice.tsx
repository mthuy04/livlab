import type { TenantStorefrontConfig } from '@/lib/storefront/tenantConfig';

/**
 * On a showroom's own website, who is who: the showroom sells, advises and
 * quotes; LivLab provides and operates the website. Stated as the system
 * actually works — it adds no commitment either party has not made.
 */
export default function SellerNotice({ tenant, topic }: { tenant: TenantStorefrontConfig; topic: 'privacy' | 'terms' }) {
  const business = tenant.business;
  if (!business) return null;
  const name = business.name;
  return (
    <section className="mb-10 border border-[#D8E2EA] bg-[#F5F8F9] p-6 not-prose" aria-labelledby="seller-notice">
      <h2 id="seller-notice" className="text-[18px] font-semibold text-[#0B1623]">Bên bán và đơn vị vận hành website</h2>
      <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-[#3f4f58]">
        <li>
          <strong className="text-[#0B1623]">{name}</strong> ({business.displayAddress}, {business.telephoneDisplay}) là bên bán
          hàng: tư vấn, báo giá, giao hàng và lắp đặt do {name} thực hiện và xác nhận trực tiếp với bạn.
        </li>
        <li>
          <strong className="text-[#0B1623]">LivLab</strong> cung cấp và vận hành nền tảng website này: hiển thị danh mục,
          Room Studio, lưu trữ yêu cầu báo giá bạn gửi và chuyển yêu cầu đó đến {name}.
        </li>
        {topic === 'privacy' ? (
          <>
            <li>
              Yêu cầu bạn gửi trên website này (họ tên, số điện thoại, nhu cầu, sản phẩm đã chọn) chỉ được chuyển đến {name}.
              Phần chính sách bên dưới là chính sách của nền tảng LivLab.
            </li>
            <li>
              Video trên trang chủ phát qua trình phát nhúng của Facebook và chỉ tải khi bạn bấm phát; khi đó Facebook có thể
              ghi nhận lượt xem theo chính sách của Facebook.
            </li>
          </>
        ) : (
          <li>
            Giá trên website ghi rõ nguồn (phần lớn là giá hãng đề xuất) và không phải giá bán; giá cuối do {name} xác nhận
            khi báo giá.
          </li>
        )}
      </ul>
    </section>
  );
}
