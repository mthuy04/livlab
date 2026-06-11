'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, LayoutGrid, Lightbulb, Wallet, ArrowRight, FileQuestion } from 'lucide-react';
import { BlogArticle } from '@/lib/blogArticles';
import { useState, useEffect } from 'react';
import { Product, Concept } from '@/lib/types';
import ProductCard from '@/components/products/ProductCard';
import ConceptCard from '@/components/concepts/ConceptCard';
import { getStoredProducts, getStoredConcepts } from '@/lib/storage';
import BlogImageFallback from '@/components/blog/BlogImageFallback';

interface BlogDetailClientProps {
  post: BlogArticle;
  relatedPosts: BlogArticle[];
}

export default function BlogDetailClient({ post, relatedPosts }: BlogDetailClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProducts(getStoredProducts() || []);
    setConcepts(getStoredConcepts() || []);
    setMounted(true);
  }, []);

  // Filter Related Concepts
  const relatedConcepts = concepts
    .filter(c => c.roomType === 'Bathroom')
    .slice(0, 3);

  // Helper to normalize category
  const normalizeCategory = (cat: string) => {
    const l = cat.toLowerCase();
    if (l.includes('lavabo') || l.includes('chậu rửa')) return 'lavabo';
    if (l.includes('vòi lavabo') || l.includes('vòi rửa') || l.includes('faucet')) return 'faucet';
    if (l.includes('gương') || l.includes('mirror')) return 'mirror';
    if (l.includes('bồn cầu') || l.includes('toilet')) return 'toilet';
    if (l.includes('sen tắm') || l.includes('sen cây') || l.includes('shower')) return 'shower';
    if (l.includes('tủ lavabo') || l.includes('vanity') || l.includes('cabinet')) return 'vanity';
    if (l.includes('gạch') || l.includes('tile')) return 'tile';
    if (l.includes('đèn') || l.includes('lighting')) return 'lighting';
    return 'accessory';
  };

  const pickProduct = (
    prods: Product[], 
    normCat: string, 
    options: { preferBudget?: 'low' | 'mid' | 'premium', excludeIds?: Set<string> } = {}
  ): Product | null => {
    let filtered = prods.filter(p => normalizeCategory(p.category) === normCat);
    if (options.excludeIds) {
      filtered = filtered.filter(p => !options.excludeIds!.has(p.id));
    }
    // Sort by image presence
    filtered.sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0));
    
    if (filtered.length === 0) return null;

    if (options.preferBudget) {
      filtered.sort((a, b) => {
        if (options.preferBudget === 'low') return a.priceMin - b.priceMin;
        if (options.preferBudget === 'premium') return b.priceMin - a.priceMin;
        // mid: close to median or just take middle element
        return 0;
      });
      if (options.preferBudget === 'mid') {
        return filtered[Math.floor(filtered.length / 2)];
      }
    }
    return filtered[0];
  };

  const getRelatedProductsForArticle = (slug: string, prods: Product[]): Product[] => {
    const selected: Product[] = [];
    const excluded = new Set<string>();

    const addProduct = (normCat: string, budget?: 'low' | 'mid' | 'premium') => {
      const p = pickProduct(prods, normCat, { preferBudget: budget, excludeIds: excluded });
      if (p) {
        selected.push(p);
        excluded.add(p.id);
      }
    };

    if (slug.includes('checklist-cai-tao-phong-tam-can-ho-cho-thue')) {
      addProduct('lavabo', 'low');
      addProduct('faucet', 'low');
      addProduct('toilet', 'low');
      addProduct('shower', 'low');
      addProduct('mirror', 'low');
      addProduct('accessory', 'low');
    } else if (slug.includes('combo-phong-tam-duoi-30-trieu-gom-nhung-gi')) {
      addProduct('lavabo', 'low');
      addProduct('faucet', 'low');
      addProduct('mirror', 'low');
      addProduct('toilet', 'low');
      addProduct('shower', 'low');
      addProduct('accessory', 'low');
    } else if (slug.includes('cach-phoi-lavabo-voi-guong-va-voi-rua')) {
      addProduct('lavabo', 'mid');
      addProduct('faucet', 'mid');
      addProduct('mirror', 'mid');
      addProduct('vanity', 'mid');
      addProduct('accessory', 'mid');
    } else if (slug.includes('5-loi-khi-mua-thiet-bi-ve-sinh-cho-phong-tam-nho')) {
      addProduct('lavabo', 'mid'); // compact lavabo ideally
      addProduct('faucet', 'mid');
      addProduct('mirror', 'mid');
      addProduct('toilet', 'mid');
      addProduct('shower', 'mid');
      addProduct('accessory', 'mid');
    } else if (slug.includes('vi-sao-nen-xem-concept-truoc-khi-xin-bao-gia')) {
      addProduct('lavabo', 'premium');
      addProduct('faucet', 'premium');
      addProduct('mirror', 'premium');
      addProduct('toilet', 'premium');
      addProduct('shower', 'premium');
      addProduct('tile', 'premium');
    } else {
      // Fallback
      addProduct('lavabo');
      addProduct('faucet');
      addProduct('toilet');
      addProduct('shower');
    }
    
    // If we missed some due to lack of category, fill up with anything not excluded
    if (selected.length < 4) {
      for (const p of prods) {
        if (!excluded.has(p.id)) {
          selected.push(p);
          excluded.add(p.id);
          if (selected.length >= 4) break;
        }
      }
    }
    
    return selected;
  };

  const relatedProducts = getRelatedProductsForArticle(post.slug, products);

  // Intro text for related products section
  const getProductIntro = (slug: string) => {
    if (slug.includes('checklist-cai-tao-phong-tam-can-ho-cho-thue')) {
      return 'Các sản phẩm dưới đây được gợi ý để hoàn thiện nhóm thiết bị cơ bản cho phòng tắm dễ bảo trì.';
    }
    if (slug.includes('combo-phong-tam-duoi-30-trieu-gom-nhung-gi')) {
      return 'Nhóm sản phẩm tham khảo giúp bạn ước lượng nhanh ngân sách cho một combo phòng tắm nhỏ.';
    }
    return 'Các sản phẩm được tuyển chọn để giúp bạn hoàn thiện không gian theo đúng định hướng thiết kế.';
  };

  return (
    <div className="pt-24 pb-20 bg-[#F3F7FA] min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-[#627386] hover:text-[#0B1623] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Trở về cẩm nang
        </Link>
        
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* LEFT COLUMN: ARTICLE */}
          <div className="lg:w-2/3">
            <div className="mb-10">
              <span className="inline-block px-3 py-1 bg-[#EEF4F7] text-[#123C5A] rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                {post.category}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B1623] leading-tight mb-6">{post.title}</h1>
              <p className="text-lg text-[#627386] mb-6 leading-relaxed">{post.excerpt}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#627386]">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {post.date}</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {post.readingTime}</span>
                <div className="flex gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[#123C5A] font-medium">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {post.image && (
              <div className="rounded-3xl overflow-hidden aspect-[16/9] mb-12 shadow-sm border border-[#D8E2EA]">
                <BlogImageFallback src={post.image} alt={post.title} category={post.category} title={post.title} />
              </div>
            )}

            <article className="prose prose-lg prose-headings:font-bold prose-headings:text-[#0B1623] prose-p:text-[#627386] prose-p:leading-relaxed prose-li:text-[#627386] prose-a:text-[#C8A96A] max-w-none mb-16">
              {post.content.map((section, idx) => (
                <div key={idx} className="mb-10">
                  <h2 className="text-2xl font-bold text-[#0B1623] mb-4">{section.heading}</h2>
                  {section.body.map((para, pIdx) => (
                    <p key={pIdx} className="mb-5">{para}</p>
                  ))}
                  {section.bullets && section.bullets.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl border border-[#D8E2EA] my-6">
                      <ul className="list-disc pl-5 m-0 space-y-2">
                        {section.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="m-0">{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </article>

            {/* Related Products */}
            {mounted && relatedProducts.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-bold text-[#0B1623] mb-2">Sản phẩm liên quan</h3>
                <p className="text-[#627386] mb-6">{getProductIntro(post.slug)}</p>
                <div className="grid grid-cols-2 gap-4">
                  {relatedProducts.map(prod => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              </div>
            )}

            {/* Related Concepts */}
            {mounted && relatedConcepts.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-bold text-[#0B1623] mb-6">Concept bạn có thể tham khảo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedConcepts.map(c => (
                    <ConceptCard key={c.id} concept={c} />
                  ))}
                </div>
              </div>
            )}

            {/* CTA Block */}
            <div className="bg-[#EEF4F7] border border-[#DCEBF5] rounded-3xl p-8 lg:p-10 text-center mb-16">
              <h3 className="text-2xl font-bold text-[#0B1623] mb-4">Muốn chọn sản phẩm phù hợp với phòng tắm của bạn?</h3>
              <p className="text-[#123C5A] mb-8 max-w-xl mx-auto">
                LivLab giúp bạn xem concept, so sánh nhóm sản phẩm và gửi yêu cầu báo giá theo ngân sách thực tế.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/concepts" className="w-full sm:w-auto px-6 py-3.5 bg-white text-[#0B1623] border border-[#D8E2EA] font-bold rounded-xl hover:bg-[#F3F7FA] transition-colors flex items-center justify-center gap-2">
                  <LayoutGrid className="w-4 h-4" /> Khám phá concept
                </Link>
                <Link href="/suggestion" className="w-full sm:w-auto px-6 py-3.5 bg-white text-[#0B1623] border border-[#D8E2EA] font-bold rounded-xl hover:bg-[#F3F7FA] transition-colors flex items-center justify-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Nhận gợi ý theo ngân sách
                </Link>
                <Link href="/quote" className="w-full sm:w-auto px-6 py-3.5 bg-[#123C5A] text-white font-bold rounded-xl hover:bg-[#0B1623] transition-colors flex items-center justify-center gap-2">
                  <Wallet className="w-4 h-4" /> Yêu cầu báo giá
                </Link>
              </div>
            </div>

            {/* Related Articles */}
            {relatedPosts.length > 0 && (
              <div className="border-t border-[#D8E2EA] pt-12">
                <h3 className="text-2xl font-bold text-[#0B1623] mb-8">Bài viết liên quan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedPosts.slice(0, 2).map((relPost) => (
                    <Link key={relPost.slug} href={`/blog/${relPost.slug}`} className="group bg-white rounded-2xl p-6 border border-[#D8E2EA] hover:shadow-md transition-all h-full flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A96A] mb-3 block">
                        {relPost.category}
                      </span>
                      <h4 className="text-lg font-bold text-[#0B1623] mb-3 group-hover:text-[#123C5A] line-clamp-2">
                        {relPost.title}
                      </h4>
                      <p className="text-sm text-[#627386] mb-6 line-clamp-2 flex-1">
                        {relPost.excerpt}
                      </p>
                      <div className="mt-auto flex items-center gap-2 text-sm font-bold text-[#123C5A] group-hover:text-[#C8A96A] transition-colors">
                        Đọc tiếp <ArrowRight className="w-4 h-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: STICKY SIDEBAR */}
          <div className="lg:w-1/3 hidden lg:block">
            <div className="sticky top-32 space-y-8">
              
              {/* Concept Liên Quan */}
              {mounted && relatedConcepts.length > 0 && (
                <div className="bg-white p-6 rounded-3xl border border-[#D8E2EA]">
                  <h3 className="font-bold text-[#0B1623] mb-4">Concept liên quan</h3>
                  <div className="space-y-4">
                    {relatedConcepts.slice(0, 2).map(c => (
                      <Link key={c.id} href={`/concepts/${c.slug}`} className="group flex gap-4 items-center">
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#F3F7FA]">
                          <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0B1623] group-hover:text-[#C8A96A] transition-colors line-clamp-2 mb-1">{c.title}</p>
                          <p className="text-xs text-[#627386]">{c.budgetRange}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Combo CTA */}
              <div className="bg-[#0B1623] p-6 rounded-3xl text-white">
                <h3 className="font-bold mb-2">Combo cải tạo phòng tắm nhỏ</h3>
                <p className="text-sm text-white/70 mb-6">Chọn nhanh nhóm sản phẩm theo diện tích, ngân sách và phong cách.</p>
                <Link href="/small-bathroom-combo" className="block text-center w-full py-3 bg-[#123C5A] hover:bg-[#0D2B42] text-white font-bold rounded-xl transition-colors">
                  Khám phá combo
                </Link>
              </div>

              {/* Quick Quote CTA */}
              <div className="bg-white p-6 rounded-3xl border border-[#D8E2EA]">
                <h3 className="font-bold text-[#0B1623] mb-4">Cần báo giá nhanh?</h3>
                <div className="space-y-3">
                  <Link href="/quote" className="block text-center w-full py-3 bg-[#123C5A] hover:bg-[#0B1623] text-white font-bold rounded-xl transition-colors">
                    Yêu cầu báo giá
                  </Link>
                  <Link href="/suggestion" className="block text-center w-full py-3 bg-[#F3F7FA] hover:bg-[#EEF4F7] text-[#123C5A] font-bold rounded-xl transition-colors">
                    Nhận gợi ý ngân sách
                  </Link>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
