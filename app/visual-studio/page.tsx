import { livlabPageMetadata } from '@/lib/seo/pageMetadata';
import type { Metadata } from 'next';
import VisualStudioClient from '@/components/visual-studio/VisualStudioClient';

export async function generateMetadata(): Promise<Metadata> {
  return livlabPageMetadata('/visual-studio', {
    title: 'Visual Studio - LivLab',
    description:
      'Ướm thử sản phẩm trực tiếp vào không gian phòng tắm của bạn. Trải nghiệm concept trực quan và ước tính ngân sách báo giá dễ dàng.',
  });
}

export default function VisualStudioPage() {
  return <VisualStudioClient />;
}