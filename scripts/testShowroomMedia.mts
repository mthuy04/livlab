/**
 * Locks what a showroom's combos, videos and price labels may claim.
 *
 * Run with:  npm run test:showroom-media
 */

import { SHOWROOM_COMBOS, SHOWROOM_VIDEOS, publishedCombos, publishedVideos, facebookPlayerUrl } from '../lib/storefront/showroomMedia';
import { priceBasisFrom } from '../lib/storefront/catalog';
import { MANUFACTURER_TOOLS } from '../lib/storefront/manufacturerTools';
import { DEMO_GIANGSON_TENANT } from '../lib/storefront/tenantConfig';

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail !== undefined ? ` -> ${JSON.stringify(detail)}` : ''}`);
  }
}

console.log('\ncombo');
{
  check('chưa combo nào được xuất bản khi chủ shop chưa duyệt', publishedCombos('giangson', new Set()).length === 0);
  check('mọi combo có nguồn và ngày đọc', SHOWROOM_COMBOS.every((c) => c.source.url.startsWith('https://') && c.source.checkedAt));
  check('không combo nào mang giá chưa xác nhận',
    SHOWROOM_COMBOS.every((c) => c.pricing.status === 'CONTACT' || (c.pricing.amount > 0 && c.pricing.confirmedAt)));
  const december = SHOWROOM_COMBOS.find((c) => c.id === 'giangson-combo-5-mon-2025-12');
  check('ưu đãi 12/2025 đánh dấu đã hết hạn', december?.validity.status === 'EXPIRED');
  check('không chép "1xxx"/"2xxx" hay "giảm 20%" thành nội dung hiển thị',
    !/\dxxx|20%/i.test(JSON.stringify(SHOWROOM_COMBOS.map((c) => [c.title, c.summary, c.components]))));

  // Approval alone is not enough when a part names a product that is gone.
  const approved = { ...SHOWROOM_COMBOS[0], id: 't', publication: 'PUBLISHED' as const, components: [{ label: 'x', quantity: 1, catalogProductId: 'demo:giangson:INAX:AC-912VN' }] };
  SHOWROOM_COMBOS.push(approved);
  check('combo đã duyệt hiện khi sản phẩm còn trong danh mục', publishedCombos('giangson', new Set(['demo:giangson:INAX:AC-912VN'])).some((c) => c.id === 't'));
  check('combo đã duyệt ẩn khi sản phẩm không còn', !publishedCombos('giangson', new Set()).some((c) => c.id === 't'));
  check('combo của tenant khác không hiện', !publishedCombos('tungdang', new Set(['demo:giangson:INAX:AC-912VN'])).some((c) => c.id === 't'));
  SHOWROOM_COMBOS.pop();
}

console.log('\nvideo');
{
  const videos = publishedVideos('giangson');
  check('hai video của Giang Sơn', videos.length === 2);
  check('chỉ video trên trang Facebook của chính showroom', SHOWROOM_VIDEOS.every((v) => v.facebookUrl.startsWith('https://www.facebook.com/thietbigiangson/videos/')));
  check('trình phát là plugin chính thức của Facebook', videos.every((v) => facebookPlayerUrl(v.facebookUrl).startsWith('https://www.facebook.com/plugins/video.php?')));
  check('mỗi video dẫn tới một trang có thật trên storefront', videos.every((v) => v.next.href.startsWith('/')));
  check('tenant khác không có video', publishedVideos('tungdang').length === 0 && publishedVideos('livlab').length === 0);
}

console.log('\nnhãn giá');
{
  check('giá hãng công bố', priceBasisFrom('Giá bán lẻ đề xuất do hãng công bố') === 'Giá hãng đề xuất');
  check('giá khuyến mãi của hãng', priceBasisFrom('Giá bán lẻ khuyến mãi đề xuất của hãng (giá gốc gạch ngang)') === 'Giá khuyến mãi hãng đề xuất');
  check('giá thị trường', priceBasisFrom('Giá bán lẻ thị trường (META.vn); hãng chưa công bố giá trên website') === 'Giá thị trường tham khảo');
  check('không có nguồn: không gắn nhãn', priceBasisFrom(null) === null && priceBasisFrom('') === null);
}

console.log('\ncông cụ mô phỏng');
{
  const coohom = Object.values(MANUFACTURER_TOOLS).find((t) => t.provider === 'COOHOM')!;
  check('công cụ trên Coohom không nhận là của hãng', !coohom.official && !/của INAX/.test(coohom.label + coohom.attribution));
  const toto = Object.values(MANUFACTURER_TOOLS).find((t) => t.provider === 'TOTO')!;
  check('công cụ chọn vòi TOTO chỉ cho vòi và lavabo', JSON.stringify(toto.categories) === JSON.stringify(['Vòi lavabo', 'Lavabo']));
}

console.log('\ntrang chủ Giang Sơn');
{
  const landing = DEMO_GIANGSON_TENANT.experience.home.landing!;
  const hero = DEMO_GIANGSON_TENANT.experience.copy.hero;
  check('H1 đúng', hero.titleLines.join(' ') === 'Thiết bị vệ sinh Giang Sơn tại Hà Nội');
  check('không có CTA combo khi chưa có combo', !/combo/i.test(hero.primaryCta.label));
  const banned = /nâng tầm|giải pháp toàn diện|kiến tạo|vượt trội|có cơ sở hơn|hàng đầu|24\s*[–-]\s*48/i;
  check('không dùng cụm từ chung chung bị cấm', !banned.test(JSON.stringify({ landing, hero })), JSON.stringify({ landing, hero }).match(banned));
  check('thứ tự trang chủ', ['hero', 'categories', 'combos', 'products', 'videos', 'concepts', 'roomStudio', 'showroom', 'contact'].every((k) => k in landing));
  check('Room Studio ghi chú không thay đo đạc thực tế', /đo đạc thực tế/.test(landing.roomStudio.note ?? ''));
  check('ảnh Room Studio là của Giang Sơn, không phải thư viện LivLab', landing.roomStudio.image.src.startsWith('/demo/giangson/'));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
