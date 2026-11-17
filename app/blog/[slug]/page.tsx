import { blogArticles, getBlogArticleBySlug, getRelatedBlogArticles } from '@/lib/blogArticles';
import BlogDetailClient from './BlogDetailClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { livlabPageMetadata } from '@/lib/seo/pageMetadata';

export function generateStaticParams() {
  return blogArticles.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getBlogArticleBySlug((await params).slug);
  if (!post) return { title: 'Không tìm thấy bài viết | LivLab', robots: { index: false } };
  return livlabPageMetadata(`/blog/${post.slug}`, {
    title: `${post.title} | LivLab`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: 'article', images: post.image ? [{ url: post.image }] : undefined },
  });
}

export default async function BlogDetail({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = getBlogArticleBySlug(resolvedParams.slug);

  // A real 404, not a 200 page that says the article is missing.
  if (!post) notFound();

  const relatedPosts = getRelatedBlogArticles(post.slug);

  return <BlogDetailClient post={post} relatedPosts={relatedPosts} />;
}
