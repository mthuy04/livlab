'use client';

import { useState, useMemo, useEffect } from 'react';
import { products as defaultProducts } from '@/lib/data';
import { Product, ProductCategory } from '@/lib/types';
import { getStoredProducts, saveStoredProducts } from '@/lib/storage';
import { seedVisualProducts } from '@/lib/visualCatalogueSeed';
import { importVerifiedProductsFromCsv } from '@/lib/importVerifiedProducts';
import ProductCard from '@/components/products/ProductCard';
import QuickViewModal from '@/components/products/QuickViewModal';
import ComparisonDrawer from '@/components/products/ComparisonDrawer';
import { Search, X, GitCompare } from 'lucide-react';
import { getCompareIds, toggleCompareItem, saveCompareIds } from '@/lib/storage';

import { normalizeCategory } from '@/lib/categoryHelper';

const budgets = [
  { value: 'All', label: 'Tất cả ngân sách' },
  { value: 'u5',  label: 'Dưới 5 triệu' },
  { value: '5-15',label: '5–15 triệu' },
  { value: '15p', label: 'Trên 15 triệu' },
];

const availabilities = [
  { value: 'All',             label: 'Tất cả' },
  { value: 'In Stock',        label: 'Có sẵn' },
  { value: 'Made to Order',   label: 'Đặt trước' },
  { value: 'Limited Stock',   label: 'Sắp hết' },
];

export default function ProductsPage() {
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState<string>('All');
  const [budget, setBudget]         = useState('All');
  const [availability, setAvailability] = useState('All');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    importVerifiedProductsFromCsv(false).then((csvProducts) => {
      const current = csvProducts && csvProducts.length > 0 ? csvProducts : defaultProducts;
      console.log(`[LivLab] Products loaded: ${current.length}`);
      setProducts(current);
      const ids = getCompareIds();
      setCompareItems(current.filter(p => ids.includes(p.id)));
      setLoading(false);
    });
  }, []);

  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => cats.add(normalizeCategory(p.category)));
    const sorted = Array.from(cats).sort();
    return [
      { value: 'All', label: 'Tất cả' },
      ...sorted.map(c => ({ value: c, label: c }))
    ];
  }, [products]);

  const filtered = useMemo(() => products.filter((p) => {
    const matchSearch   = !search || (p.name && p.name.toLowerCase().includes(search.toLowerCase())) || (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = category === 'All' || normalizeCategory(p.category) === category;
    const matchBudget   =
      budget === 'All' ||
      (budget === 'u5'  && p.priceMax < 5_000_000) ||
      (budget === '5-15'&& p.priceMin >= 5_000_000 && p.priceMax <= 15_000_000) ||
      (budget === '15p' && p.priceMin > 15_000_000);
    const matchAvail    = availability === 'All' || p.availability === availability;
    return matchSearch && matchCategory && matchBudget && matchAvail;
  }), [products, search, category, budget, availability]);

  const handleToggleCompare = (product: Product) => {
    const res = toggleCompareItem(product.id);
    if (res.error) {
      alert(res.error);
    } else {
      setCompareItems(products.filter(p => res.ids.includes(p.id)));
    }
  };

  const hasFilters = search || category !== 'All' || budget !== 'All' || availability !== 'All';

  return (
    <div className="pt-16 bg-[#F3F7FA] min-h-screen">
      {/* Hero */}
      <div className="bg-[#EEF4F7] border-b border-[#D8E2EA] py-16 px-6 lg:px-10">
        <div className="max-w-8xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#C8A96A] font-medium mb-3">Danh mục sản phẩm</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-[#0B1623] mb-3">
            Mỗi sản phẩm, trong không gian thực tế.
          </h1>
          <p className="text-[#627386] max-w-xl text-base leading-relaxed">
            Duyệt danh mục sản phẩm được tuyển chọn và thêm trực tiếp vào yêu cầu báo giá của bạn.
          </p>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-10 py-10 pb-24">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[#D8E2EA] p-5 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#627386]" />
              <input
                type="text"
                placeholder="Tìm sản phẩm, thương hiệu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F3F7FA] border border-[#D8E2EA] rounded-xl text-sm text-[#0B1623] placeholder-text-muted/70 focus:outline-none focus:border-[#123C5A] transition-colors"
              />
            </div>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="px-4 py-2.5 bg-[#F3F7FA] border border-[#D8E2EA] rounded-xl text-sm text-[#0B1623] focus:outline-none focus:border-[#123C5A] cursor-pointer"
            >
              {budgets.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="px-4 py-2.5 bg-[#F3F7FA] border border-[#D8E2EA] rounded-xl text-sm text-[#0B1623] focus:outline-none focus:border-[#123C5A] cursor-pointer"
            >
              {availabilities.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#D8E2EA]">
            {dynamicCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  category === cat.value
                    ? 'bg-[#123C5A] text-white'
                    : 'bg-[#EEF4F7] text-[#627386] hover:bg-[#DCEBF5] hover:text-[#0B1623]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#627386]">
            <span className="font-semibold text-[#0B1623]">{filtered.length}</span> sản phẩm
          </p>
          <div className="flex items-center gap-3">
            {compareItems.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-[#123C5A] font-medium bg-[#EEF4F7] px-3 py-1.5 rounded-full">
                <GitCompare className="w-3.5 h-3.5" />
                {compareItems.length} đang so sánh
              </div>
            )}
            {hasFilters && (
              <button onClick={() => { setSearch(''); setCategory('All'); setBudget('All'); setAvailability('All'); }} className="flex items-center gap-1 text-xs text-[#C8A96A] hover:text-[#0B1623] transition-colors">
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickViewProduct}
                isComparing={!!compareItems.find((p) => p.id === product.id)}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in-up">
            {loading ? (
              <>
                <div className="w-10 h-10 border-4 border-[#EEF4F7] border-t-[#123C5A] rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#0B1623] mb-2">Đang tải danh mục sản phẩm...</h3>
                <p className="text-sm text-[#627386]">Đang đồng bộ dữ liệu từ hệ thống</p>
              </>
            ) : (
              <>
                <Search className="w-10 h-10 text-border mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#0B1623] mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-sm text-[#627386]">Hãy thử thay đổi bộ lọc</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />

      {/* Comparison Drawer */}
      {compareItems.length > 0 && (
        <ComparisonDrawer
          products={compareItems}
          onRemove={(id) => {
            const res = toggleCompareItem(id);
            setCompareItems(products.filter(p => res.ids.includes(p.id)));
          }}
          onClear={() => {
            saveCompareIds([]);
            setCompareItems([]);
          }}
        />
      )}
    </div>
  );
}
