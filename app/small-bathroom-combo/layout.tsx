import type { Metadata } from 'next';
import { livlabPageMetadata } from '@/lib/seo/pageMetadata';

export async function generateMetadata(): Promise<Metadata> {
  return livlabPageMetadata('/small-bathroom-combo', {
    title: 'Combo cải tạo phòng tắm nhỏ | LivLab',
    description:
      'Các combo thiết bị cho phòng tắm nhỏ: bồn cầu, lavabo, vòi và sen được chọn sẵn cho vừa diện tích và ngân sách.',
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
