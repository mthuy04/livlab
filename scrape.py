import urllib.request
import json
import re

def scrape_hita():
    urls = [
        ("Lavabo", "https://hita.com.vn/chau-rua-mat-lavabo-toto-229.html"),
        ("Vòi lavabo", "https://hita.com.vn/voi-chau-lavabo-toto-232.html"),
        ("Bồn cầu", "https://hita.com.vn/bon-cau-toto-228.html"),
        ("Sen tắm", "https://hita.com.vn/sen-tam-toto-233.html")
    ]
    
    products = []
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    # Actually, scraping directly might get blocked. Let's try.
    for cat, url in urls:
        try:
            req = urllib.request.Request(url, headers=headers)
            html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
            
            # Find product blocks
            # Look for <img src="..." alt="..." /> or similar
            # Since HTML structure varies, let's try a regex for image tags
            # Hita uses <img src="https://bizweb.dktcdn.net/..." alt="...">
            
            matches = re.findall(r'<img[^>]+src="([^"]+bizweb\.dktcdn\.net[^"]+)"[^>]*alt="([^"]+)"', html)
            
            for img, alt in matches:
                if "icon" in img or "logo" in img.lower() or "banner" in img.lower(): continue
                if len(products) > 100: break
                
                products.append({
                    "category": cat,
                    "name": alt,
                    "image": img,
                    "url": url
                })
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            
    with open("scraped_products.json", "w") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
        
scrape_hita()
print("Scraping finished.")
