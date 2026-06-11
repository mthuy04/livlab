'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import { Search, Filter, Eye, Package } from 'lucide-react';

export default function ShowroomProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Showroom shares the same product catalog endpoint for now
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-[#627386]">Đang tải...</div>;
  }

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = filterCategory === 'All' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1623]">Sản phẩm quan tâm</h1>
          <p className="text-[#627386] text-sm mt-1">Danh sách sản phẩm được khách hàng quan tâm trên LivLab.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-[#D8E2EA] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#627386]" />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc thương hiệu..." 
            className="w-full pl-9 pr-4 py-2 border border-[#D8E2EA] rounded-xl text-sm outline-none focus:border-[#123C5A]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#627386]" />
          <select 
            className="px-4 py-2 border border-[#D8E2EA] rounded-xl text-sm outline-none focus:border-[#123C5A] bg-white"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'Tất cả danh mục' : c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[20px] border border-[#D8E3EC] shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-[#D8E2EA] mx-auto mb-4" />
            <p className="text-lg text-[#0B1623] font-bold">Catalogue trống</p>
            <p className="text-[#627386] text-sm mt-2">Chưa có sản phẩm nào trong database.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D8E2EA] bg-[#F3F7FA]">
                <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Hình ảnh</th>
                <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Tên sản phẩm</th>
                <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Thương hiệu</th>
                <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Mức giá</th>
                <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="border-b border-[#D8E2EA] hover:bg-[#F3F7FA] transition-colors">
                  <td className="px-6 py-4">
                    <img src={p.image || '/images/products/placeholder-sanitary.png'} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-[#EEF4F7]" />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[#0B1623]">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-[#627386]">{p.brand}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#123C5A]">{p.priceRange}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setViewProduct(p)} className="p-2 text-[#627386] hover:bg-[#D8E2EA] rounded-lg transition-colors" title="Xem chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1623]/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-fade-in-up">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-[#0B1623]">Chi tiết sản phẩm</h2>
                <button onClick={() => setViewProduct(null)} className="text-[#627386] hover:text-[#0B1623]">X</button>
              </div>
              <div className="flex gap-4 mb-6">
                <img src={viewProduct.image || '/images/products/placeholder-sanitary.png'} alt={viewProduct.name} className="w-24 h-24 rounded-xl object-cover bg-[#F3F7FA]" />
                <div>
                  <h3 className="font-bold text-[#0B1623]">{viewProduct.name}</h3>
                  <p className="text-sm text-[#627386]">{viewProduct.brand} • {viewProduct.category}</p>
                  <p className="text-lg font-bold text-[#C8A96A] mt-2">{viewProduct.priceRange}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#F8FAFC] border-t border-[#D8E2EA] flex justify-end">
              <button onClick={() => setViewProduct(null)} className="px-5 py-2.5 bg-white text-[#0B1623] border border-[#D8E2EA] font-semibold rounded-xl text-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
