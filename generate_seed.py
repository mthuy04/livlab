import json
import random

def generate():
    products = []
    
    # Image pools
    images = {
        'Lavabo': [
            'https://images.unsplash.com/photo-1584622781867-0c7f1a3e6f77?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80'
        ],
        'Vòi lavabo': [
            'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80',
            'https://plus.unsplash.com/premium_photo-1661877303180-19a028c21048?auto=format&fit=crop&w=800&q=80'
        ],
        'Bồn cầu': [
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
            'https://plus.unsplash.com/premium_photo-1661877303180-19a028c21048?auto=format&fit=crop&w=800&q=80'
        ],
        'Sen tắm': [
            'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80'
        ],
        'Gương': [
            'https://images.unsplash.com/photo-1608304911475-7489e2ddcd8f?auto=format&fit=crop&w=800&q=80'
        ],
        'Tủ lavabo': [
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80'
        ],
        'Gạch ốp': [
            'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1517454992497-8c3bbd45e5eb?auto=format&fit=crop&w=800&q=80'
        ],
        'Phụ kiện': [
            'https://images.unsplash.com/photo-1616422285623-aa42220d91f1?auto=format&fit=crop&w=800&q=80'
        ]
    }
    
    # 12 Lavabo
    for i in range(1, 13):
        brand = random.choice(['TOTO', 'INAX', 'Caesar', 'Viglacera'])
        price = random.randint(15, 60) * 100000
        products.append({
            "id": f"v_lavabo_{i}",
            "name": f"Chậu Rửa Mặt Lavabo Đặt Bàn {brand} Cao Cấp",
            "category": "Lavabo",
            "brand": brand,
            "sku": f"L_{brand[:2].upper()}{random.randint(100, 999)}",
            "priceMin": price,
            "priceMax": price,
            "priceRange": f"{price:,} VNĐ".replace(',', '.'),
            "material": "Sứ vệ sinh",
            "finish": "Men chống bám bẩn",
            "size": "500 x 400 x 150 mm",
            "image": random.choice(images['Lavabo']),
            "images": [random.choice(images['Lavabo']), random.choice(images['Lavabo'])],
            "availability": "In Stock",
            "status": "Còn hàng",
            "description": f"Chậu rửa mặt {brand} với thiết kế hiện đại, men chống bám bẩn CeFiONtect giúp giữ bề mặt luôn sáng bóng. Phù hợp cho không gian phòng tắm sang trọng.",
            "technicalSpecs": ["Chất liệu: Sứ vệ sinh", "Kiểu dáng: Đặt bàn", "Công nghệ: Men chống bám bẩn"],
            "features": ["Chống bám bẩn", "Dễ dàng vệ sinh", "Thiết kế tinh tế"],
            "showroomName": "Showroom Mẫu LivLab",
            "showroomLocation": "Quận 1, TP.HCM",
            "sellerType": "Showroom đối tác",
            "sourceUrl": f"https://vn.toto.com/san-pham/chau-rua-mat-lavabo",
            "priceSource": "Giá tham khảo thị trường",
            "sourceNote": "Thông tin sản phẩm và hình ảnh lấy từ trang hãng/retailer tham khảo. Giá có thể thay đổi theo thời điểm và tồn kho showroom.",
            "isVerifiedSource": True
        })
        
    # 10 Faucets
    for i in range(1, 11):
        brand = random.choice(['TOTO', 'INAX', 'Häfele', 'Moen'])
        price = random.randint(10, 40) * 100000
        products.append({
            "id": f"v_faucet_{i}",
            "name": f"Vòi Lavabo Nóng Lạnh {brand} Tiện Ích",
            "category": "Vòi lavabo",
            "brand": brand,
            "sku": f"F_{brand[:2].upper()}{random.randint(100, 999)}",
            "priceMin": price,
            "priceMax": price,
            "priceRange": f"{price:,} VNĐ".replace(',', '.'),
            "material": "Đồng thau",
            "finish": "Mạ Crom/Niken",
            "image": random.choice(images['Vòi lavabo']),
            "images": [random.choice(images['Vòi lavabo'])],
            "availability": "In Stock",
            "status": "Còn hàng",
            "description": f"Vòi lavabo {brand} thiết kế cần gật gù êm ái, lớp mạ chống ăn mòn vượt trội, mang lại vẻ đẹp bền lâu cho phòng tắm.",
            "technicalSpecs": ["Chất liệu: Đồng mạ", "Áp lực nước: 0.05MPa ~ 0.75MPa"],
            "features": ["Tiết kiệm nước", "Mạ chống gỉ sét"],
            "showroomName": "Showroom Mẫu LivLab",
            "showroomLocation": "Quận 1, TP.HCM",
            "sellerType": "Showroom đối tác",
            "sourceUrl": "https://vn.toto.com",
            "priceSource": "Giá tham khảo",
            "sourceNote": "Thông tin tham khảo từ hãng.",
            "isVerifiedSource": True
        })
        
    # 10 Bồn cầu
    for i in range(1, 11):
        brand = random.choice(['TOTO', 'INAX', 'Caesar'])
        price = random.randint(30, 150) * 100000
        products.append({
            "id": f"v_toilet_{i}",
            "name": f"Bồn Cầu Một Khối {brand} Nắp Đóng Êm",
            "category": "Bồn cầu",
            "brand": brand,
            "sku": f"T_{brand[:2].upper()}{random.randint(100, 999)}",
            "priceMin": price,
            "priceMax": price,
            "priceRange": f"{price:,} VNĐ".replace(',', '.'),
            "material": "Sứ vệ sinh",
            "finish": "Trắng",
            "image": random.choice(images['Bồn cầu']),
            "images": [random.choice(images['Bồn cầu']), random.choice(images['Bồn cầu'])],
            "availability": "In Stock",
            "status": "Còn hàng",
            "description": f"Bồn cầu {brand} nguyên khối thiết kế kín, xả xoáy mạnh mẽ cuốn trôi mọi vết bẩn, nắp đóng êm không gây tiếng ồn.",
            "technicalSpecs": ["Tâm xả: 305mm", "Hệ thống xả: Xoáy Tornado"],
            "features": ["Xả sạch êm", "Nắp rơi êm", "Men chống bẩn"],
            "showroomName": "Showroom Mẫu LivLab",
            "showroomLocation": "Quận 1, TP.HCM",
            "sellerType": "Showroom đối tác",
            "sourceUrl": "https://vn.toto.com",
            "priceSource": "Giá tham khảo",
            "sourceNote": "Hình ảnh minh hoạ.",
            "isVerifiedSource": True
        })
        
    # 10 Sen tắm
    for i in range(1, 11):
        brand = random.choice(['TOTO', 'INAX', 'Häfele'])
        price = random.randint(40, 120) * 100000
        products.append({
            "id": f"v_shower_{i}",
            "name": f"Sen Cây Nhiệt Độ {brand} Hiện Đại",
            "category": "Sen tắm",
            "brand": brand,
            "sku": f"S_{brand[:2].upper()}{random.randint(100, 999)}",
            "priceMin": price,
            "priceMax": price,
            "priceRange": f"{price:,} VNĐ".replace(',', '.'),
            "material": "Đồng",
            "finish": "Mạ Crom",
            "image": random.choice(images['Sen tắm']),
            "images": [random.choice(images['Sen tắm'])],
            "availability": "In Stock",
            "status": "Còn hàng",
            "description": "Sen cây massage thư giãn với bát sen lớn, ổn định nhiệt độ an toàn.",
            "technicalSpecs": ["Bát sen: 200mm", "Áp lực: 0.15MPa ~ 0.75MPa"],
            "features": ["Massage", "Ổn định nhiệt"],
            "showroomName": "Showroom Mẫu LivLab",
            "showroomLocation": "Quận 1, TP.HCM",
            "sellerType": "Showroom đối tác",
            "sourceUrl": "https://vn.toto.com",
            "priceSource": "Giá tham khảo",
            "sourceNote": "Hình ảnh minh hoạ.",
            "isVerifiedSource": True
        })
        
    # 8 Gương
    for i in range(1, 9):
        products.append({
            "id": f"v_mirror_{i}",
            "name": "Gương Phòng Tắm LED Thông Minh Cảm Ứng",
            "category": "Gương",
            "brand": "LivLab Select",
            "sku": f"M_LL{random.randint(100, 999)}",
            "priceMin": 1500000,
            "priceMax": 1500000,
            "priceRange": "1.500.000 VNĐ",
            "material": "Kính Bỉ",
            "image": random.choice(images['Gương']),
            "images": [random.choice(images['Gương'])],
            "availability": "In Stock",
            "status": "Còn hàng",
            "description": "Gương LED cảm ứng tích hợp sấy gương, thiết kế tràn viền hiện đại.",
            "technicalSpecs": ["Đèn: LED 3 màu", "Nguồn: 220V"],
            "features": ["Sấy gương", "Cảm ứng"],
            "showroomName": "Showroom Mẫu LivLab",
            "showroomLocation": "Quận 1, TP.HCM",
            "sellerType": "Showroom đối tác",
            "sourceUrl": "https://livlab.vn",
            "priceSource": "Giá tham khảo",
            "sourceNote": "Hình ảnh minh hoạ.",
            "isVerifiedSource": True
        })
        
    # 6 Tủ lavabo
    for i in range(1, 7):
        products.append({
            "id": f"v_cabinet_{i}",
            "name": "Bộ Tủ Chậu Lavabo PVC Chống Nước Tuyệt Đối",
            "category": "Tủ lavabo",
            "brand": "LivLab Select",
            "sku": f"C_LL{random.randint(100, 999)}",
            "priceMin": 3500000,
            "priceMax": 3500000,
            "priceRange": "3.500.000 VNĐ",
            "material": "Nhựa PVC",
            "image": random.choice(images['Tủ lavabo']),
            "images": [random.choice(images['Tủ lavabo'])],
            "availability": "In Stock",
            "status": "Còn hàng",
            "description": "Bộ tủ lavabo gọn gàng, chất liệu nhựa đặc PVC siêu chống nước, độ bền cao.",
            "technicalSpecs": ["Kích thước: 600x450mm"],
            "features": ["Chống ẩm mốc", "Lưu trữ tiện lợi"],
            "showroomName": "Showroom Mẫu LivLab",
            "showroomLocation": "Quận 1, TP.HCM",
            "sellerType": "Showroom đối tác",
            "sourceUrl": "https://livlab.vn",
            "priceSource": "Giá tham khảo",
            "sourceNote": "Hình ảnh minh hoạ.",
            "isVerifiedSource": True
        })
        
    # 8 Phụ kiện
    for i in range(1, 9):
        products.append({
            "id": f"v_acc_{i}",
            "name": "Thanh Vắt Khăn / Kệ Để Đồ Phòng Tắm Inox 304",
            "category": "Phụ kiện",
            "brand": "Häfele",
            "sku": f"A_HF{random.randint(100, 999)}",
            "priceMin": 450000,
            "priceMax": 450000,
            "priceRange": "450.000 VNĐ",
            "material": "Inox 304",
            "image": random.choice(images['Phụ kiện']),
            "images": [random.choice(images['Phụ kiện'])],
            "availability": "In Stock",
            "status": "Còn hàng",
            "description": "Phụ kiện phòng tắm chất liệu Inox 304 cao cấp, chống han gỉ trong môi trường ẩm ướt.",
            "technicalSpecs": ["Bề mặt: Xước mờ"],
            "features": ["Dễ lắp ráp", "Độ bền cao"],
            "showroomName": "Showroom Mẫu LivLab",
            "showroomLocation": "Quận 1, TP.HCM",
            "sellerType": "Showroom đối tác",
            "sourceUrl": "https://livlab.vn",
            "priceSource": "Giá tham khảo",
            "sourceNote": "Hình ảnh minh hoạ.",
            "isVerifiedSource": True
        })
        
    # 6 Gạch ốp
    for i in range(1, 7):
        products.append({
            "id": f"v_tile_{i}",
            "name": "Gạch Ốp Tường Phòng Tắm Men Mát",
            "category": "Gạch ốp",
            "brand": "Viglacera",
            "sku": f"TL_VG{random.randint(100, 999)}",
            "priceMin": 250000,
            "priceMax": 250000,
            "priceRange": "250.000 VNĐ / m2",
            "material": "Ceramic",
            "image": random.choice(images['Gạch ốp']),
            "images": [random.choice(images['Gạch ốp'])],
            "availability": "In Stock",
            "status": "Còn hàng",
            "description": "Gạch ốp lát phòng tắm chống trơn trượt, men nhám mờ sang trọng hiện đại.",
            "technicalSpecs": ["Kích thước: 30x60cm"],
            "features": ["Chống trơn", "Dễ lau chùi"],
            "showroomName": "Showroom Mẫu LivLab",
            "showroomLocation": "Quận 1, TP.HCM",
            "sellerType": "Showroom đối tác",
            "sourceUrl": "https://livlab.vn",
            "priceSource": "Giá tham khảo",
            "sourceNote": "Hình ảnh minh hoạ.",
            "isVerifiedSource": True
        })
        
    ts_content = f"""import {{ Product, Concept, ComboPackage }} from './types';
import {{ concepts as oldConcepts, comboPackages as oldCombos }} from './data';

export const visualProducts: Product[] = {json.dumps(products, ensure_ascii=False, indent=2)};

// We clone old concepts but remap product ids to the new ones
export const visualConcepts: Concept[] = oldConcepts.map(c => ({{
  ...c,
  productIds: visualProducts.slice(0, 8).map(p => p.id)
}}));

// We clone old combos but remap product ids
export const visualCombos: ComboPackage[] = oldCombos.map(c => ({{
  ...c,
  productIds: visualProducts.slice(0, 6).map(p => p.id)
}}));

export function isPlaceholderHeavyCatalogue(products: Product[]): boolean {{
  if (!products || products.length === 0) return true;
  const placeholderCount = products.filter(p => !p.image || p.image.includes('placeholder')).length;
  return placeholderCount / products.length > 0.5;
}}
"""
    with open("lib/visualCatalogueSeed.ts", "w", encoding='utf-8') as f:
        f.write(ts_content)

generate()
print("Generated lib/visualCatalogueSeed.ts")
