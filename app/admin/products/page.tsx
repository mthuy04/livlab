'use client';

import { useEffect, useState } from 'react';
import { getStoredProducts, saveStoredProducts, deleteStoredProduct } from '@/lib/storage';
import { seedCatalogueFromCsvIfNeeded } from '@/lib/seedFromCsv';
import { seedVisualProducts } from '@/lib/visualCatalogueSeed';
import { products as initialProducts } from '@/lib/data';
import { Product } from '@/lib/types';
import { Plus, Trash2, Database, Download } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', brand: '', priceRange: '', image: '', category: 'Accessories' });

  useEffect(() => {
    const stored = getStoredProducts();
    if (stored) {
      setProducts(stored);
    } else {
      setProducts(initialProducts);
      saveStoredProducts(initialProducts);
    }
  }, []);

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
      const stored = getStoredProducts();
      setProducts(stored || []);
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

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    const updated = deleteStoredProduct(id);
    setProducts(updated);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.priceRange) return;
    const p: Product = {
      id: `p-${Date.now()}`,
      name: newProduct.name || '',
      brand: newProduct.brand || 'LivLab',
      priceRange: newProduct.priceRange || '',
      image: newProduct.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
      category: newProduct.category || 'Accessories',
      description: 'Sản phẩm mới',
      sku: `SKU-${Date.now()}`,
      priceMin: parseInt(newProduct.priceRange?.replace(/\D/g, '') || '0'),
      priceMax: parseInt(newProduct.priceRange?.replace(/\D/g, '') || '0'),
      material: '', finish: '', availability: 'In Stock', suitableFor: [],
      showroomName: 'LivLab', showroomLocation: '', showroomContact: '', sellerType: 'Partner',
      status: 'Còn hàng', imageVerified: false, sourceNote: '', features: [], technicalSpecs: []
    };
    const updated = [p, ...products];
    saveStoredProducts(updated);
    setProducts(updated);
    setShowAdd(false);
    setNewProduct({ name: '', brand: '', priceRange: '', image: '', category: 'Accessories' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
            {products.map((p) => (
              <tr key={p.id} className="border-b border-[#D8E2EA] hover:bg-[#F3F7FA] transition-colors">
                <td className="px-6 py-4">
                  <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-[#EEF4F7]" />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-[#0B1623]">{p.name}</td>
                <td className="px-6 py-4 text-sm text-[#627386]">{p.brand}</td>
                <td className="px-6 py-4 text-sm font-semibold text-[#123C5A]">{p.priceRange}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label="Xóa">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
