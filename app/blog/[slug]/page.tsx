import { blogArticles, getBlogArticleBySlug, getRelatedBlogArticles } from '@/lib/blogArticles';
import BlogDetailClient from './BlogDetailClient';
import { notFound } from 'next/navigation';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export function generateStaticParams() {
  return blogArticles.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = getBlogArticleBySlug(resolvedParams.slug);

  if (!post) {
    return (
      <div className="pt-32 pb-20 bg-[#F3F7FA] min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FileQuestion className="w-10 h-10 text-[#627386]" />
          </div>
          <h1 className="text-3xl font-bold text-[#0B1623] mb-4">Không tìm thấy bài viết</h1>
          <p className="text-[#627386] mb-8 max-w-md mx-auto">
            Bài viết bạn đang tìm kiếm có thể đã bị xoá hoặc đường dẫn không chính xác.
          </p>
          <Link href="/blog" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#123C5A] text-white font-bold rounded-full hover:bg-[#0B1623] transition-colors">
            Quay lại Cẩm nang
          </Link>
        </div>
      </div>
    );
  }

  const relatedPosts = getRelatedBlogArticles(post.slug);

  return <BlogDetailClient post={post} relatedPosts={relatedPosts} />;
}
