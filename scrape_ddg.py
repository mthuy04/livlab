import urllib.request
import urllib.parse
import re
import json
import time

def ddg_search(query):
    url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
        
        # Extract URLs
        links = re.findall(r'<a class="result__url" href="([^"]+)">', html)
        return links
    except Exception as e:
        print(f"Error: {e}")
        return []

print(ddg_search("site:vn.toto.com bàn cầu hai khối"))
