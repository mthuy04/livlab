/**
 * Demo pipeline for the Tùng Đăng workspace, for recording a walkthrough.
 *
 *   ALLOW_DEMO_SEED=1 npm run seed:tungdang-demo           replace the demo rows
 *   ALLOW_DEMO_SEED=1 npm run seed:tungdang-demo -- --reset   remove them only
 *   ALLOW_DEMO_SEED=1 npm run seed:tungdang-demo -- --dry-run write, report, roll back
 *
 * Every row it writes has an id starting `demo-td-`, and only those rows are
 * ever deleted, so a real request that lands in the workspace survives a
 * re-seed. Products, names and prices come from the Tùng Đăng fixture
 * (data/demo/tungdang-sanitaryware.json); customers are invented. Dates are
 * relative to the moment the script runs, so re-run it shortly before
 * recording to keep "today" meaning today.
 *
 * It refuses to run against anything but the DEMO workspace bound to the
 * `tungdang` tenant.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient, Prisma } from '@prisma/client';
import type { LeadActivityType, LeadNextActionType, LeadRequestType, LeadStage, LeadStatus, QuoteStatus } from '@prisma/client';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const WORKSPACE_ID = 'workspace-demo-tungdang';
const PREFIX = 'demo-td-';
const RESET_ONLY = process.argv.includes('--reset');
const DRY_RUN = process.argv.includes('--dry-run');

if (process.env.ALLOW_DEMO_SEED !== '1') {
  throw new Error('Set ALLOW_DEMO_SEED=1 to write demo rows into the Tùng Đăng demo workspace.');
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

interface FixtureProduct {
  sku: string;
  name: string;
  brand: string;
  showroomPrice: number | null;
  referencePrice: number | null;
}

const fixture = JSON.parse(readFileSync('data/demo/tungdang-sanitaryware.json', 'utf8')) as {
  products: FixtureProduct[];
};
const bySku = new Map(fixture.products.map((p) => [p.sku, p]));

function product(sku: string): FixtureProduct & { price: number; reference: number } {
  const p = bySku.get(sku);
  if (!p || !p.showroomPrice) throw new Error(`SKU ${sku} is not a priced product in the Tùng Đăng fixture.`);
  return { ...p, price: p.showroomPrice, reference: p.referencePrice ?? p.showroomPrice };
}

// ---------------------------------------------------------------------------
// Time, relative to now (Vietnam time for clock-of-day values)
// ---------------------------------------------------------------------------

const NOW = Date.now();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const VN_OFFSET = 7 * HOUR;

/** `days` ago at hh:mm Vietnam time. */
function daysAgo(days: number, hh: number, mm = 0): Date {
  const vnMidnight = Math.floor((NOW + VN_OFFSET) / DAY) * DAY - VN_OFFSET;
  return new Date(vnMidnight - days * DAY + hh * HOUR + mm * 60_000);
}
const hoursAgo = (h: number) => new Date(NOW - h * HOUR);
const hoursFromNow = (h: number) => new Date(NOW + h * HOUR);
const plus = (d: Date, hours: number) => new Date(d.getTime() + hours * HOUR);

// ---------------------------------------------------------------------------
// The pipeline
// ---------------------------------------------------------------------------

type Finding = { severity: 'SUITABLE' | 'OPTIMIZE' | 'VERIFY'; title: string; affectedProduct?: string; message: string };

interface Step {
  type: LeadActivityType;
  /** Hours after the lead was created. */
  at: number;
  body: string;
  metadata?: Record<string, unknown>;
}

interface Pending {
  type: LeadActivityType;
  due: Date;
  body: string;
}

interface QuotePlan {
  status: QuoteStatus;
  /** Hours after the lead was created. Drafts are never sent. */
  sentAt?: number;
  decidedAt?: Date;
  discountPct: number;
  rooms?: number;
  notes?: string;
}

interface LeadPlan {
  key: string;
  name: string;
  phone: string;
  createdAt: Date;
  stage: LeadStage;
  requestType: LeadRequestType;
  roomType: string;
  room?: { length: number; width: number; height: number };
  materials?: { floor: string; walls: string };
  concept?: string;
  items: [sku: string, qty: number][];
  budget: [min: number, max: number];
  notes?: string;
  findings?: Finding[];
  steps: Step[];
  pending?: Pending;
  quote?: QuotePlan;
}

const M = 1_000_000;

