#!/usr/bin/env python3
"""
Regression tests for manufacturer source discovery. No network.

These exist because of one missing host. `box.com` was absent from the
enrichment allowlist, INAX serves its 3D Max files from extensionless Box
share links, and six exact-SKU sources were invisible for it — not misread,
not misclassified, dropped before anything looked at them. A regex that quiet
needs a test that fails loudly.

    python3 scripts/test_source_discovery.py
"""

import importlib.util
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

failures = []


def check(name, actual, expected):
    if actual == expected:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name}: duoc {actual!r}, can {expected!r}")
        failures.append(name)


def load_doc_href():
    """DOC_HREF out of the enrichment script without running its main()."""
    src = open(os.path.join(ROOT, 'scripts/enrich_manufacturer_assets.py'), encoding='utf-8').read()
    m = re.search(r'DOC_HREF = re\.compile\((.*?)\n\n', src, re.S)
    ns = {}
    exec('import re\nDOC_HREF = re.compile(' + m.group(1), ns)
    return ns['DOC_HREF']


def load_discovery():
    spec = importlib.util.spec_from_file_location(
        'discovery', os.path.join(ROOT, 'scripts/discover_manufacturer_3d.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_host_allowlist(DOC_HREF):
    print("\nhost allowlist — link hang phai qua, link la phai bi chan")
    # The regression itself: extensionless Box share link from an INAX page.
    check('Box share link (3D Max cua INAX)',
          bool(DOC_HREF.search('https://app.box.com/s/br6ru4nr1n1ikyoi1hcjgdtwhqxx6iow')), True)
    check('Drive share link', bool(DOC_HREF.search('https://drive.google.com/file/d/1WEo0/view')), True)
    check('file .max truc tiep', bool(DOC_HREF.search('https://x.com/AC-1008VRN.max')), True)
    check('file .igs truc tiep', bool(DOC_HREF.search('https://x.com/model.igs')), True)
    check('DWG cua TOTO', bool(DOC_HREF.search('https://vn.toto.com/CAD_MS636_Rv09.dwg')), True)
    # §42: the list stays a list. A page that is not a file is not a source.
    check('trang HTML thuong bi chan', bool(DOC_HREF.search('https://example.com/page.html')), False)
    check('host la bi chan', bool(DOC_HREF.search('https://random-cdn.example/abc123')), False)


def test_section_classification(d):
    print("\nphan loai muc — theo nhan muc, khong theo duoi file")
    section_of = lambda h: next((t for t, rx in d.SECTION_TYPES if rx.search(h)), 'OTHER')
    check('"3D Max Files" -> THREE_D', section_of('3D Max Files'), 'THREE_D')
    check('"CAD Files" -> CAD', section_of('CAD Files'), 'CAD')
    check('"Installation Files" -> INSTALLATION', section_of('Installation Files'), 'INSTALLATION')
    check('"Spec Files" -> SPEC', section_of('Spec Files'), 'SPEC')


def test_declared_format(d):
    print("\ndinh dang suy tu URL — khong bia duoi tu nhan muc")
    check('.max', d.declared_format('https://x.com/AC-1008VRN.max'), 'MAX')
    check('.igs', d.declared_format('https://x.com/a.igs'), 'IGES')
    # §15: the host says nothing about the payload.
    check('Box khong duoi -> chua biet',
          d.declared_format('https://app.box.com/s/br6ru4'), 'UNKNOWN_REMOTE_FILE')
    check('Drive khong duoi -> chua biet',
          d.declared_format('https://drive.google.com/file/d/1WEo0/view'), 'UNKNOWN_REMOTE_FILE')


def test_empty_href_is_absence(d):
    print("\nhref rong = khong co file (muc luon hien tren moi trang INAX)")
    html = (
        '<p class="title-2 text-uppercase">CAD Files</p>'
        '<ul class="file"><li><a href="" target="_blank">AC-900VRN-2</a></li></ul>'
        '<p class="title-2 text-uppercase">Installation Files</p>'
        '<ul class="file"><li><a href="https://drive.google.com/file/d/X/view">AC-900VRN-2</a></li></ul>'
        '<p class="title-2 text-uppercase">3D Max Files</p>'
        '<ul class="file"><li><a href="" target="_blank">AC-900VRN-2</a></li></ul>'
    )
    rows = d.parse_inax_downloads(html)
    check('doc du 3 dong', len(rows), 3)
    three_d = [r for r in rows if r['sectionType'] == 'THREE_D']
    check('co muc 3D', len(three_d), 1)
    # The heading promises a file; the empty href says there is none. Reading
    # headings alone would claim 3D for every product on the site.
    check('muc 3D nhung href rong -> present=False', three_d[0]['present'], False)
    check('Installation co file', [r['present'] for r in rows if r['sectionType'] == 'INSTALLATION'], [True])


def test_sku_exactness(d):
    print("\nkhop SKU — ten file phai chua dung SKU")
    t = d._token
    check('AC-1008VRN trong AC-1008VRN.max', t('AC-1008VRN') in t('AC-1008VRN.max'), True)
    # INAX names one file `4_-_AC_-_4005VN_-_FN.max`; underscores and dashes
    # must fall out before the SKU inside it can be seen.
    check('AC-4005VN trong 4_-_AC_-_4005VN_-_FN.max',
          t('AC-4005VN') in t('4_-_AC_-_4005VN_-_FN.max'), True)
    # The two real catches from parser QA. Neither may be allowed to pass.
    check('AL-289VFC KHONG trong L-298VFC-...zip (SKU khac)',
          t('AL-289VFC') in t('L-298VFC-20231031T064812Z-001.zip'), False)
    check('AL-638V KHONG trong "S400 Vessel basin.igs" (ten dong, khong phai SKU)',
          t('AL-638V') in t('S400 Vessel basin.igs'), False)


def main():
    DOC_HREF = load_doc_href()
    d = load_discovery()

    test_host_allowlist(DOC_HREF)
    test_section_classification(d)
    test_declared_format(d)
    test_empty_href_is_absence(d)
    test_sku_exactness(d)

    print()
    if failures:
        print(f"{len(failures)} test that bai: {', '.join(failures)}")
        sys.exit(1)
    print("tat ca test dat")


if __name__ == '__main__':
    main()
