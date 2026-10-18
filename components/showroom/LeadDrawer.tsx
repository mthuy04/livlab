'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Package, Phone, X } from 'lucide-react';
import { STAGE_LABEL, STAGE_ORDER } from '@/lib/showroom/leadStage';
import { money, relativeTime } from '@/components/showroom/ui/format';
import { CX } from '@/components/showroom/ui/tokens';

interface LeadDetail {
  id: string; requestCode: string | null; customerName: string; phone: string | null; email: string | null;
  roomType: string | null; conceptName: string | null; notes: string | null; effectiveStage: string;
  budgetRange: string | null; estimatedValue: number | null; createdAt: string;
  items: { id: string; productName: string; quantity: number; priceMin: number | null; product: { brand: string | null; slug: string | null } | null }[];
  quotes: { id: string; code: string; status: string; total: number; createdAt: string }[];
  activities: { id: string; type: string; body: string | null; createdAt: string; createdBy: { name: string | null; email: string } | null }[];
}

export default function LeadDrawer({ leadId, onClose, onChanged }: { leadId: string; onClose: () => void; onChanged: () => void }) {
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [tab, setTab] = useState<'overview' | 'products' | 'history'>('overview');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch(`/api/showroom/leads/${leadId}`);
    if (response.ok) setLead((await response.json()).lead);
  }
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/showroom/leads/${leadId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && data?.lead) setLead(data.lead);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [leadId]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);

  async function updateStage(stage: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/showroom/leads/${leadId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }) });
      if (response.ok) { await load(); onChanged(); }
    } finally { setBusy(false); }
  }
  async function addNote() {
    if (!note.trim()) return;
    setBusy(true);
    try {
      const response = await fetch('/api/showroom/activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, type: 'NOTE', body: note.trim() }) });
      if (response.ok) { setNote(''); await load(); onChanged(); }
    } finally { setBusy(false); }
  }
  async function createQuote() {
    setBusy(true);
    try {
      const response = await fetch('/api/showroom/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId }) });
      if (response.ok) router.push(`/showroom/quotes/${(await response.json()).quote.id}`);
    } finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-[70] flex justify-end bg-[#22221E]/35 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside role="dialog" aria-modal="true" aria-label="Chi tiết yêu cầu" className="h-full w-full max-w-[580px] overflow-y-auto bg-[#FFFEFD] shadow-[-18px_0_50px_#1112]">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#F1F0EB] bg-[#FFFEFD]/95 px-6 py-5 backdrop-blur">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#B47A1D]">Chi tiết yêu cầu</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.035em]">{lead?.requestCode ?? 'Đang tải…'}</h2>{lead && <span className="mt-2 inline-block rounded-lg bg-[#FFF1D3] px-2 py-1 text-[10px] font-bold text-[#AF7416]">{STAGE_LABEL[lead.effectiveStage as keyof typeof STAGE_LABEL]}</span>}</div>
        <button type="button" aria-label="Đóng" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-[#777871] hover:bg-[#F5F3ED]"><X className="h-5 w-5" /></button>
      </header>
      {!lead ? <div className="p-6"><div className="h-32 animate-pulse rounded-xl bg-[#F5F3EF]" /></div> : <>
        <div className="px-6 pt-5"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#F6F0E6] text-sm font-extrabold text-[#A1835B]">{lead.customerName.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase()}</span><div><strong className="text-base">{lead.customerName}</strong><p className="mt-1 text-[11px] text-[#A2A59F]">{lead.phone || 'Chưa có số điện thoại'} · {relativeTime(lead.createdAt)}</p></div></div>
          <div className="mt-5 flex gap-1.5 border-b border-[#ECEDE9]">{([['overview','Tổng quan'],['products','Sản phẩm'],['history','Lịch sử']] as const).map(([key,label]) => <button key={key} onClick={() => setTab(key)} className={`border-b-2 px-3 py-3 text-xs font-bold ${tab === key ? 'border-[#EDAB3D] text-[#B47A1D]' : 'border-transparent text-[#9EA09B]'}`}>{label}</button>)}</div>
        </div>
        <div className="space-y-4 px-6 pb-24 pt-5">
          {tab === 'overview' && <>
            <DrawerSection title="Thông tin yêu cầu"><Pair label="Không gian" value={lead.roomType || '—'} /><Pair label="Concept" value={lead.conceptName || '—'} /><Pair label="Ngân sách" value={lead.budgetRange || '—'} /><Pair label="Giá trị tham khảo" value={money(lead.estimatedValue)} /><Pair label="Số sản phẩm" value={String(lead.items.length)} /></DrawerSection>
            {lead.notes && <DrawerSection title="Nhu cầu khách hàng"><p className="text-xs leading-6 text-[#777C75] whitespace-pre-line">{lead.notes}</p></DrawerSection>}
            <DrawerSection title="Cập nhật xử lý"><select value={lead.effectiveStage} disabled={busy} onChange={(event) => void updateStage(event.target.value)} className={`${CX.input} w-full`}>{STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{STAGE_LABEL[stage]}</option>)}</select><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú nội bộ…" rows={3} className={`${CX.input} mt-3 h-auto w-full resize-y py-2`} /><button type="button" onClick={() => void addNote()} disabled={busy || !note.trim()} className={`${CX.buttonSecondary} mt-2`}>Lưu ghi chú</button></DrawerSection>
          </>}
          {tab === 'products' && <DrawerSection title="Thiết bị khách quan tâm">{lead.items.length === 0 ? <p className="text-xs text-[#90948D]">Khách chưa chọn sản phẩm cụ thể.</p> : lead.items.map((item) => <div key={item.id} className="flex items-center gap-3 border-b border-[#EAEAE6] py-3 last:border-0"><span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#FFF1D8] text-[#AA7822]"><Package className="h-4 w-4" /></span><div className="min-w-0 flex-1"><b className="block truncate text-xs">{item.productName}</b><span className="text-[11px] text-[#90948D]">{item.product?.brand || 'Thiết bị'} · SL {item.quantity}</span></div><b className="text-xs">{money((item.priceMin ?? 0) * item.quantity)}</b></div>)}</DrawerSection>}
          {tab === 'history' && <DrawerSection title="Dòng thời gian">{lead.activities.length === 0 ? <p className="text-xs text-[#90948D]">Chưa có hoạt động.</p> : lead.activities.map((activity) => <div key={activity.id} className="flex gap-3 border-b border-[#EAEAE6] py-3 last:border-0"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#F3F0E9] text-[#B08C52]"><Phone className="h-4 w-4" /></span><div><b className="text-xs">{activity.body || activity.type}</b><p className="mt-1 text-[10px] text-[#A3A6A0]">{activity.createdBy?.name || activity.createdBy?.email || 'Hệ thống'} · {relativeTime(activity.createdAt)}</p></div></div>)}</DrawerSection>}
        </div>
        <footer className="fixed bottom-0 right-0 flex w-full max-w-[580px] justify-end gap-2 border-t border-[#EFEEE9] bg-white/95 px-6 py-4 backdrop-blur"><button onClick={onClose} className={CX.buttonSecondary}>Đóng</button>{lead.quotes[0] ? <button onClick={() => router.push(`/showroom/quotes/${lead.quotes[0].id}`)} className={CX.buttonPrimary}><FileText className="h-4 w-4" /> Mở báo giá</button> : <button onClick={() => void createQuote()} disabled={busy} className={CX.buttonPrimary}><FileText className="h-4 w-4" /> Lập báo giá</button>}</footer>
      </>}
    </aside>
  </div>;
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[14px] border border-[#F1F0EC] bg-[#FAF9F6] p-5"><h3 className="mb-3 text-xs font-extrabold">{title}</h3>{children}</section>; }
function Pair({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-[#F0EFEB] py-2.5 text-xs last:border-0"><span className="text-[#9B9D96]">{label}</span><b className="text-right">{value}</b></div>; }
