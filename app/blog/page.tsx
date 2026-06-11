import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { blogArticles } from '@/lib/blogArticles';
import BlogImageFallback from '@/components/blog/BlogImageFallback';

export const metadata = {
  title: 'Cẩm nang - LivLab',
  description: 'Góc chia sẻ kinh nghiệm thiết kế, lựa chọn thiết bị vệ sinh và cải tạo phòng tắm.',
};

export default function BlogPage() {
  return (
    <div className="pt-24 pb-20 bg-[#F3F7FA] min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#D8E2EA] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-[#123C5A]" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#0B1623] mb-6">Cẩm nang LivLab</h1>
          <p className="text-[#627386] text-lg">
            Kinh nghiệm thiết kế, cải tạo và lựa chọn thiết bị vệ sinh tối ưu ngân sách.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogArticles.map(article => (
            <Link key={article.slug} href={`/blog/${article.slug}`} className="group bg-white rounded-3xl border border-[#D8E2EA] overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] bg-[#EEF4F7] overflow-hidden relative">
                {article.image && (
                  <BlogImageFallback 
                    src={article.image} 
                    alt={article.title} 
                    category={article.category} 
                    title={article.title}
                    className="group-hover:scale-105 transition-transform duration-500" 
                  />
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#0B1623]">
                  {article.category}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-4 text-xs text-[#627386] mb-3">
                  <span>{article.date}</span>
                  <span className="w-1 h-1 rounded-full bg-[#D8E2EA]"></span>
                  <span>{article.readingTime}</span>
                </div>
                <h2 className="text-xl font-bold text-[#0B1623] mb-3 group-hover:text-[#C8A96A] transition-colors line-clamp-2">
                  {article.title}
                </h2>
                <p className="text-sm text-[#627386] mb-6 line-clamp-3 flex-1">
                  {article.excerpt}
                </p>
                <div className="mt-auto flex items-center gap-2 text-sm font-bold text-[#123C5A] group-hover:text-[#C8A96A] transition-colors">
                  Đọc bài viết <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