const PLANS: LeadPlan[] = [
  // --- Mới -----------------------------------------------------------------
  {
    key: 'L01', name: 'Nguyễn Minh Anh', phone: '0912 457 836', createdAt: hoursAgo(2),
    stage: 'NEW', requestType: 'QUOTATION', roomType: 'Phòng tắm master',
    room: { length: 3.0, width: 2.4, height: 2.8 },
    materials: { floor: 'Porcelain vân đá Kem 60×120', walls: 'Gạch men Trắng bóng 30×60' },
    concept: 'Room Studio · Golden Retreat',
    items: [['AC-1017VRN', 1], ['LT4715MTG17#CMW', 1], ['LFV-6002S', 1], ['26161-624/1B-1', 1]],
    budget: [60 * M, 80 * M],
    notes: 'Muốn xem mẫu thực tế tại showroom cuối tuần này.',
    steps: [],
  },
  {
    key: 'L02', name: 'Trần Quốc Bảo', phone: '0983 216 574', createdAt: hoursAgo(5),
    stage: 'NEW', requestType: 'SHOWROOM_CONSULTATION', roomType: 'WC tầng 2',
    room: { length: 1.8, width: 1.5, height: 2.6 },
    items: [['AC-912VN', 1], ['12409-1/11Z', 1], ['LFV-112SH', 1]],
    budget: [12 * M, 18 * M],
    notes: 'Cần tư vấn bố trí WC nhỏ, cửa mở vào trong.',
    steps: [],
  },
  {
    key: 'L03', name: 'Lê Thu Hà', phone: '0868 392 105', createdAt: hoursAgo(30),
    stage: 'NEW', requestType: 'QUOTATION', roomType: 'Phòng tắm căn hộ',
    room: { length: 2.2, width: 1.8, height: 2.7 },
    materials: { floor: 'Gạch men Xám nhạt nhám 30×30', walls: 'Gạch men Trắng bóng 30×60' },
    concept: 'Room Studio · Urban Light Spa',
    items: [['MS855DW7', 1], ['P12663-1/01Z-1', 1], ['LFV-502SH', 1], ['P36412-484/1B-1', 1]],
    budget: [25 * M, 35 * M],
    steps: [],
  },
  {
    key: 'L04', name: 'Phạm Đức Thắng', phone: '0904 718 263', createdAt: hoursAgo(9),
    stage: 'NEW', requestType: 'TECHNICAL_CHECK', roomType: 'Phòng tắm tầng 3',
    room: { length: 2.0, width: 1.6, height: 2.6 },
    items: [['ZD7220-SA-CJM305', 1]],
    budget: [20 * M, 25 * M],
    notes: 'Thay bồn cầu cũ sang bồn cầu thông minh, chưa rõ tâm xả.',
    findings: [
      { severity: 'VERIFY', title: 'Khoảng cách tâm xả', affectedProduct: 'JOMOO ZD7220-SA-CJM305', message: 'Sản phẩm yêu cầu tâm xả 305 mm; cần đo thực tế tại công trình trước khi chốt.' },
      { severity: 'VERIFY', title: 'Nguồn điện cho nắp điện tử', affectedProduct: 'JOMOO ZD7220-SA-CJM305', message: 'Cần ổ cắm 220 V chống nước, cách sàn khoảng 300–400 mm, bên cạnh bồn cầu.' },
    ],
    steps: [],
    pending: { type: 'CALL', due: hoursFromNow(3), body: 'Gọi xác nhận lịch khảo sát tâm xả' },
  },
  {
    key: 'L05', name: 'Hoàng Ngọc Lan', phone: '0977 534 812', createdAt: hoursAgo(14),
    stage: 'NEW', requestType: 'QUOTATION', roomType: 'Phòng tắm khách',
    items: [['11416-2-231K', 1], ['12661-1/01K', 1], ['LFV-1001S', 1], ['36473-463/HBS-1', 1]],
    budget: [20 * M, 30 * M],
    steps: [],
  },

  // --- Đã liên hệ ------------------------------------------------------------
  {
    key: 'L06', name: 'Vũ Thanh Tùng', phone: '0936 841 257', createdAt: daysAgo(2, 10, 15),
    stage: 'CONTACTED', requestType: 'QUOTATION', roomType: 'Phòng tắm master',
    room: { length: 3.2, width: 2.5, height: 2.9 },
    materials: { floor: 'Marble Be bóng 80×80', walls: 'Porcelain vân đá Kem 60×120' },
    concept: 'Room Studio · Warm Smart Retreat',
    items: [['CS838DW11', 1], ['MW6808S-60', 1], ['26178-624/1B-1', 1], ['PAY1725VC/TVBF411', 1]],
    budget: [60 * M, 75 * M],
    steps: [
      { type: 'CALL', at: 1.5, body: 'Đã gọi. Khách đang so sánh bồn cầu điện tử TOTO và INAX, muốn xem trực tiếp.' },
    ],
    pending: { type: 'MEETING', due: hoursFromNow(30), body: 'Khách tới showroom xem bồn cầu CS838DW11 và bồn tắm chân yếm' },
  },
  {
    key: 'L07', name: 'Đặng Hải Yến', phone: '0915 627 380', createdAt: daysAgo(3, 15, 40),
    stage: 'CONTACTED', requestType: 'SHOWROOM_CONSULTATION', roomType: 'Phòng tắm căn hộ',
    items: [['AC-4005VN', 1], ['12145-1/01Z', 1], ['LFV-6002S', 1]],
    budget: [28 * M, 35 * M],
    steps: [
      { type: 'MESSAGE', at: 0.7, body: 'Đã nhắn Zalo gửi catalogue INAX và bảng màu sứ.' },
    ],
    pending: { type: 'CALL', due: hoursFromNow(5), body: 'Gọi lại tư vấn màu sứ và kiểu chậu âm bàn' },
  },
  {
    key: 'L08', name: 'Bùi Văn Khánh', phone: '0388 914 625', createdAt: daysAgo(4, 9, 20),
    stage: 'CONTACTED', requestType: 'QUOTATION', roomType: 'WC tầng 1',
    room: { length: 1.6, width: 1.2, height: 2.6 },
    items: [['AC-912VN', 1], ['P12748-1/11P-1', 1], ['LF-14-13', 1]],
    budget: [12 * M, 15 * M],
    steps: [
      { type: 'CALL', at: 3, body: 'Khách hẹn gửi ảnh mặt bằng WC để tư vấn chậu treo tường.' },
    ],
    pending: { type: 'FOLLOW_UP', due: hoursAgo(20), body: 'Nhắc khách gửi ảnh mặt bằng WC' },
  },
  {
    key: 'L09', name: 'Đỗ Phương Thảo', phone: '0857 263 941', createdAt: daysAgo(5, 14, 5),
    stage: 'CONTACTED', requestType: 'TECHNICAL_CHECK', roomType: 'Phòng tắm căn hộ tầng 22',
    room: { length: 2.4, width: 1.9, height: 2.7 },
    materials: { floor: 'Terrazzo Xám nhạt 60×60', walls: 'Sơn Trắng mờ' },
    items: [['ZD8610-SA-IDO305', 1], ['LT4715MTG17#CMW', 1]],
    budget: [75 * M, 90 * M],
    findings: [
      { severity: 'VERIFY', title: 'Áp lực nước tối thiểu', affectedProduct: 'JOMOO ZD8610-SA-IDO305', message: 'Bồn cầu thông minh cần áp lực nước ổn định; căn hộ tầng cao cần xác nhận có bơm tăng áp.' },
      { severity: 'OPTIMIZE', title: 'Khoảng trống phía trước bồn cầu', message: 'Còn khoảng 520 mm, nên từ 600 mm trở lên để sử dụng thoải mái.' },
      { severity: 'SUITABLE', title: 'Kích thước lavabo', affectedProduct: 'TOTO LT4715MTG17#CMW', message: 'Vừa với mặt bàn đá 900 mm khách đã có.' },
    ],
    steps: [
      { type: 'CALL', at: 2, body: 'Đã gọi, khách đồng ý để kỹ thuật tới khảo sát tại nhà.' },
    ],
    pending: { type: 'TECHNICAL_CHECK', due: hoursFromNow(28), body: 'Khảo sát tại nhà: đo tâm xả, kiểm tra áp lực nước' },
  },

  // --- Đã xác định nhu cầu ---------------------------------------------------
  {
    key: 'L10', name: 'Ngô Gia Huy', phone: '0942 385 716', createdAt: daysAgo(7, 11, 30),
    stage: 'QUALIFIED', requestType: 'QUOTATION', roomType: 'Phòng tắm master',
    room: { length: 3.5, width: 2.8, height: 3.0 },
    materials: { floor: 'Porcelain vân đá Xám 80×160', walls: 'Marble Trắng bóng 60×120' },
    concept: 'Room Studio · Serene Stone Spa',
    items: [['AC-4005VN', 1], ['MW6808S-60', 1], ['LFV-6002S', 1], ['37311-636/DBC-1', 1], ['MT5165', 1]],
    budget: [70 * M, 85 * M],
    steps: [
      { type: 'CALL', at: 1, body: 'Khách muốn làm phòng tắm master tông đá xám, có bồn tắm massage.' },
      { type: 'MEETING', at: 50, body: 'Khách tới showroom, chốt phương án bồn tắm massage CAESAR MT5165 và sen âm tường đen.' },
      { type: 'STAGE_CHANGE', at: 50.5, body: 'Chuyển sang Đã xác định nhu cầu', metadata: { from: 'CONTACTED', to: 'QUALIFIED' } },
    ],
    pending: { type: 'QUOTE_SENT', due: hoursFromNow(6), body: 'Gửi báo giá trọn bộ phòng tắm master' },
  },
  {
    key: 'L11', name: 'Dương Mai Linh', phone: '0329 571 486', createdAt: daysAgo(8, 16, 10),
    stage: 'QUALIFIED', requestType: 'SHOWROOM_CONSULTATION', roomType: 'Phòng tắm khách',
    room: { length: 2.6, width: 2.0, height: 2.8 },
    materials: { floor: 'Gạch giả gỗ Nâu gỗ 20×120', walls: 'Gạch men Kem mờ 30×60' },
    concept: 'Room Studio · Soft Japandi Retreat',
    items: [['MS688T2', 1], ['12661-1/01K', 1], ['LFV-502SH', 1], ['36437-477/1B-I011', 1]],
    budget: [25 * M, 35 * M],
    steps: [
      { type: 'MESSAGE', at: 0.5, body: 'Đã nhắn Zalo xác nhận nhu cầu và gửi ảnh concept Japandi.' },
      { type: 'CALL', at: 26, body: 'Khách thích tông gỗ sáng, sứ trắng mờ, ngân sách khoảng 30 triệu.' },
      { type: 'NOTE', at: 26.2, body: 'Ưu tiên chậu đặt bàn dáng tròn, vòi nóng lạnh dáng thấp.' },
    ],
    pending: { type: 'MEETING', due: hoursFromNow(50), body: 'Hẹn khách xem mẫu chậu đặt bàn tại showroom' },
  },
  {
    key: 'L12', name: 'Lý Hoàng Nam', phone: '0961 248 357', createdAt: daysAgo(9, 10, 0),
    stage: 'QUALIFIED', requestType: 'TECHNICAL_CHECK', roomType: 'Phòng tắm biệt thự',
    room: { length: 3.8, width: 3.0, height: 3.2 },
    materials: { floor: 'Marble Trắng bóng 80×80', walls: 'Porcelain vân đá Be 60×120' },
    items: [['CS911VT/TCF87120GAA/T53P100VR', 1], ['LT4715MTG17#CMW', 1], ['26161-624/1B-1', 1]],
    budget: [160 * M, 190 * M],
    findings: [
      { severity: 'SUITABLE', title: 'Tâm xả và nguồn điện', affectedProduct: 'TOTO CS911VT Neorest', message: 'Đã khảo sát: tâm xả 305 mm, có sẵn ổ điện chống nước.' },
      { severity: 'OPTIMIZE', title: 'Chiều cao lắp sen nhiệt độ', affectedProduct: 'JOMOO 26161-624/1B-1', message: 'Nên nâng đầu sen lên 2,1 m để phù hợp trần 3,2 m.' },
    ],
    steps: [
      { type: 'CALL', at: 1, body: 'Khách cần kiểm tra kỹ thuật trước khi chọn bồn cầu Neorest.' },
      { type: 'TECHNICAL_CHECK', at: 72, body: 'Đã khảo sát tại công trình: tâm xả 305 mm, có sẵn ổ điện.' },
      { type: 'STAGE_CHANGE', at: 72.5, body: 'Chuyển sang Đã xác định nhu cầu', metadata: { from: 'CONTACTED', to: 'QUALIFIED' } },
    ],
    pending: { type: 'QUOTE_SENT', due: hoursFromNow(26), body: 'Gửi báo giá Neorest kèm phương án lắp đặt' },
  },

  // --- Đang báo giá ----------------------------------------------------------
  {
    key: 'L13', name: 'Phan Hồng Nhung', phone: '0909 615 384', createdAt: daysAgo(10, 9, 45),
    stage: 'QUOTING', requestType: 'QUOTATION', roomType: 'Phòng tắm master',
    room: { length: 2.8, width: 2.2, height: 2.8 },
    concept: 'Room Studio · Golden Retreat',
    items: [['AC-1017VRN', 1], ['12145-1/01Z', 1], ['LFV-112SH', 1], ['26178-624/1B-1', 1]],
    budget: [30 * M, 40 * M],
    steps: [
      { type: 'CALL', at: 0.8, body: 'Khách chọn concept Golden Retreat, muốn đổi sang sen nhiệt độ.' },
      { type: 'MEETING', at: 70, body: 'Khách tới showroom, chốt danh sách thiết bị.' },
      { type: 'STAGE_CHANGE', at: 71, body: 'Chuyển sang Đang báo giá', metadata: { from: 'QUALIFIED', to: 'QUOTING' } },
    ],
    pending: { type: 'QUOTE_SENT', due: hoursAgo(4), body: 'Hoàn thiện báo giá, chờ duyệt chiết khấu' },
    quote: { status: 'DRAFT', discountPct: 5 },
  },
  {
    key: 'L14', name: 'Cao Thành Long (nhà thầu)', phone: '0918 253 647', createdAt: daysAgo(11, 14, 20),
    stage: 'QUOTING', requestType: 'QUOTATION', roomType: 'Homestay 6 phòng tắm',
    items: [['AC-912VN', 6], ['12409-1/11Z', 6], ['LFV-1001S', 6], ['P36412-484/1B-1', 6]],
    budget: [110 * M, 130 * M],
    notes: 'Báo giá dự án, giao hàng 2 đợt.',
    steps: [
      { type: 'CALL', at: 1, body: 'Nhà thầu cần báo giá cho 6 phòng tắm homestay, giao 2 đợt.' },
      { type: 'MEETING', at: 48, body: 'Gặp nhà thầu tại showroom, thống nhất danh mục thiết bị.' },
      { type: 'NOTE', at: 48.5, body: 'Khách đề nghị chiết khấu dự án 8%, cần quản lý duyệt.' },
      { type: 'STAGE_CHANGE', at: 49, body: 'Chuyển sang Đang báo giá', metadata: { from: 'QUALIFIED', to: 'QUOTING' } },
    ],
    pending: { type: 'FOLLOW_UP', due: hoursFromNow(20), body: 'Xác nhận lịch giao đợt 1 với nhà thầu' },
    quote: { status: 'DRAFT', discountPct: 8, rooms: 6, notes: 'Báo giá dự án. Giao hàng 2 đợt, thanh toán theo từng đợt.' },
  },
  {
    key: 'L15', name: 'Hồ Bảo Ngọc', phone: '0934 728 159', createdAt: daysAgo(12, 10, 30),
    stage: 'QUOTING', requestType: 'SHOWROOM_CONSULTATION', roomType: 'Phòng tắm master',
    room: { length: 3.0, width: 2.6, height: 2.9 },
    materials: { floor: 'Porcelain vân đá Trắng 60×120', walls: 'Gạch men Trắng bóng 30×60' },
    items: [['MS855DW7', 1], ['P12663-1/01Z-1', 1], ['LFV-6002S', 1], ['70280-WT', 1]],
    budget: [30 * M, 40 * M],
    steps: [
      { type: 'MESSAGE', at: 0.4, body: 'Đã nhắn Zalo hẹn lịch xem showroom.' },
      { type: 'MEETING', at: 52, body: 'Khách xem bồn tắm đặt sàn American Standard, rất ưng.' },
      { type: 'STAGE_CHANGE', at: 53, body: 'Chuyển sang Đang báo giá', metadata: { from: 'QUALIFIED', to: 'QUOTING' } },
    ],
    pending: { type: 'QUOTE_SENT', due: hoursFromNow(2), body: 'Gửi báo giá kèm phí lắp đặt bồn tắm' },
  },

  // --- Đã gửi báo giá --------------------------------------------------------
  {
    key: 'L16', name: 'Mai Tuấn Kiệt', phone: '0916 384 572', createdAt: daysAgo(13, 9, 10),
    stage: 'QUOTE_SENT', requestType: 'QUOTATION', roomType: 'Phòng tắm master',
    room: { length: 3.4, width: 2.7, height: 3.0 },
    materials: { floor: 'Marble Be bóng 80×80', walls: 'Porcelain vân đá Kem 60×120' },
    concept: 'Room Studio · Golden Retreat',
    items: [['CS838DW11', 1], ['LT4715MTG17#CMW', 1], ['LFV-6002S', 1], ['26161-624/1B-1', 1], ['MW8305B-170.MS', 1]],
    budget: [120 * M, 140 * M],
    steps: [
      { type: 'CALL', at: 1.2, body: 'Khách dựng phòng trên Room Studio, muốn giữ nguyên concept Golden Retreat.' },
      { type: 'MEETING', at: 74, body: 'Khách tới showroom xem bồn tắm Mowoen 1,7 m.' },
    ],
    pending: { type: 'FOLLOW_UP', due: hoursFromNow(3), body: 'Gọi hỏi ý kiến khách về báo giá' },
    quote: { status: 'SENT', sentAt: 240, discountPct: 5 },
  },
  {
    key: 'L17', name: 'Tạ Thu Trang', phone: '0372 846 195', createdAt: daysAgo(15, 15, 0),
    stage: 'QUOTE_SENT', requestType: 'QUOTATION', roomType: 'Phòng tắm căn hộ',
    items: [['AC-4005VN', 1], ['MW6808S-60', 1], ['LFV-502SH', 1], ['36437-477/1B-I011', 1]],
    budget: [40 * M, 50 * M],
    steps: [
      { type: 'CALL', at: 2.5, body: 'Khách cần thay toàn bộ thiết bị phòng tắm căn hộ cũ.' },
    ],
    pending: { type: 'FOLLOW_UP', due: hoursAgo(26), body: 'Nhắc khách phản hồi báo giá' },
    quote: { status: 'SENT', sentAt: 240, discountPct: 3 },
  },
  {
    key: 'L18', name: 'Lương Quang Vinh', phone: '0398 527 614', createdAt: daysAgo(16, 8, 40),
    stage: 'QUOTE_SENT', requestType: 'TECHNICAL_CHECK', roomType: 'Phòng tắm tầng 2',
    room: { length: 2.3, width: 1.7, height: 2.7 },
    items: [['ZD7220-SA-CJM305', 1], ['12661-1/01K', 1], ['LFV-112SH', 1]],
    budget: [25 * M, 30 * M],
    findings: [
      { severity: 'SUITABLE', title: 'Tâm xả 305 mm', affectedProduct: 'JOMOO ZD7220-SA-CJM305', message: 'Đã đo tại công trình, khớp với yêu cầu sản phẩm.' },
    ],
    steps: [
      { type: 'CALL', at: 1, body: 'Đặt lịch khảo sát tâm xả.' },
      { type: 'TECHNICAL_CHECK', at: 50, body: 'Khảo sát xong, tâm xả 305 mm phù hợp.' },
    ],
    pending: { type: 'FOLLOW_UP', due: hoursFromNow(30), body: 'Gọi chốt lịch lắp đặt nếu khách đồng ý' },
    quote: { status: 'SENT', sentAt: 330, discountPct: 0 },
  },
  {
    key: 'L19', name: 'Chu Diệu Linh', phone: '0985 172 463', createdAt: daysAgo(18, 13, 25),
    stage: 'QUOTE_SENT', requestType: 'SHOWROOM_CONSULTATION', roomType: 'Phòng tắm khách',
    items: [['MS688T2', 1], ['12409-1/11Z', 1], ['LFV-1001S', 1], ['P36412-484/1B-1', 1], ['AT3350L/R', 1]],
    budget: [25 * M, 30 * M],
    steps: [
      { type: 'MESSAGE', at: 0.6, body: 'Đã nhắn Zalo hẹn khách qua showroom.' },
      { type: 'MEETING', at: 47, body: 'Khách chọn bồn tắm chân yếm 1,5 m cho phòng tắm khách.' },
    ],
    pending: { type: 'FOLLOW_UP', due: hoursFromNow(8), body: 'Gửi thêm ảnh lắp đặt thực tế bồn tắm chân yếm' },
    quote: { status: 'SENT', sentAt: 290, discountPct: 4 },
  },

  // --- Đang theo dõi ---------------------------------------------------------
  {
    key: 'L20', name: 'Đinh Hoài Nam', phone: '0948 361 725', createdAt: daysAgo(20, 10, 50),
    stage: 'FOLLOW_UP', requestType: 'QUOTATION', roomType: 'Nhà phố 2 phòng tắm',
    items: [['AC-1017VRN', 2], ['12145-1/01Z', 2], ['LFV-6002S', 2], ['26178-624/1B-1', 2]],
    budget: [60 * M, 75 * M],
    steps: [
      { type: 'CALL', at: 1, body: 'Khách làm 2 phòng tắm giống nhau cho nhà phố.' },
      { type: 'FOLLOW_UP', at: 290, body: 'Khách đang cân nhắc giữa sen nhiệt độ và sen thường.' },
      { type: 'STAGE_CHANGE', at: 290.5, body: 'Chuyển sang Đang theo dõi', metadata: { from: 'QUOTE_SENT', to: 'FOLLOW_UP' } },
    ],
    pending: { type: 'FOLLOW_UP', due: hoursFromNow(1), body: 'Gọi tư vấn thêm về sen nhiệt độ' },
    quote: { status: 'SENT', sentAt: 240, discountPct: 5, rooms: 2 },
  },
  {
    key: 'L21', name: 'Kiều Minh Châu', phone: '0353 618 927', createdAt: daysAgo(22, 9, 0),
    stage: 'FOLLOW_UP', requestType: 'QUOTATION', roomType: 'Phòng tắm master biệt thự',
    room: { length: 4.0, width: 3.2, height: 3.2 },
    materials: { floor: 'Marble Trắng bóng 80×160', walls: 'Marble Be bóng 60×120' },
    concept: 'Room Studio · Serene Premium Suite',
    items: [['CS911VT/TCF87120GAA/T53P100VR', 1], ['LT4715MTG17#CMW', 1], ['26161-624/1B-1', 1], ['MW8305B-170.MS', 1]],
    budget: [190 * M, 220 * M],
    steps: [
      { type: 'CALL', at: 0.5, body: 'Khách quan tâm bộ Neorest, cần báo giá trọn gói.' },
      { type: 'FOLLOW_UP', at: 340, body: 'Khách muốn trải nghiệm trực tiếp Neorest trước khi quyết định.' },
      { type: 'STAGE_CHANGE', at: 340.5, body: 'Chuyển sang Đang theo dõi', metadata: { from: 'QUOTE_SENT', to: 'FOLLOW_UP' } },
    ],
    pending: { type: 'MEETING', due: hoursFromNow(48), body: 'Hẹn khách trải nghiệm Neorest tại showroom' },
    quote: { status: 'SENT', sentAt: 240, discountPct: 6 },
  },
  {
    key: 'L22', name: 'Lâm Ngọc Diệp', phone: '0927 485 316', createdAt: daysAgo(24, 16, 15),
    stage: 'FOLLOW_UP', requestType: 'SHOWROOM_CONSULTATION', roomType: 'Phòng tắm căn hộ',
    items: [['MS855DW7', 1], ['12661-1/01K', 1], ['LFV-502SH', 1], ['36473-463/HBS-1', 1]],
    budget: [30 * M, 35 * M],
    steps: [
      { type: 'MESSAGE', at: 1, body: 'Đã nhắn Zalo gửi ảnh mẫu thực tế.' },
      { type: 'FOLLOW_UP', at: 400, body: 'Khách chờ chồng xem lại báo giá.' },
      { type: 'STAGE_CHANGE', at: 400.5, body: 'Chuyển sang Đang theo dõi', metadata: { from: 'QUOTE_SENT', to: 'FOLLOW_UP' } },
    ],
    pending: { type: 'FOLLOW_UP', due: hoursAgo(5), body: 'Gọi lại sau khi khách bàn với gia đình' },
    quote: { status: 'SENT', sentAt: 240, discountPct: 3 },
  },

  // --- Đã chốt -----------------------------------------------------------------
  {
    key: 'L23', name: 'Quách Gia Bảo', phone: '0903 857 241', createdAt: daysAgo(26, 10, 0),
    stage: 'WON', requestType: 'QUOTATION', roomType: 'Phòng tắm master',
    room: { length: 3.3, width: 2.6, height: 2.9 },
    concept: 'Room Studio · Warm Smart Retreat',
    items: [['AC-4005VN', 1], ['MW6808S-60', 1], ['LFV-6002S', 1], ['37311-636/DBC-1', 1], ['PAY1725VC/TVBF411', 1]],
    budget: [55 * M, 70 * M],
    steps: [
      { type: 'CALL', at: 1.5, body: 'Khách muốn làm lại phòng tắm master trước Tết.' },
      { type: 'MEETING', at: 48, body: 'Khách tới showroom chốt mẫu.' },
      { type: 'FOLLOW_UP', at: 200, body: 'Khách đồng ý báo giá, hẹn đặt cọc.' },
      { type: 'STAGE_CHANGE', at: 260, body: 'Khách chốt đơn, đặt cọc 30%', metadata: { from: 'FOLLOW_UP', to: 'WON' } },
    ],
    quote: { status: 'ACCEPTED', sentAt: 140, decidedAt: daysAgo(15, 15, 0), discountPct: 5 },
  },
  {
    key: 'L24', name: 'Hà Trung Kiên (homestay)', phone: '0975 316 482', createdAt: daysAgo(29, 9, 30),
    stage: 'WON', requestType: 'QUOTATION', roomType: 'Homestay 4 phòng tắm',
    items: [['AC-912VN', 4], ['12409-1/11Z', 4], ['LFV-1001S', 4], ['P36412-484/1B-1', 4]],
    budget: [75 * M, 90 * M],
    steps: [
      { type: 'CALL', at: 2, body: 'Chủ homestay cần trọn bộ thiết bị cho 4 phòng.' },
      { type: 'MEETING', at: 72, body: 'Thống nhất danh mục và tiến độ giao hàng.' },
      { type: 'STAGE_CHANGE', at: 410, body: 'Khách ký hợp đồng, giao hàng tuần sau', metadata: { from: 'QUOTE_SENT', to: 'WON' } },
    ],
    quote: { status: 'ACCEPTED', sentAt: 120, decidedAt: daysAgo(12, 11, 0), discountPct: 7, rooms: 4, notes: 'Báo giá dự án 4 phòng tắm. Giao hàng 1 đợt.' },
  },
  {
    key: 'L25', name: 'Nghiêm Thùy Dương', phone: '0376 192 548', createdAt: daysAgo(34, 14, 10),
    stage: 'WON', requestType: 'SHOWROOM_CONSULTATION', roomType: 'Phòng tắm khách',
    items: [['MS688T2', 1], ['P12663-1/01Z-1', 1], ['LFV-112SH', 1], ['36437-477/1B-I011', 1]],
    budget: [25 * M, 35 * M],
    steps: [
      { type: 'MESSAGE', at: 0.5, body: 'Đã nhắn Zalo hẹn lịch xem showroom.' },
      { type: 'MEETING', at: 96, body: 'Khách xem mẫu, chọn bồn cầu TOTO một khối.' },
      { type: 'STAGE_CHANGE', at: 630, body: 'Khách chốt đơn', metadata: { from: 'FOLLOW_UP', to: 'WON' } },
    ],
    quote: { status: 'ACCEPTED', sentAt: 220, decidedAt: daysAgo(8, 10, 0), discountPct: 4 },
  },
  {
    key: 'L26', name: 'Võ Đình Phúc', phone: '0965 734 812', createdAt: daysAgo(19, 11, 15),
    stage: 'WON', requestType: 'TECHNICAL_CHECK', roomType: 'Phòng tắm căn hộ cao cấp',
    room: { length: 2.6, width: 2.1, height: 2.8 },
    items: [['ZD8610-SA-IDO305', 1], ['LT4715MTG17#CMW', 1], ['LFV-6002S', 1]],
    budget: [80 * M, 90 * M],
    findings: [
      { severity: 'SUITABLE', title: 'Áp lực nước', affectedProduct: 'JOMOO ZD8610-SA-IDO305', message: 'Toà nhà có bơm tăng áp, áp lực đạt yêu cầu.' },
    ],
    steps: [
      { type: 'CALL', at: 1, body: 'Khách cần kiểm tra áp lực nước trước khi chọn bồn cầu thông minh.' },
      { type: 'TECHNICAL_CHECK', at: 50, body: 'Khảo sát xong, áp lực nước đạt yêu cầu.' },
      { type: 'STAGE_CHANGE', at: 350, body: 'Khách chốt đơn, hẹn lắp đặt cuối tuần', metadata: { from: 'QUOTE_SENT', to: 'WON' } },
    ],
    quote: { status: 'ACCEPTED', sentAt: 120, decidedAt: daysAgo(4, 16, 30), discountPct: 3 },
  },
  {
    key: 'L27', name: 'Âu Mỹ Duyên', phone: '0917 263 584', createdAt: daysAgo(40, 9, 0),
    stage: 'WON', requestType: 'QUOTATION', roomType: 'Phòng tắm master',
    concept: 'Room Studio · Master Spa Retreat',
    items: [['AC-1017VRN', 1], ['12661-1/01K', 1], ['LFV-502SH', 1], ['26178-624/1B-1', 1], ['MT5165', 1]],
    budget: [60 * M, 70 * M],
    steps: [
      { type: 'CALL', at: 1, body: 'Khách muốn có bồn tắm massage trong phòng tắm master.' },
      { type: 'STAGE_CHANGE', at: 290, body: 'Khách chốt đơn', metadata: { from: 'QUOTE_SENT', to: 'WON' } },
    ],
    quote: { status: 'ACCEPTED', sentAt: 96, decidedAt: daysAgo(28, 10, 0), discountPct: 5 },
  },

  // --- Không thành công --------------------------------------------------------
  {
    key: 'L28', name: 'Trịnh Khánh Vy', phone: '0387 465 129', createdAt: daysAgo(28, 15, 30),
    stage: 'LOST', requestType: 'QUOTATION', roomType: 'Phòng tắm căn hộ',
    items: [['CS838DW11', 1], ['MW6808S-60', 1], ['LFV-6002S', 1]],
    budget: [35 * M, 40 * M],
    steps: [
      { type: 'CALL', at: 3, body: 'Khách cần báo giá bồn cầu điện tử TOTO.' },
      { type: 'STAGE_CHANGE', at: 450, body: 'Khách chọn phương án rẻ hơn ở nơi khác', metadata: { from: 'QUOTE_SENT', to: 'LOST' } },
    ],
    quote: { status: 'REJECTED', sentAt: 50, decidedAt: daysAgo(9, 14, 0), discountPct: 3 },
  },
  {
    key: 'L29', name: 'Tô Minh Quân', phone: '0912 674 305', createdAt: daysAgo(36, 10, 20),
    stage: 'LOST', requestType: 'SHOWROOM_CONSULTATION', roomType: 'WC tầng 1',
    items: [['11416-2-231K', 1], ['12409-1/11Z', 1], ['LFV-1001S', 1]],
    budget: [12 * M, 16 * M],
    steps: [
      { type: 'CALL', at: 2, body: 'Khách cần tư vấn WC tầng 1.' },
      { type: 'STAGE_CHANGE', at: 560, body: 'Khách hoãn sửa nhà sang năm sau', metadata: { from: 'QUOTE_SENT', to: 'LOST' } },
    ],
    quote: { status: 'EXPIRED', sentAt: 70, discountPct: 0 },
  },
];

