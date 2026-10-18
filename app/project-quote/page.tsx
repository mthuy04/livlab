import type { Metadata } from 'next';
import ProjectQuoteForm from '@/components/quote/ProjectQuoteForm';

export const metadata: Metadata = {
  title: 'Báo giá công trình',
  description: 'Lập danh sách vật tư và gửi yêu cầu báo giá công trình.',
};

export default function ProjectQuotePage() {
  return (
    <main className="min-h-screen bg-[#F1F7F8] pb-20">
      <header className="border-b border-[#D8E4E7] bg-white py-14 md:py-20">
        <div className="home-container">
          <p className="text-[11px] font-semibold tracking-[.16em] text-[color:var(--tenant-accent-ink)]">NHÀ THẦU · DOANH NGHIỆP · DỰ ÁN</p>
          <h1 className="mt-4 max-w-4xl text-[clamp(36px,5vw,62px)] font-medium leading-[1.04] text-[color:var(--tenant-ink)]">Yêu cầu báo giá công trình</h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#5E6A70]">Gửi nhu cầu theo hạng mục, quy cách, đơn vị và số lượng. Danh sách này là đầu vào trao đổi; giá chỉ chính thức khi được phát hành trong báo giá xác nhận.</p>
        </div>
      </header>
      <div className="home-container py-10 md:py-14"><ProjectQuoteForm /></div>
    </main>
  );
}
