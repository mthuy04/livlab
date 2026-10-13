#!/usr/bin/env python3
"""
Factual descriptions for the technologies the catalogue names.

    python3 scripts/enrich_technologies.py

Product detail lists the technologies a manufacturer claims for a SKU, but a
bare "CEFIONTECT" under a section heading tells a customer nothing. The
descriptions here are read from the manufacturers' own technology pages — the
same pages TOTO links from each product — and never written from memory. A
technology whose description cannot be read from its brand's own site keeps
its name and is shown without one.

Writes data/demo/manufacturer-technologies.json.
"""

import json
import re
import sys
import time
import urllib.request
from html import unescape

UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}

# Only pages the brand publishes about its own technology.
SOURCES = {
    'CEFIONTECT': ('TOTO', 'https://vn.toto.com/technology/technologies/cefiontect/'),
    'TORNADO': ('TOTO', 'https://vn.toto.com/technology/technologies/tornado/'),
    'RIMLESS': ('TOTO', 'https://vn.toto.com/technology/technologies/rimless/'),
    'AQUA CERAMIC': ('INAX', 'https://www.inax.com.vn/technology/aqua-ceramic/'),
}


def get(url):
    return urllib.request.urlopen(
        urllib.request.Request(url, headers=UA), timeout=40).read().decode('utf-8', 'ignore')


def strip_tags(s):
    return ' '.join(unescape(re.sub(r'<[^>]+>', ' ', s)).split())


def first_paragraphs(html, want=2):
    """The page's own opening prose, as the manufacturer wrote it.

    TOTO marks some technology copy up as <p> and some as a bare <div>, so both
    are read, paragraphs first.
    """
    html = re.sub(r'<(script|style|nav|header|footer)[^>]*>.*?</\1>', ' ', html, flags=re.S | re.I)
    out = []
    for pattern in (r'<p[^>]*>(.*?)</p>', r'<div[^>]*>(.*?)</div>'):
        for m in re.finditer(pattern, html, re.S | re.I):
            text = strip_tags(m.group(1))
            # Skip navigation crumbs, captions and cookie notices.
            if len(text) < 60 or len(text) > 600:
                continue
            if re.search(r'(cookie|đăng ký|liên hệ|bản quyền|copyright|xem thêm)', text, re.I):
                continue
            if text in out or any(text in prev for prev in out):
                continue
            out.append(text)
            if len(out) >= want:
                return out
        if out:
            return out
    return out


def whole_sentences(text, limit=300):
    """The first few sentences, never cut mid-word.

    A product page wants the claim, not the brochure: two or three sentences
    a customer actually reads. Full manufacturer marketing copy ran past 400
    characters and turned the section back into a wall of text. The cut lands
    on a sentence boundary, so what is shown is the manufacturer's own
    sentences rather than an abridged paraphrase.
    """
    text = text.strip()
    if len(text) <= limit:
        return text
    sentences = re.split(r'(?<=[.!?])\s+', text)
    out = ''
    for sentence in sentences:
        candidate = f'{out} {sentence}'.strip()
        if out and len(candidate) > limit:
            break
        out = candidate
    if not out:
        out = text[:limit].rsplit(' ', 1)[0]
    return out.strip()


def main():
    result = {}
    for name, (brand, url) in SOURCES.items():
        try:
            html = get(url)
        except Exception as exc:  # noqa: BLE001
            print(f'  {name:14} unreachable: {str(exc)[:60]}')
            continue
        paras = first_paragraphs(html)
        if not paras:
            print(f'  {name:14} no usable prose on {url}')
            continue
        result[name] = {
            'brand': brand,
            'description': whole_sentences(' '.join(paras)),
            'sourceUrl': url,
            'checkedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        }
        print(f'  {name:14} {len(result[name]["description"])} chars from {brand}')
        time.sleep(0.3)

    with open('data/demo/manufacturer-technologies.json', 'w', encoding='utf-8') as fh:
        json.dump({'technologies': result}, fh, ensure_ascii=False, indent=1)
    print(f'\nWrote {len(result)} technology descriptions.')


if __name__ == '__main__':
    main()
