export type RoomType = 'Bathroom' | 'Living Room' | 'Kitchen' | 'Studio' | 'Bedroom' | 'Dining' | 'Phòng tắm' | 'Bếp' | 'Phòng khách' | 'Homestay' | 'Góc chức năng' | string;
export type StyleType = 'Japandi' | 'Modern' | 'Minimal' | 'Hotel' | 'Warm Neutral' | 'Industrial' | 'Luxury' | 'Budget' | 'Boutique' | 'Compact' | 'Family-friendly' | string;
export type BudgetRange = 'Under 30M' | '30M–60M' | '60M+' | 'Dưới 20 triệu' | 'Dưới 30 triệu' | 'Trên 60 triệu' | 'Linh hoạt theo báo giá' | string;
export type ProductCategory =
  | 'Basin'
  | 'Faucet'
  | 'Mirror'
  | 'Shower'
  | 'Toilet'
  | 'Tiles'
  | 'Cabinet'
  | 'Lighting'
  | 'Accessories'
  | 'Sofa'
  | 'Table'
  | 'Chair'
  | 'Shelf'
  | string;

export type Availability = 'In Stock' | 'Made to Order' | 'Limited Stock';
export type LeadStatus = 'Mới' | 'Đã liên hệ' | 'Đã báo giá' | 'Đã chốt' | 'Mất lead';
export type UserRole = 'CUSTOMER' | 'SHOWROOM' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}

export interface ProductReview {
  id: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  useCase?: string;
  date: string;
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  category: ProductCategory;
  subCategory?: string;
  brand: string;
  sku: string;

  priceMin: number;
  priceMax: number;
  priceRange: string;
  priceUnit?: string;

  material?: string;
  finish?: string;
  color?: string;
  size?: string;
  dimensions?: string;
  installationType?: string;
  // Structured AR placement type, distinct from the free-text `installationType`
  // (which holds unstructured Vietnamese phrases unsuitable for logic). Defaults
  // to "floor" when unset — assign per-SKU manually, do not infer from name/text.
  mountType?: 'wall' | 'floor';
  warranty?: string;
  origin?: string;

  // Path to a pre-authored USDZ for this exact product, used as <model-viewer
  // ios-src>. Leave unset until a real USDZ is exported and reviewed — do not
  // rely on ios auto-generation from the GLB for production material quality.
  usdzUrl?: string;

  image: string;
  images?: string[];
  imageAlt?: string;
  imageVerified?: boolean;
  imageSourceUrl?: string;

  availability: string;
  status: "Còn hàng" | "Đặt trước" | "Ngừng kinh doanh";
  stockNote?: string;

  style?: StyleType | string;
  compatibleStyles?: string[];
  suitableFor?: string[];
  suitableRoomSize?: string;
  budgetSegment?: string;

  description: string;
  features?: string[];
  technicalSpecs?: string[];
  careInstructions?: string[];
  includedItems?: string[];

  showroomName: string;
  showroomLocation: string;
  showroomContact?: string;
  sellerType: "Showroom đối tác" | "Đại lý phân phối" | "Retailer tham khảo" | "Dữ liệu mẫu" | string;

  soldBy?: string;
  fulfilledBy?: string;
  commerceType?: "Quote-based commerce";
  supplierType?: string;

  sourceUrl?: string;
  priceSource?: string;
  sourceNote?: string;

  popularity?: number;
  reviews?: ProductReview[];
}

export interface ComboPackage {
  id: string;
  slug: string;
  title: string;
  roomType: string;
  style: string;
  budgetRange: string;
  priceMin: number;
  priceMax: number;
  description: string;
  recommendedFor?: string[];
  includedCategories: string[];
  productIds: string[];
  suitableFor?: string[];
  image?: string;
  sourceNote?: string;
}

export interface Hotspot {
  id: string;
  imageId: string; // scopes this hotspot to a specific image (concept.id for CSV-sourced concepts, or a stable key for standalone JSON hotspot sets)
  productId: string;
  label: string;
  xPercent: number; // % from left, relative to the ORIGINAL (natural) image dimensions — not the display container
  yPercent: number; // % from top, relative to the ORIGINAL (natural) image dimensions — not the display container
  category?: string;
  note?: string;
}

export interface Concept {
  id: string;
  slug: string;
  title: string;
  roomType: RoomType;
  style: StyleType;
  budgetRange: BudgetRange;
  areaSize: string;
  shortDescription: string;
  description: string;
  longDescription?: string;
  image: string;
  imageAlt?: string;
  productIds: string[];
  hotspots: Hotspot[];
  suitableFor?: string[];
  painPoints?: string[];
  keyBenefits?: string[];
  whyItWorks?: string[];
  tags?: string[];
  productCount?: number;
  keyProducts?: string[];
  estimatedBudgetMin?: number;
  estimatedBudgetMax?: number;
  sourceNote?: string;
}

export interface QuoteItem {
  productId: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  priceMin: number;
  priceMax: number;
  priceRange: string;
  quantity: number;
  image?: string | null;
  material?: string;
  finish?: string;
  showroomName: string;
  showroomLocation: string;
  showroomContact?: string;
  conceptId?: string;
  addedAt: string;
}

export interface Lead {
  id: string;
  requestCode: string;
  customerId?: string;
  customerEmail?: string;
  customerName: string;
  phone: string;
  email?: string;
  roomType: string;
  roomSize?: string;
  budgetRange: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetFit?: string | null;
  style?: string;
  selectedConcept?: string;
  selectedProducts: QuoteItem[];
  notes?: string;
  timeline?: string;
  needsInstallation?: boolean;
  consent: boolean;
  status: LeadStatus;
  createdAt: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  statusHistory?: {
    status: string;
    at: string;
    note?: string;
  }[];
  adminNote?: string;
  aiSummary?: string | null;
  aiFitScore?: number | null;
  aiSource?: string | null;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  readingTime: number; // minutes
  publishedAt: string;
  tags: string[];
}
