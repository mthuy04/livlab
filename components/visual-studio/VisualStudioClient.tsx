'use client';

import { useState, useEffect, useMemo } from 'react';
import { Product, Concept } from '@/lib/types';
import { getStoredProducts, getStoredConcepts } from '@/lib/storage';
import { useQuote } from '@/lib/context/QuoteContext';
import { 
  VSPreferences, 
  StudioLayer,
  getDefaultPosition,
  pickProductByNormalizedCategory,
  normalizeCategory
} from '@/lib/visualStudioHelpers';
import VisualCanvas2D from './VisualCanvas2D';
import ProductRoom3D from './ProductRoom3D';
import { Sparkles, Maximize2, Cuboid, CheckCircle, Upload, Plus, Trash2, Wallet, ImageIcon, Image as LucideImage } from 'lucide-react';
import Link from 'next/link';
import { livlabImages } from '@/lib/livlabImages';
import SafeImage from '@/components/ui/SafeImage';

const REQUIRED_CATEGORIES = ['lavabo', 'faucet', 'mirror', 'toilet', 'shower', 'accessory'];

export default function VisualStudioClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<VSPreferences>({
    area: '4–6m²',
    budget: '30–60 triệu',
    styles: ['Modern'],
    needs: []
  });
  
  const [layers, setLayers] = useState<StudioLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'2d' | '3d'>('2d');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');

  const { addItem } = useQuote();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    setProducts(getStoredProducts() || []);
    setConcepts(getStoredConcepts() || []);

    // Clear old background removal caches as requested
    const caches = [
      'livlab_bg_removed_images_v1',
      'livlab_bg_removed_images_v2',
      'livlab_bg_removed_images_v3',
      'livlab_ai_mask_cache',
      'livlab_bg_mask_cache'
    ];
    caches.forEach(c => localStorage.removeItem(c));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setBgImageUrl(url);
      } else {
        triggerToast('Vui lòng chọn file hình ảnh hợp lệ.');
      }
    }
  };

  const handleSelectSampleRoom = (concept: Concept) => {
    if (concept.image) {
      setBgImageUrl(concept.image);
      setPreferences(prev => ({
        ...prev,
        budget: concept.budgetRange || prev.budget,
        styles: concept.style ? [concept.style] : prev.styles
      }));
    }
  };

  const generateCombo = () => {
    let budgetTarget: 'low' | 'mid' | 'premium' = 'mid';
    if (preferences.budget.includes('Dưới 30')) budgetTarget = 'low';
    if (preferences.budget.includes('Trên 60')) budgetTarget = 'premium';

    const newLayers: StudioLayer[] = [];
    const excludeIds = new Set<string>();

    let z = 10;
    REQUIRED_CATEGORIES.forEach(cat => {
      const p = pickProductByNormalizedCategory(products, cat, {
        preferBudget: budgetTarget,
        styles: preferences.styles,
        excludeIds,
        preferImage: true
      });
      if (p) {
        const defaultPos = getDefaultPosition(cat);
        newLayers.push({
          id: `layer_${Date.now()}_${p.id}_${Math.random()}`,
          productId: p.id,
          category: cat,
          x: defaultPos.x,
          y: defaultPos.y,
          width: Math.max(45, Math.min(240, defaultPos.width)),
          scale: (defaultPos as any).scale || 1.0,
          rotation: 0,
          zIndex: z++,
          opacity: 1
        });
        excludeIds.add(p.id);
      }
    });

    return newLayers;
  };

  const handleApplyCombo = () => {
    const combo = generateCombo();
    setLayers(combo);
    setSelectedLayerId(null);
    triggerToast('Đã áp dụng combo gợi ý vào không gian.');
  };

  const handleAddProduct = (product: Product) => {
    const cat = normalizeCategory(product.category);
    const defaultPos = getDefaultPosition(cat);
    
    // Check if category exists to slightly offset
    const existingCount = layers.filter(l => l.category === cat).length;
    const offset = existingCount * 3;

    const isWhiteCeramic = ['lavabo', 'chậu', 'bồn cầu', 'toilet'].some(kw => product.name.toLowerCase().includes(kw) || product.category.toLowerCase().includes(kw));

    const newLayer: StudioLayer = {
      id: `layer_${Date.now()}_${product.id}`,
      productId: product.id,
      category: cat,
      x: Math.min(95, defaultPos.x + offset),
      y: Math.min(95, defaultPos.y + offset),
      width: Math.max(45, Math.min(260, defaultPos.width)),
      scale: (defaultPos as any).scale || 1.0,
      rotation: 0,
      zIndex: layers.length > 0 ? Math.max(...layers.map(l => l.zIndex)) + 1 : 10,
      opacity: 1,
      safeBlend: false,
      blendMode: 'normal'
    };

    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
    setActiveTab('2d');
    triggerToast('Đã thêm sản phẩm vào không gian.');
  };

  const handleUpdateLayer = (id: string, updates: Partial<StudioLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleRemoveLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const handleClearCanvas = () => {
    setLayers([]);
    setSelectedLayerId(null);
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      category: product.category,
      brand: product.brand,
      priceMin: product.priceMin,
      priceMax: product.priceMax,
      priceRange: product.priceRange,
      quantity: 1,
      image: product.image
    } as any);
    triggerToast('Đã thêm sản phẩm vào giỏ báo giá.');
  };

  const handleAddAllToCart = () => {
    const productsToAdd = layers.length > 0 
      ? layers.map(l => products.find(p => p.id === l.productId)).filter(Boolean) as Product[]
      : generateCombo().map(l => products.find(p => p.id === l.productId)).filter(Boolean) as Product[];
    
    const uniqueIds = new Set<string>();
    
    productsToAdd.forEach(product => {
      if (!uniqueIds.has(product.id)) {
        uniqueIds.add(product.id);
        addItem({
          productId: product.id,
          name: product.name,
          category: product.category,
          brand: product.brand,
          priceMin: product.priceMin,
          priceMax: product.priceMax,
          priceRange: product.priceRange,
          quantity: 1,
          image: product.image
        } as any);
      }
    });
    triggerToast(`Đã lưu ${uniqueIds.size} sản phẩm vào giỏ báo giá.`);
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const toggleStyle = (style: string) => {
    setPreferences(p => ({
      ...p,
      styles: p.styles.includes(style) ? p.styles.filter(s => s !== style) : [style]
    }));
  };

  const bathroomConcepts = concepts.filter(c => c.roomType?.toLowerCase().includes('phòng tắm') || c.roomType?.toLowerCase().includes('bathroom')).slice(0, 6);

  const panelProducts = useMemo(() => {
    let sorted = [...products].sort((a, b) => (b.image ? 1 : 0) - (a.image ? 1 : 0));
    if (activeCategoryTab !== 'all') {
      sorted = sorted.filter(p => normalizeCategory(p.category) === activeCategoryTab);
    }
    return sorted.slice(0, 50);
  }, [products, activeCategoryTab]);

  const placedProductsData = layers.map(l => products.find(p => p.id === l.productId)).filter(Boolean) as Product[];
  const selectedProductData = selectedLayerId 
    ? products.find(p => p.id === layers.find(l => l.id === selectedLayerId)?.productId)
    : null;

  let currentMin = 0;
  let currentMax = 0;
  const listToPrice = placedProductsData.length > 0 ? placedProductsData : generateCombo().map(l => products.find(p => p.id === l.productId)).filter(Boolean) as Product[];
  listToPrice.forEach(p => {
    currentMin += p.priceMin || 0;
    currentMax += p.priceMax || p.priceMin || 0;
  });

  const formatPrice = (val: number) => {
    if (val === 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
  };

  return (
    <div className="pt-24 pb-32 bg-[#F3F7FA] min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        
        <div className="mb-6 md:mb-10 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold text-[#0B1623] mb-4">LivLab Visual Studio</h1>
          <p className="text-[#627386] text-lg">
            Tải ảnh phòng tắm hiện tại hoặc chọn không gian mẫu, sau đó kéo thả sản phẩm để ướm thử concept và ước lượng ngân sách trước khi gửi yêu cầu báo giá.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 items-start">
          
          {/* LEFT PANEL: UPLOAD & PREFS */}
          <div className="w-full xl:w-[280px] shrink-0 flex flex-col gap-6">
            
            <div className="bg-white p-5 rounded-3xl border border-[#D8E2EA] shadow-sm">
              <h2 className="font-bold text-[#0B1623] mb-4">Nguồn không gian</h2>
              
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#C8A96A]/50 bg-[#F3F7FA] hover:bg-[#EEF4F7] rounded-2xl p-5 cursor-pointer transition-colors mb-4 group">
                <Upload className="w-5 h-5 text-[#C8A96A] mb-2" />
                <span className="text-sm font-bold text-[#0B1623]">Tải ảnh phòng tắm</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>

              <p className="text-xs font-bold text-[#627386] mb-2">Hoặc chọn không gian mẫu:</p>
              <div className="grid grid-cols-2 gap-2">
                {bathroomConcepts.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => handleSelectSampleRoom(c)}
                    className="relative aspect-square rounded-xl overflow-hidden group border border-[#D8E2EA] hover:border-[#123C5A]"
                  >
                    <SafeImage src={c.image || livlabImages.visualStudio.sampleRoom} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" fallbackLabel={c.title} />
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1">
                      <span className="text-[9px] font-bold text-white line-clamp-1">{c.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#D8E2EA] shadow-sm">
              <h2 className="font-bold text-[#0B1623] mb-4">Tiêu chí thiết kế</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#627386] mb-1.5 uppercase">Ngân sách</label>
                  <select 
                    value={preferences.budget}
                    onChange={e => setPreferences({...preferences, budget: e.target.value})}
                    className="w-full p-2 rounded-xl border border-[#D8E2EA] bg-[#F3F7FA] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#123C5A]"
                  >
                    <option>Dưới 30 triệu</option>
                    <option>30–60 triệu</option>
                    <option>Trên 60 triệu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#627386] mb-1.5 uppercase">Phong cách</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Japandi', 'Minimal', 'Modern', 'Hotel'].map(style => (
                      <button 
                        key={style}
                        onClick={() => toggleStyle(style)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${preferences.styles.includes(style) ? 'bg-[#123C5A] text-white border-[#123C5A]' : 'bg-white text-[#627386] border-[#D8E2EA]'}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#D8E2EA] space-y-2">
                  <button 
                    onClick={handleApplyCombo}
                    className="w-full py-2.5 bg-[#123C5A] hover:bg-[#1f2d23] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> Đưa combo gợi ý vào không gian
                  </button>
                  <button 
                    onClick={handleClearCanvas}
                    disabled={layers.length === 0}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Xóa canvas
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* CENTER: CANVAS & 3D */}
          <div className="flex-1 w-full flex flex-col gap-6">
            <div className="bg-white p-2 rounded-[2rem] border border-[#D8E2EA] shadow-sm flex flex-col relative z-0">
              <div className="flex items-center justify-between px-4 pt-2 pb-4 shrink-0">
                <div className="flex w-full border-b border-[#D8E2EA]">
                  <button 
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === '2d' ? 'border-[#123C5A] text-[#123C5A]' : 'border-transparent text-[#627386] hover:text-[#0B1623]'}`}
                    onClick={() => setActiveTab('2d')}
                  >
                    Phối cảnh 2D
                  </button>
                  <button 
                    onClick={() => setActiveTab('3d')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === '3d' ? 'border-[#123C5A] text-[#123C5A]' : 'border-transparent text-[#627386] hover:text-[#0B1623]'}`}
                  >
                    Studio 3D sản phẩm
                  </button>
                </div>
              </div>

              {activeTab === '2d' ? (
                <VisualCanvas2D 
                  backgroundImageUrl={bgImageUrl}
                  layers={layers}
                  productsData={products}
                  onUpdateLayer={handleUpdateLayer}
                  onRemoveLayer={handleRemoveLayer}
                  onSelectLayer={setSelectedLayerId}
                  selectedLayerId={selectedLayerId}
                />
              ) : (
                <ProductRoom3D 
                  placedProducts={layers}
                  productsData={products}
                />
              )}
            </div>

            {/* Selected Layer Info Card (Desktop Center-Bottom or right) */}
            {selectedProductData && (
              <div className="bg-[#0B1623] text-white p-4 rounded-3xl shadow-lg flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1">
                  {selectedProductData.image ? (
                    <img src={selectedProductData.image} className="max-w-full max-h-full object-contain mix-blend-screen" />
                  ) : <LucideImage className="w-6 h-6 text-white/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[#DCEBF5] uppercase font-bold">{selectedProductData.category}</span>
                  <h4 className="font-bold text-sm line-clamp-1">{selectedProductData.name}</h4>
                  <p className="text-[#C8A96A] text-xs font-bold mt-0.5">{selectedProductData.priceRange}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleAddToCart(selectedProductData)} className="px-4 py-2 bg-[#123C5A] hover:bg-[#0D2B42] rounded-xl text-xs font-bold transition-colors">
                    Thêm vào giỏ
                  </button>
                  <button onClick={() => handleRemoveLayer(selectedLayerId!)} className="p-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: PRODUCT LIBRARY */}
          <div className="w-full xl:w-[320px] shrink-0 bg-white rounded-3xl border border-[#D8E2EA] shadow-sm overflow-hidden flex flex-col h-[70vh] xl:h-auto xl:max-h-[800px]">
            <div className="p-4 border-b border-[#D8E2EA] bg-[#F3F7FA] shrink-0">
              <h3 className="font-bold text-lg text-[#0B1623] mb-3">Thư viện sản phẩm</h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'lavabo', label: 'Lavabo' },
                  { id: 'toilet', label: 'Bồn cầu' },
                  { id: 'shower', label: 'Sen tắm' },
                  { id: 'faucet', label: 'Vòi' },
                  { id: 'mirror', label: 'Gương' },
                  { id: 'accessory', label: 'Phụ kiện' },
                  { id: 'tile', label: 'Gạch / Vật liệu' },
                  { id: 'vanity', label: 'Tủ Lavabo' }
                ].map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategoryTab(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${activeCategoryTab === cat.id ? 'bg-[#123C5A] text-white border-[#123C5A]' : 'bg-white text-[#627386] border-[#D8E2EA] hover:bg-[#EEF4F7]'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
              {panelProducts.map(prod => {
                const isPlaced = layers.some(l => l.productId === prod.id);
                return (
                  <div key={prod.id} className="border border-[#D8E2EA] hover:border-[#123C5A]/50 rounded-2xl p-3 flex flex-col gap-3 transition-colors group">
                    <div className="flex gap-3">
                      <div className="w-[72px] h-[72px] shrink-0 bg-[#EEF4F7] rounded-xl overflow-hidden border border-[#D8E2EA]/50">
                        {prod.image ? (
                          <img src={prod.image} className="w-full h-full object-contain p-1 mix-blend-multiply" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-[8px] font-bold text-[#627386] uppercase text-center ${prod.image ? 'hidden' : ''}`}>
                          {prod.category}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-[#627386] uppercase tracking-wider mb-0.5 block truncate">{prod.category} • {prod.brand}</span>
                        <h4 className="font-bold text-[#0B1623] text-sm line-clamp-2 mb-1 leading-snug" title={prod.name}>{prod.name}</h4>
                        <p className="text-[#C8A96A] font-bold text-sm truncate">{prod.priceRange}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1.5 shrink-0 mt-auto pt-2 border-t border-[#EEF4F7]">
                      <button 
                        onClick={() => !isPlaced ? handleAddProduct(prod) : null}
                        className={`flex-1 h-[42px] px-1 rounded-xl text-[10px] sm:text-[11px] font-semibold transition-colors ${isPlaced ? 'bg-[#EEF4F7] text-[#627386] cursor-default' : 'bg-[#0B3A55] text-white hover:bg-[#082B40] opacity-90 hover:opacity-100'}`}
                      >
                        {isPlaced ? 'Đã thêm' : 'Đưa vào không gian'}
                      </button>
                      <button 
                        onClick={() => handleAddToCart(prod)} 
                        className="px-2.5 h-[42px] border border-[#D8E2EA] bg-white rounded-xl text-[#0B3A55] text-[10px] sm:text-[11px] font-semibold hover:bg-[#EEF4F7]"
                        title="Thêm vào giỏ"
                      >
                        Giỏ
                      </button>
                      <a 
                        href={`/products/${prod.id}`}
                        target="_blank"
                        className="px-2.5 h-[42px] border border-[#D8E2EA] bg-white rounded-xl flex items-center justify-center text-[#0B3A55] text-[10px] sm:text-[11px] font-semibold hover:bg-[#EEF4F7]"
                        title="Xem chi tiết"
                      >
                        Xem
                      </a>
                    </div>
                  </div>
                );
              })}
              {panelProducts.length === 0 && (
                <div className="text-center text-sm text-[#627386] py-8">Không có sản phẩm trong danh mục này.</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Budget Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D8E2EA] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 bg-[#EEF4F7] rounded-full flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-[#123C5A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0B1623] text-lg">
                  {formatPrice(currentMin)} - {formatPrice(currentMax)}
                </span>
                <span className="text-xs bg-[#DCEBF5] text-[#123C5A] px-2 py-0.5 rounded font-bold">{layers.length} sản phẩm</span>
              </div>
              <p className="text-[11px] text-[#627386] max-w-sm mt-0.5 line-clamp-1">
                Giá tham khảo; showroom xác nhận giá cuối, tồn kho và phương án lắp đặt.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleAddAllToCart}
              className="flex-1 py-3.5 px-4 bg-[#EEF4F7] text-[#0B2239] text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#D8E2EA] transition"
            >
              <Wallet className="w-4 h-4" /> Lưu vào giỏ
            </button>
            <Link 
              href="/quote"
              className="flex-1 py-3.5 px-4 bg-[#0B2239] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#061827] transition"
            >
              Gửi yêu cầu báo giá
            </Link>
          </div>

        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed top-24 right-6 bg-[#123C5A] text-white px-6 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5 text-[#DCEBF5]" />
          <span className="font-medium text-sm">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}