// ---------------------------------------------------------------------------
// Build rows
// ---------------------------------------------------------------------------

const LEGACY_STATUS: Record<LeadStage, LeadStatus> = {
  NEW: 'NEW', CONTACTED: 'CONTACTED', QUALIFIED: 'CONTACTED', QUOTING: 'CONTACTED',
  QUOTE_SENT: 'QUOTED', FOLLOW_UP: 'QUOTED', WON: 'WON', LOST: 'LOST',
};

function nextActionType(type: LeadActivityType): LeadNextActionType {
  switch (type) {
    case 'CALL': return 'CALL';
    case 'MESSAGE': return 'MESSAGE';
    case 'MEETING': return 'MEETING';
    case 'QUOTE_SENT': return 'SEND_QUOTE';
    case 'TECHNICAL_CHECK': return 'TECHNICAL_CHECK';
    default: return 'FOLLOW_UP';
  }
}

const CONTACT_TYPES: LeadActivityType[] = ['CALL', 'MESSAGE', 'MEETING'];
const INSTALL_FEE = 1_500_000;

const normalizePhone = (value: string) => value.replace(/\D/g, '');
const roundTo = (value: number, step: number) => Math.round(value / step) * step;
const millions = (value: number) => `${value / M}`;

function budgetFit(total: number, min: number, max: number) {
  if (total < min) return 'UNDER_BUDGET' as const;
  if (total <= max) return 'WITHIN_BUDGET' as const;
  if (total <= max * 1.1) return 'SLIGHTLY_OVER_BUDGET' as const;
  return 'OVER_BUDGET' as const;
}

