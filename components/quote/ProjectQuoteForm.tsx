'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';

type BoqRow = { id: string; category: string; name: string; sku: string; specification: string; unit: string; quantity: string; note: string };
const blankRow = (): BoqRow => ({ id: crypto.randomUUID(), category: '', name: '', sku: '', specification: '', unit: 'cái', quantity: '1', note: '' });
const inputClass = 'h-11 w-full border border-[#CCD8DB] bg-white px-3 text-sm text-[#243746] outline-none focus:border-[color:var(--tenant-accent)] focus:ring-2 focus:ring-[color:var(--tenant-accent)]/15';

export default function ProjectQuoteForm() {
  const [rows, setRows] = useState<BoqRow[]>([blankRow()]);
  const [form, setForm] = useState({ company: '', contact: '', phone: '', email: '', projectName: '', projectType: '', location: '', timeline: '', notes: '', consent: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestCode, setRequestCode] = useState('');
  const submissionKey = useRef<string | null>(null);

  const updateRow = (id: string, key: keyof BoqRow, value: string) => setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
  const update = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const validRows = rows.filter((row) => row.name.trim() && Number(row.quantity) > 0 && row.unit.trim());
    if (!form.contact.trim() || !form.phone.trim() || !form.projectName.trim() || !form.location.trim() || !form.consent) {
      setError('Vui lòng điền người liên hệ, số điện thoại, tên dự án, địa điểm và xác nhận đồng ý xử lý dữ liệu.');
      return;
    }
    if (validRows.length === 0) { setError('Vui lòng thêm ít nhất một dòng vật tư hợp lệ.'); return; }
    setLoading(true);
    try {
      submissionKey.current ??= crypto.randomUUID();
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': submissionKey.current },
        body: JSON.stringify({
          customerName: form.contact,
          phone: form.phone,
          email: form.email || null,
          roomType: form.projectType || 'Công trình',
          budgetRange: 'Xác nhận theo BOQ',
          requestType: 'PROJECT_RFQ',
          notes: form.notes || null,
          context: {
            version: 1,
            source: 'PROJECT_RFQ_FORM',
            companyName: form.company || null,
            projectName: form.projectName,
            projectType: form.projectType || null,
            projectLocation: form.location,
            requestedTimeline: form.timeline || null,
            boqRows: validRows.map((row, index) => ({
              stt: index + 1,
              category: row.category,
              name: row.name,
              sku: row.sku,
              specification: row.specification,
              unit: row.unit,
              quantity: Number(row.quantity),
              note: row.note,
            })),
            attachment: { supported: false, reason: 'Persistent secure upload storage is not configured.' },
          },
          items: validRows.map((row) => ({
            id: `manual:${row.id}`,
            name: row.name,
            brand: '',
            category: row.category || 'Vật tư công trình',
            sku: row.sku || null,
            quantity: Math.max(1, Math.ceil(Number(row.quantity))),
            priceType: 'NONE',
            priceUnit: row.unit,
            sourceContext: 'PROJECT_RFQ_MANUAL',
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chưa thể gửi yêu cầu.');
      setRequestCode(data.requestCode);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa thể gửi yêu cầu.');
    } finally { setLoading(false); }
  }

  if (requestCode) return (
    <section className="mx-auto max-w-2xl border border-[#D4E1E3] bg-white p-8 text-center md:p-12">
      <p className="text-xs font-semibold tracking-[.15em] text-[color:var(--tenant-accent-ink)]">ĐÃ GHI NHẬN YÊU CẦU</p>
      <h2 className="mt-4 text-3xl font-medium text-[color:var(--tenant-ink)]">Mã yêu cầu: {requestCode}</h2>
      <p className="mt-4 text-sm leading-6 text-[#647277]">Lưu mã này cùng số điện thoại để tra cứu trạng thái. Báo giá chính thức sẽ được xác nhận riêng.</p>
      <Link href="/track-quote" className="mt-7 inline-flex h-11 items-center bg-[color:var(--tenant-accent)] px-6 text-xs font-semibold tracking-[.08em] text-white">TRA CỨU YÊU CẦU</Link>
    </section>
  );

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="border border-[#D4E1E3] bg-white p-6 md:p-9">
        <h2 className="text-xl font-medium text-[color:var(--tenant-ink)]">Thông tin dự án & liên hệ</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {[
            ['company', 'Công ty / đơn vị', false], ['contact', 'Người liên hệ *', true], ['phone', 'Số điện thoại *', true],
            ['email', 'Email', false], ['projectName', 'Tên dự án *', true], ['projectType', 'Loại công trình', false],
            ['location', 'Địa điểm giao / công trình *', true], ['timeline', 'Tiến độ cần hàng', false],
          ].map(([key, label]) => <label key={String(key)} className="text-xs font-semibold tracking-[.06em] text-[#5E6A70]">{label}<input value={String(form[key as keyof typeof form] ?? '')} onChange={(event) => update(key as keyof typeof form, event.target.value)} className={`${inputClass} mt-2`} /></label>)}
        </div>
      </section>

      <section className="border border-[#D4E1E3] bg-white p-6 md:p-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-xl font-medium text-[color:var(--tenant-ink)]">Danh sách vật tư</h2><p className="mt-2 text-sm text-[#6A767B]">Số lượng và đơn vị được lưu nguyên dạng trong hồ sơ yêu cầu.</p></div>
          <a href="/demo/giangson/GiangSon_BOQ_Template.xlsx" download className="text-xs font-semibold tracking-[.08em] text-[color:var(--tenant-accent-ink)] underline underline-offset-4">TẢI MẪU EXCEL</a>
        </div>
        <div className="mt-6 space-y-5">
          {rows.map((row, index) => (
            <fieldset key={row.id} className="grid gap-3 border border-[#DFE7E9] p-4 md:grid-cols-12">
              <legend className="px-2 text-xs font-semibold text-[#718087]">Dòng {index + 1}</legend>
              <input aria-label="Nhóm vật tư" placeholder="Nhóm vật tư" value={row.category} onChange={(e) => updateRow(row.id, 'category', e.target.value)} className={`${inputClass} md:col-span-3`} />
              <input aria-label="Tên vật tư" placeholder="Tên vật tư *" value={row.name} onChange={(e) => updateRow(row.id, 'name', e.target.value)} className={`${inputClass} md:col-span-5`} />
              <input aria-label="Mã sản phẩm" placeholder="Mã (nếu có)" value={row.sku} onChange={(e) => updateRow(row.id, 'sku', e.target.value)} className={`${inputClass} md:col-span-4`} />
              <input aria-label="Quy cách" placeholder="Quy cách" value={row.specification} onChange={(e) => updateRow(row.id, 'specification', e.target.value)} className={`${inputClass} md:col-span-5`} />
              <input aria-label="Đơn vị" placeholder="Đơn vị *" value={row.unit} onChange={(e) => updateRow(row.id, 'unit', e.target.value)} className={`${inputClass} md:col-span-2`} />
              <input aria-label="Số lượng" type="number" min="0.01" step="0.01" value={row.quantity} onChange={(e) => updateRow(row.id, 'quantity', e.target.value)} className={`${inputClass} md:col-span-2`} />
              <input aria-label="Ghi chú vật tư" placeholder="Ghi chú" value={row.note} onChange={(e) => updateRow(row.id, 'note', e.target.value)} className={`${inputClass} md:col-span-3`} />
              {rows.length > 1 && <button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} className="text-left text-xs font-semibold text-[#9B3C36] md:col-span-12">XÓA DÒNG</button>}
            </fieldset>
          ))}
        </div>
        <button type="button" onClick={() => setRows((current) => [...current, blankRow()])} className="mt-5 h-10 border border-[color:var(--tenant-accent)] px-4 text-xs font-semibold tracking-[.07em] text-[color:var(--tenant-accent-ink)]">+ THÊM DÒNG</button>
        <div className="mt-7 border-l-2 border-[#19A5A2] bg-[#F1F7F8] p-4 text-sm leading-6 text-[#5E6A70]">Tải BOQ trực tiếp chưa được bật vì hệ thống chưa có kho tệp bền vững và kiểm soát truy cập. Bạn có thể dùng mẫu Excel rồi nhập các dòng chính tại đây; hệ thống không giả lập việc upload thành công.</div>
      </section>

      <section className="border border-[#D4E1E3] bg-white p-6 md:p-9">
        <label className="text-xs font-semibold tracking-[.06em] text-[#5E6A70]">Ghi chú kỹ thuật<textarea rows={4} value={form.notes} onChange={(e) => update('notes', e.target.value)} className="mt-2 w-full border border-[#CCD8DB] p-3 text-sm outline-none focus:border-[color:var(--tenant-accent)]" /></label>
        <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-[#5E6A70]"><input type="checkbox" checked={form.consent} onChange={(e) => update('consent', e.target.checked)} className="mt-1 h-4 w-4 accent-[color:var(--tenant-accent)]" />Tôi đồng ý để LivLab và đơn vị tiếp nhận xử lý thông tin nhằm phản hồi yêu cầu báo giá.</label>
        {error && <p role="alert" className="mt-4 text-sm text-[#A23D32]">{error}</p>}
        <button disabled={loading} className="mt-7 inline-flex h-12 items-center bg-[color:var(--tenant-accent)] px-7 text-xs font-semibold tracking-[.09em] text-white disabled:opacity-60">{loading ? 'ĐANG GỬI…' : 'GỬI YÊU CẦU CÔNG TRÌNH'}</button>
      </section>
    </form>
  );
}
