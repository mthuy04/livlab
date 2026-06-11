export interface ProductSelectionRule {
  categories: string[];
  budgetSegment?: string;
  preferredBrands?: string[];
}

export interface ComboPackage {
  id: string;
  slug: string;
  name: string;
  budgetLabel: string;
  budgetMin: number;
  budgetMax: number;
  targetUsers: string[];
  description: string;
  includedCategories: string[];
  preferredConceptStyles: string[];
  suitableArea: string;
  productSelectionRules: ProductSelectionRule;
}

export const combos: ComboPackage[] = [
  {
    id: 'combo-essential',
    slug: 'essential-compact',
    name: 'Essential Compact',
    budgetLabel: 'Dưới 30 triệu',
    budgetMin: 10000000,
    budgetMax: 30000000,
    targetUsers: ['Phòng tắm căn hộ nhỏ', 'Nhà cho thuê', 'Cải tạo tiết kiệm'],
    description: 'Bộ sản phẩm thiết yếu được chọn lọc để tối ưu không gian nhỏ với chi phí hợp lý nhất, đảm bảo đầy đủ công năng cơ bản.',
    includedCategories: ['Lavabo', 'Vòi lavabo', 'Gương', 'Bồn cầu', 'Sen tắm', 'Phụ kiện cơ bản'],
    preferredConceptStyles: ['Minimal', 'Modern', 'Budget'],
    suitableArea: 'Dưới 4m²',
    productSelectionRules: {
      categories: ['Lavabo', 'Vòi chậu', 'Gương', 'Bồn cầu', 'Sen tắm', 'Phụ kiện'],
      budgetSegment: 'Economy',
    }
  },
  {
    id: 'combo-balanced',
    slug: 'balanced-apartment',
    name: 'Balanced Apartment',
    budgetLabel: '30–60 triệu',
    budgetMin: 30000000,
    budgetMax: 60000000,
    targetUsers: ['Căn hộ gia đình', 'Nhà phố', 'Cải tạo cần thẩm mỹ và độ bền'],
    description: 'Sự cân bằng hoàn hảo giữa thẩm mỹ và công năng. Bổ sung tủ lavabo và gương LED giúp không gian hiện đại và tiện nghi hơn.',
    includedCategories: ['Lavabo', 'Vòi lavabo', 'Gương LED', 'Bồn cầu', 'Sen tắm', 'Tủ kệ lavabo', 'Gạch/Phụ kiện'],
    preferredConceptStyles: ['Japandi', 'Modern', 'Warm Neutral'],
    suitableArea: '4–6m²',
    productSelectionRules: {
      categories: ['Lavabo', 'Vòi chậu', 'Gương', 'Bồn cầu', 'Sen tắm', 'Tủ lavabo', 'Phụ kiện', 'Gạch'],
      budgetSegment: 'Mid-range',
    }
  },
  {
    id: 'combo-premium',
    slug: 'premium-hotel',
    name: 'Premium Hotel-like',
    budgetLabel: 'Trên 60 triệu',
    budgetMin: 60000000,
    budgetMax: 150000000,
    targetUsers: ['Master bathroom', 'Homestay boutique', 'Căn hộ cao cấp'],
    description: 'Biến phòng tắm thành không gian thư giãn chuẩn khách sạn với sen cây nhiệt độ, bồn cầu thông minh và thiết bị cao cấp.',
    includedCategories: ['Lavabo cao cấp', 'Vòi lavabo', 'Gương LED thông minh', 'Bồn cầu cao cấp', 'Sen cây/Sen tắm', 'Tủ lavabo', 'Đèn/Phụ kiện/Gạch'],
    preferredConceptStyles: ['Hotel', 'Luxury', 'Warm Neutral'],
    suitableArea: 'Trên 6m²',
    productSelectionRules: {
      categories: ['Lavabo', 'Vòi chậu', 'Gương', 'Bồn cầu', 'Sen tắm', 'Tủ lavabo', 'Phụ kiện', 'Gạch', 'Đèn'],
      budgetSegment: 'Premium',
    }
  }
];

export function getComboById(id: string): ComboPackage | undefined {
  return combos.find(c => c.id === id || c.slug === id);
}
