'use client';

import { useEffect, useState } from 'react';
import { seedCatalogueFromCsvIfNeeded } from '@/lib/seedFromCsv';
import { seedVisualProducts } from '@/lib/visualCatalogueSeed';
import { Product } from '@/lib/types';
import { Plus, Trash2, Search, Filter, Eye, EyeOff, Edit, Download } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', brand: '', priceRange: '', image: '', category: 'Accessories' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Không tải được dữ liệu từ database.');
      } else {
        setProducts(data.products || []);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm('Thao tác này sẽ nạp catalogue mẫu từ CSV. Dữ liệu hiện tại có thể được thay thế. Tiếp tục?')) return;
    try {
      const result = await seedCatalogueFromCsvIfNeeded(true);
      if (result.seeded) {
        setProducts(result.products);
        alert('Đã nạp catalogue mẫu thành công.');
      } else {
        alert('Đã nạp dữ liệu thành công.');
      }
    } catch (error) {
      console.error(error);
      alert('Có lỗi khi nạp dữ liệu. Vui lòng kiểm tra console.');
    }
  };

  const handleVisualSeed = async () => {
    if (!confirm('Thao tác này sẽ thay catalogue hiện tại bằng bộ sản phẩm có ảnh đúng danh mục và thông tin thương mại đầy đủ hơn. Tiếp tục?')) return;
    try {
      await seedVisualProducts(true);
      await fetchProducts();
      alert('Đã nạp catalogue thương mại thành công.');
    } catch (error) {
      console.error(error);
      alert('Có lỗi khi nạp dữ liệu.');
    }
  };

  const handleVerifiedSeed = async () => {
    if (!confirm('Thao tác này sẽ thay catalogue hiện tại bằng bộ sản phẩm verified từ CSV. Tiếp tục?')) return;
    try {
      const { importVerifiedProductsFromCsv } = await import('@/lib/importVerifiedProducts');
      const verifiedProducts = await importVerifiedProductsFromCsv(true);
      if (verifiedProducts && verifiedProducts.length > 0) {
        setProducts(verifiedProducts);
        alert('Đã nạp catalogue verified thành công.');
      } else {
        alert('Không tìm thấy dữ liệu hoặc có lỗi xảy ra.');
      }
    } catch (error) {
      console.error(error);
      alert('Có lỗi khi nạp dữ liệu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Có lỗi xảy ra.');
      }
    } catch (err) {
      alert('Có lỗi xảy ra.');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.priceRange) return;
    
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        await fetchProducts();
        setShowAdd(false);
        setNewProduct({ name: '', brand: '', priceRange: '', image: '', category: 'Accessories' });
      } else {
        alert('Có lỗi khi thêm sản phẩm.');
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    }
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = filterCategory === 'All' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  if (loading) return <div className="p-10 text-center text-[#627386]">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"><p className="font-bold">Lỗi</p><p className="text-sm">{error}</p></div>}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1623]">Quản lý sản phẩm</h1>
          <p className="text-sm text-[#627386] mt-1">Thêm, sửa, xóa danh mục sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleVerifiedSeed}
            className="w-full sm:w-auto px-4 py-2 bg-[#0B1623] hover:bg-[#123C5A] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Nạp catalogue verified
          </button>
          <button
            onClick={handleVisualSeed}
            className="w-full sm:w-auto px-4 py-2 bg-[#123C5A] hover:bg-[#0B1623] text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Dùng catalogue thương mại
          </button>
          <button
            onClick={handleSeed}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-[#D8E2EA] hover:bg-[#EEF4F7] text-[#123C5A] text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Catalogue lớn từ CSV
          </button>
        </div>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-[#123C5A] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#123C5A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Filters & Search */}
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

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl border border-[#D8E2EA] shadow-sm animate-fade-in-up">
          <h2 className="text-lg font-bold text-[#0B1623] mb-4">Thêm sản phẩm mới</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#627386] uppercase tracking-wider mb-2">Tên sản phẩm</label>
              <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-2 border border-[#D8E2EA] rounded-xl text-sm" placeholder="VD: Lavabo đặt bàn" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#627386] uppercase tracking-wider mb-2">Mức giá</label>
              <input required type="text" value={newProduct.priceRange} onChange={e => setNewProduct({...newProduct, priceRange: e.target.value})} className="w-full px-4 py-2 border border-[#D8E2EA] rounded-xl text-sm" placeholder="VD: 2.000.000đ" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#627386] uppercase tracking-wider mb-2">Thương hiệu</label>
              <input type="text" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} className="w-full px-4 py-2 border border-[#D8E2EA] rounded-xl text-sm" placeholder="VD: TOTO" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#627386] uppercase tracking-wider mb-2">Hình ảnh (URL)</label>
              <input type="text" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="w-full px-4 py-2 border border-[#D8E2EA] rounded-xl text-sm" placeholder="https://..." />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-semibold text-[#627386] hover:bg-[#F3F7FA] rounded-xl">Hủy</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-[#123C5A] text-white rounded-xl hover:bg-[#123C5A]">Lưu sản phẩm</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#D8E2EA] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#D8E2EA] bg-[#F3F7FA]">
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Hình ảnh</th>
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Tên sản phẩm</th>
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Thương hiệu</th>
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider">Mức giá</th>
              <th className="px-6 py-4 text-xs font-bold text-[#627386] uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id} className="border-b border-[#D8E2EA] hover:bg-[#F3F7FA] transition-colors">
                <td className="px-6 py-4">
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-[#EEF4F7]" />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-[#0B1623]">{p.name}</td>
                <td className="px-6 py-4 text-sm text-[#627386]">{p.brand}</td>
                <td className="px-6 py-4 text-sm font-semibold text-[#123C5A]">{p.priceRange}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setViewProduct(p)} className="p-2 text-[#627386] hover:bg-[#D8E2EA] rounded-lg transition-colors" title="Xem chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-[#627386] hover:bg-[#D8E2EA] rounded-lg transition-colors" title="Sửa">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-[#627386] hover:bg-[#D8E2EA] rounded-lg transition-colors" title="Ẩn/Hiện">
                      <EyeOff className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                <img src={viewProduct.image} alt={viewProduct.name} className="w-24 h-24 rounded-xl object-cover bg-[#F3F7FA]" />
                <div>
                  <h3 className="font-bold text-[#0B1623]">{viewProduct.name}</h3>
                  <p className="text-sm text-[#627386]">{viewProduct.brand} • {viewProduct.category}</p>
                  <p className="text-lg font-bold text-[#C8A96A] mt-2">{viewProduct.priceRange}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-[#F3F7FA] pb-2"><span className="text-[#627386]">Chất liệu</span><span className="font-medium text-[#0B1623]">{viewProduct.material || '—'}</span></div>
                <div className="flex justify-between border-b border-[#F3F7FA] pb-2"><span className="text-[#627386]">Màu sắc/Finish</span><span className="font-medium text-[#0B1623]">{viewProduct.finish || '—'}</span></div>
                <div className="flex justify-between border-b border-[#F3F7FA] pb-2"><span className="text-[#627386]">Tình trạng</span><span className="font-medium text-[#0B1623]">{viewProduct.availability}</span></div>
                <div className="flex justify-between border-b border-[#F3F7FA] pb-2"><span className="text-[#627386]">Showroom</span><span className="font-medium text-[#0B1623]">{viewProduct.showroomName || '—'}</span></div>
                <div className="flex justify-between pb-2"><span className="text-[#627386]">Source URL</span><span className="font-medium text-blue-600 truncate max-w-[200px]">{viewProduct.sourceUrl ? <a href={viewProduct.sourceUrl} target="_blank" rel="noreferrer">Xem link</a> : '—'}</span></div>
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
