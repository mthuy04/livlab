import urllib.request
import re
import json

def fetch_toto():
    url = "https://vn.toto.com/san-pham/chau-rua-mat-lavabo/"
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        print(len(html))
        
        # Find product cards
        # Look for <img src="..." alt="Lavabo..."
        matches = re.findall(r'<img[^>]*src="([^"]+)"[^>]*alt="([^"]+)"', html)
        for m in matches[:10]:
            print(m)
    except Exception as e:
        print(e)
        
fetch_toto()
