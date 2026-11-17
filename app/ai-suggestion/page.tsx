import { livlabPageMetadata } from '@/lib/seo/pageMetadata';
import BudgetFitSuggestion from '@/components/ai/BudgetFitSuggestion';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return livlabPageMetadata('/ai-suggestion', {
    title: 'Gợi ý AI thông minh | LivLab',
    description:
      'Gợi ý combo thiết bị phòng tắm vừa ngân sách bằng AI, kèm sản phẩm thật và giá tham khảo.',
  });
}

export default function AiSuggestionPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6 text-center mb-8">
        <h1 className="text-4xl font-extrabold text-[#0B1623] mb-4">Gợi ý AI Thông Minh</h1>
        <p className="text-lg text-[#627386]">
          LivLab AI sẽ dựa trên ngân sách và phong cách mong muốn của bạn để chọn ra Concept và bộ sản phẩm tối ưu nhất, không cần tốn thời gian tìm kiếm.
        </p>
      </div>
      <BudgetFitSuggestion />
    </main>
  );
}