async function main(userId: string, tx: Prisma.TransactionClient) {
  const summary: string[] = [];
  const leads: Prisma.QuoteLeadCreateManyInput[] = [];
  const items: Prisma.QuoteItemCreateManyInput[] = [];
  const quotes: Prisma.QuoteCreateManyInput[] = [];
  const lines: Prisma.QuoteLineCreateManyInput[] = [];
  const activities: Prisma.LeadActivityCreateManyInput[] = [];

  // Codes are issued in the order the requests arrived, continuing whatever
  // series already exists, under the same locks the application takes.
  const year = new Date().getFullYear();
  const ycPrefix = `YC-${year}-`;
  const bgPrefix = `BG-${year}-`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`livlab:${ycPrefix}`}))`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`livlab:${bgPrefix}`}))`;
  const lastYc = await tx.quoteLead.findFirst({ where: { requestCode: { startsWith: ycPrefix } }, orderBy: { requestCode: 'desc' }, select: { requestCode: true } });
  const lastBg = await tx.quote.findFirst({ where: { code: { startsWith: bgPrefix } }, orderBy: { code: 'desc' }, select: { code: true } });
  let yc = lastYc?.requestCode ? Number.parseInt(lastYc.requestCode.slice(ycPrefix.length), 10) : 0;
  let bg = lastBg?.code ? Number.parseInt(lastBg.code.slice(bgPrefix.length), 10) : 0;

  const chronological = [...PLANS].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const quoteOrder = chronological
    .filter((plan) => plan.quote)
    .map((plan) => ({ plan, createdAt: quoteCreatedAt(plan) }))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const quoteCodes = new Map(quoteOrder.map(({ plan }) => [plan.key, `${bgPrefix}${String(++bg).padStart(4, '0')}`]));

  for (const plan of chronological) {
    const leadId = `${PREFIX}lead-${plan.key}`;
    const requestCode = `${ycPrefix}${String(++yc).padStart(6, '0')}`;
    const products = plan.items.map(([sku, qty]) => ({ ...product(sku), qty }));
    const estimatedValue = products.reduce((sum, p) => sum + p.price * p.qty, 0);
    const [budgetMin, budgetMax] = plan.budget;

    // Activity timeline: completed steps, an optional quote-sent step, and the
    // one pending action that the lead's nextAction* columns mirror.
    const done: Step[] = [...plan.steps];
    const quoteId = `${PREFIX}quote-${plan.key}`;
    if (plan.quote?.sentAt !== undefined) {
      done.push({
        type: 'QUOTE_SENT', at: plan.quote.sentAt,
        body: `Đã gửi báo giá ${quoteCodes.get(plan.key)} qua Zalo`,
        metadata: { quoteId, code: quoteCodes.get(plan.key) },
      });
    }
    done.sort((a, b) => a.at - b.at);

    let firstContactAt: Date | null = null;
    let lastTouch = plan.createdAt;
    done.forEach((step, index) => {
      const at = plus(plan.createdAt, step.at);
      if (at.getTime() > NOW) throw new Error(`${plan.key}: activity "${step.body}" would be in the future.`);
      if (!firstContactAt && CONTACT_TYPES.includes(step.type)) firstContactAt = at;
      if (at > lastTouch) lastTouch = at;
      activities.push({
        id: `${PREFIX}act-${plan.key}-${String(index + 1).padStart(2, '0')}`,
        leadId, showroomId: WORKSPACE_ID, type: step.type, body: step.body,
        metadataJson: step.metadata ? (step.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
        isInternal: true, dueAt: null, doneAt: at, createdById: userId, createdAt: at,
      });
    });
    if (plan.pending) {
      const scheduledAt = new Date(Math.min(NOW - 0.5 * HOUR, Math.max(lastTouch.getTime() + 0.25 * HOUR, plan.createdAt.getTime() + 0.25 * HOUR)));
      activities.push({
        id: `${PREFIX}act-${plan.key}-next`,
        leadId, showroomId: WORKSPACE_ID, type: plan.pending.type, body: plan.pending.body,
        metadataJson: Prisma.DbNull, isInternal: true, dueAt: plan.pending.due, doneAt: null,
        createdById: userId, createdAt: scheduledAt,
      });
      if (scheduledAt > lastTouch) lastTouch = scheduledAt;
    }
    if (plan.quote?.decidedAt && plan.quote.decidedAt > lastTouch) lastTouch = plan.quote.decidedAt;

    leads.push({
      id: leadId,
      requestCode,
      normalizedPhone: normalizePhone(plan.phone),
      sourceTenantId: 'tungdang',
      submissionKey: `${PREFIX}seed-${plan.key}`,
      customerName: plan.name,
      phone: plan.phone,
      email: null,
      roomType: plan.roomType,
      budgetRange: `${millions(budgetMin)} – ${millions(budgetMax)} triệu`,
      budgetMin, budgetMax,
      budgetFit: budgetFit(estimatedValue, budgetMin, budgetMax),
      conceptName: plan.concept ?? null,
      estimatedValue,
      notes: plan.notes ?? null,
      consent: true,
      showroomId: WORKSPACE_ID,
      requestType: plan.requestType,
      stage: plan.stage,
      status: LEGACY_STATUS[plan.stage],
      nextActionType: plan.pending ? nextActionType(plan.pending.type) : null,
      nextActionAt: plan.pending?.due ?? null,
      nextActionNote: plan.pending?.body ?? null,
      assignedToId: plan.stage === 'NEW' && !plan.pending ? null : userId,
      firstContactAt,
      contextJson: {
        version: 3,
        source: 'PUBLIC_STOREFRONT',
        tenantId: 'tungdang',
        workspaceKind: 'DEMO',
        demoSeed: true,
        ...(plan.room ? { room: plan.room } : {}),
        ...(plan.materials ? { materials: plan.materials } : {}),
        ...(plan.findings ? { technicalFindings: plan.findings } : {}),
        catalogLines: products.map((p) => ({
          catalogProductId: null, sourceType: 'DEMO_FIXTURE', sku: p.sku, priceSnapshot: p.price, sourceContext: null, quantity: p.qty,
        })),
      },
      createdAt: plan.createdAt,
      updatedAt: lastTouch,
    });

    summary.push(`${requestCode} ${plan.key} ${plan.stage.padEnd(10)} ${String(Math.round(estimatedValue / 100_000) / 10).padStart(6)}tr / ${millions(budgetMin)}–${millions(budgetMax)}tr ${leads.at(-1)!.budgetFit}`);

    products.forEach((p, index) => {
      items.push({
        id: `${PREFIX}item-${plan.key}-${index + 1}`,
        leadId, productId: null, productName: p.name, quantity: p.qty, priceMin: p.price, priceMax: p.reference,
      });
    });

    if (plan.quote) {
      const q = plan.quote;
      const rooms = q.rooms ?? 1;
      const quoteLines = [
        ...products.map((p) => ({
          type: 'PRODUCT' as const, skuSnapshot: p.sku, nameSnapshot: p.name, brandSnapshot: p.brand,
          description: null, quantity: p.qty, referencePriceSnapshot: p.reference, unitPrice: p.price,
        })),
        {
          type: 'SERVICE' as const, skuSnapshot: null, nameSnapshot: 'Vận chuyển & lắp đặt trọn gói', brandSnapshot: null,
          description: rooms > 1 ? `Đơn giá theo phòng tắm, ${rooms} phòng` : 'Bao gồm vật tư phụ, chạy thử và bàn giao',
          quantity: rooms, referencePriceSnapshot: null, unitPrice: INSTALL_FEE,
        },
      ];
      const subtotal = quoteLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
      const discount = roundTo((subtotal * q.discountPct) / 100, 100_000);
      const createdAt = quoteCreatedAt(plan);
      const sentAt = q.sentAt !== undefined ? plus(plan.createdAt, q.sentAt) : null;

      quotes.push({
        id: quoteId,
        code: quoteCodes.get(plan.key)!,
        leadId,
        showroomId: WORKSPACE_ID,
        status: q.status,
        customerNameSnapshot: plan.name,
        customerPhoneSnapshot: plan.phone,
        customerEmailSnapshot: null,
        subtotal, discount, total: subtotal - discount,
        validUntil: new Date((sentAt ?? createdAt).getTime() + 15 * DAY),
        notes: q.notes ?? 'Giá đã bao gồm VAT. Bảo hành chính hãng theo chính sách nhà sản xuất.',
        sentAt,
        decidedAt: q.decidedAt ?? null,
        createdById: userId,
        createdAt,
        updatedAt: q.decidedAt ?? sentAt ?? createdAt,
      });
      quoteLines.forEach((line, index) => {
        lines.push({
          id: `${PREFIX}line-${plan.key}-${index + 1}`,
          quoteId, ...line, discountAmount: 0, lineTotal: line.unitPrice * line.quantity, sortOrder: index, createdAt,
        });
      });
    }
  }

  await tx.quoteLead.createMany({ data: leads });
  await tx.quoteItem.createMany({ data: items });
  await tx.quote.createMany({ data: quotes });
  await tx.quoteLine.createMany({ data: lines });
  await tx.leadActivity.createMany({ data: activities });

  if (DRY_RUN) console.log(summary.join('\n'));
  return { leads: leads.length, items: items.length, quotes: quotes.length, lines: lines.length, activities: activities.length, requestCodes: `${leads[0].requestCode} … ${leads.at(-1)!.requestCode}`, quoteCodes: `${quotes.map((q) => q.code).sort()[0]} … ${quotes.map((q) => q.code).sort().at(-1)}` };
}

