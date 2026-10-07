'use client';

import { useEffect, useState } from 'react';
import { PageShell, Section, MigrationNotice } from '@/components/showroom/ui/primitives';

interface Showroom {
  id: string; name: string; contactName: string | null;
  email: string | null; phone: string | null; address: string | null;
}

const FIELDS: { key: keyof Showroom; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Tên showroom', placeholder: 'VD: Luxbath Studio Hà Nội' },
  { key: 'contactName', label: 'Người phụ trách', placeholder: 'Họ và tên' },
  { key: 'phone', label: 'Điện thoại', placeholder: '09xx xxx xxx' },
  { key: 'email', label: 'Email', placeholder: 'showroom@example.com' },
  { key: 'address', label: 'Địa chỉ', placeholder: 'Số nhà, đường, quận, tỉnh/thành' },
];

/** Real showroom profile, editable. Replaces a page that said "đang phát triển". */
export default function ShowroomSettingsPage() {
  const [showroom, setShowroom] = useState<Showroom | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'migration' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/showroom/profile');
      if (res.status === 503) return setState('migration');
      if (!res.ok) return setState('error');
      setShowroom((await res.json()).showroom);
      setState('ready');
    })();
  }, []);

  async function save() {
    if (!showroom) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/showroom/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: showroom.name, contactName: showroom.contactName,
          email: showroom.email, phone: showroom.phone, address: showroom.address,
        }),
      });
      if (res.ok) setSaved(true);
    } finally { setSaving(false); }
  }

  if (state === 'migration') return <PageShell title="Cài đặt"><MigrationNotice /></PageShell>;
  if (state === 'loading' || !showroom) {
    return <PageShell title="Cài đặt"><p className="text-[14px] text-[#5B6B7C]">Đang tải…</p></PageShell>;
  }

  return (
    <PageShell title="Cài đặt" description="Thông tin showroom hiển thị cho LivLab và khách hàng.">
      <Section title="Hồ sơ showroom" className="max-w-2xl">
        <div className="space-y-4 px-5 py-5">
          {FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-[#45586B]">{field.label}</span>
              <input
                value={(showroom[field.key] as string) ?? ''}
                placeholder={field.placeholder}
                onChange={(e) => setShowroom({ ...showroom, [field.key]: e.target.value })}
                className="w-full rounded-lg border border-[#DCE4EC] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C8A96A]"
              />
            </label>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={save} disabled={saving}
              className="rounded-lg bg-[#0B2239] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#061827] disabled:opacity-50">
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
            {saved && <span className="text-[13px] font-semibold text-[#2E7D52]">Đã lưu</span>}
          </div>
        </div>
      </Section>

      <p className="mt-4 max-w-2xl text-[12px] leading-relaxed text-[#7A8795]">
        Khu vực phục vụ, phân quyền nhân viên và tuỳ chọn thông báo cần thêm dữ liệu ở backend; chưa có trong bản này.
      </p>
    </PageShell>
  );
}