/** Drafts are recent; a sent quote is prepared a few hours before it goes out. */
function quoteCreatedAt(plan: LeadPlan): Date {
  const q = plan.quote!;
  if (q.sentAt !== undefined) return plus(plan.createdAt, Math.max(q.sentAt - 3, 0.5));
  return new Date(Math.min(NOW - 2 * HOUR, plan.createdAt.getTime() + 74 * HOUR));
}

async function removeDemoRows(tx: Prisma.TransactionClient) {
  const owned = { showroomId: WORKSPACE_ID, id: { startsWith: PREFIX } };
  // Quote lines cascade from quotes; items and activities from leads. They are
  // deleted explicitly anyway so the counts below are honest.
  const activities = await tx.leadActivity.deleteMany({ where: owned });
  const lines = await tx.quoteLine.deleteMany({ where: { quote: owned } });
  const quotes = await tx.quote.deleteMany({ where: owned });
  const items = await tx.quoteItem.deleteMany({ where: { lead: owned } });
  const leads = await tx.quoteLead.deleteMany({ where: owned });
  return { leads: leads.count, items: items.count, quotes: quotes.count, lines: lines.count, activities: activities.count };
}

const prisma = new PrismaClient();
try {
  const workspace = await prisma.showroom.findUnique({ where: { id: WORKSPACE_ID } });
  if (!workspace || workspace.tenantKey !== 'tungdang' || workspace.workspaceKind !== 'DEMO') {
    throw new Error('Refusing: workspace-demo-tungdang is missing or is not the DEMO workspace bound to tungdang.');
  }
  const user = await prisma.user.findFirst({ where: { showroomId: WORKSPACE_ID, role: 'SHOWROOM' }, orderBy: { createdAt: 'asc' } });
  if (!user) throw new Error('No SHOWROOM account is linked to the Tùng Đăng workspace; run configure:tungdang-demo first.');

  class RolledBack extends Error {
    result: unknown;
    constructor(result: unknown) { super('dry run'); this.result = result; }
  }
  let result: unknown;
  try {
    result = await prisma.$transaction(async (tx) => {
      const removed = await removeDemoRows(tx);
      if (RESET_ONLY) return { removed };
      const created = await main(user.id, tx);
      if (DRY_RUN) throw new RolledBack({ removed, created, rolledBack: true });
      return { removed, created };
    }, { timeout: 60_000, maxWait: 15_000 });
  } catch (error) {
    if (!(error instanceof RolledBack)) throw error;
    result = error.result;
  }

  console.log(JSON.stringify({ workspace: WORKSPACE_ID, assignee: user.email, result }, null, 2));
} finally {
  await prisma.$disconnect();
}
