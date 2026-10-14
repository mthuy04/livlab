'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { PageShell, MigrationNotice, ErrorState, FootNote } from '@/components/showroom/ui/primitives';
import { CX } from '@/components/showroom/ui/tokens';

interface Showroom {
  id: string; name: string; contactName: string | null;
  email: string | null; phone: string | null; address: string | null;
}

/**
 * Showroom identity, grouped the way Shopify groups settings: a description on
 * the left saying what the group is for and who sees it, the fields on the
 * right.
 *
 * Only three groups, because only three exist in the data. Inventing sections
 * for staff permissions or notifications would mean shipping a form that
 * cannot save.
 */
const GROUPS: {
  title: string;
  description: string;
  fields: { key: keyof Showroom; label: string; placeholder: string; type?: string; hint?: string }[];
}[] = [
  {
    title: 'Thông tin showroom',
    description: 'Tên hiển thị cho khách khi LivLab chuyển yêu cầu sang showroom.',
    fields: [{ key: 'name', label: 'Tên showroom', placeholder: 'VD: Luxbath Studio Hà Nội' }],
  },
  {
    title: 'Liên hệ',
    description: 'LivLab dùng các thông tin này để liên lạc khi có lead hoặc vấn đề vận hành.',
    fields: [
      { key: 'contactName', label: 'Người phụ trách', placeholder: 'Họ và tên' },
      { key: 'phone', label: 'Điện thoại', placeholder: '09xx xxx xxx', type: 'tel' },
      { key: 'email', label: 'Email', placeholder: 'showroom@example.com', type: 'email' },
    ],
  },
  {
    title: 'Địa chỉ',
    description: 'Hiển thị khi khách muốn tới showroom xem sản phẩm thật.',
    fields: [{ key: 'address', label: 'Địa chỉ', placeholder: 'Số nhà, đường, quận, tỉnh/thành' }],
  },
];

type LoadState = 'loading' | 'ready' | 'migration' | 'error';

export default function ShowroomSettingsPage() {
  const [saved, setSaved] = useState<Showroom | null>(null);
  const [draft, setDraft] = useState<Showroom | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/showroom/profile');
        if (cancelled) return;
        if (res.status === 503) return setState('migration');
        if (!res.ok) return setState('error');
        const showroom = (await res.json()).showroom as Showroom;
        setSaved(showroom);
        setDraft(showroom);
        setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /** Dirty is a comparison, not a flag — nothing has to remember to clear it. */
  const isDirty = useMemo(() => {
    if (!saved || !draft) return false;
    return GROUPS.some((g) => g.fields.some((f) => (draft[f.key] ?? '') !== (saved[f.key] ?? '')));
  }, [saved, draft]);

  const nameMissing = draft !== null && !draft.name.trim();

  async function handleSave() {
    if (!draft || nameMissing) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/showroom/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name, contactName: draft.contactName,
          email: draft.email, phone: draft.phone, address: draft.address,
        }),
      });
      if (!res.ok) {
        setError('Không lưu được thay đổi. Thử lại sau ít phút.');
        return;
      }
      setSaved(draft);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch {
      setError('Không lưu được thay đổi. Kiểm tra kết nối rồi thử lại.');
    } finally {
      setSaving(false);
    }
  }

  if (state === 'migration') return <PageShell title="Cài đặt" width="narrow"><MigrationNotice /></PageShell>;
  if (state === 'error') {
    return (
      <PageShell title="Cài đặt" width="narrow">
        <div className={`${CX.card}`}><ErrorState title="Không tải được thông tin showroom." /></div>
      </PageShell>
    );
  }
  if (state === 'loading' || !draft) {
    return (
      <PageShell title="Cài đặt" width="narrow" description="Thông tin showroom hiển thị cho LivLab và khách hàng.">
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-md border border-[#E3E9EE] bg-white" />
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      width="narrow"
      title="Cài đặt"
      description="Thông tin showroom hiển thị cho LivLab và khách hàng."
    >
      <div className="space-y-6">
        {GROUPS.map((group) => (
          <section key={group.title} className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
            <div className="pt-0.5">
              <h2 className="text-[14px] font-semibold text-[#111A22]">{group.title}</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-[#7E8D9B]">{group.description}</p>
            </div>
            <div className={`${CX.card} space-y-4 p-4`}>
              {group.fields.map((field) => {
                const invalid = field.key === 'name' && nameMissing;
                return (
                  <div key={String(field.key)}>
                    <label
                      htmlFor={`field-${String(field.key)}`}
                      className="mb-1.5 block text-[13px] font-medium text-[#4F6070]"
                    >
                      {field.label}
                    </label>
                    <input
                      id={`field-${String(field.key)}`}
                      type={field.type ?? 'text'}
                      value={(draft[field.key] as string) ?? ''}
                      placeholder={field.placeholder}
                      aria-invalid={invalid}
                      aria-describedby={invalid ? `err-${String(field.key)}` : undefined}
                      onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                      className={`${CX.input} h-9 w-full ${invalid ? 'border-[#B4322A] focus:border-[#B4322A] focus:ring-[#B4322A]/15' : ''}`}
                    />
                    {invalid && (
                      <p id={`err-${String(field.key)}`} className="mt-1.5 text-[12px] text-[#B4322A]">
                        Tên showroom không được để trống.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* The save bar appears only when there is something to save, and sits
          at the bottom of the flow rather than floating over the form. A
          persistent toast would be noise on a page edited twice a year. */}
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#E3E9EE] pt-4">
        <div className="text-[13px]">
          {error ? (
            <span className="text-[#B4322A]">{error}</span>
          ) : justSaved ? (
            <span className="inline-flex items-center gap-1.5 text-[#2E7D52]">
              <Check className="h-3.5 w-3.5" /> Đã lưu thay đổi
            </span>
          ) : isDirty ? (
            <span className="text-[#946200]">Có thay đổi chưa lưu</span>
          ) : (
            <span className="text-[#8795A3]">Chưa có thay đổi</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setDraft(saved); setError(null); }}
            disabled={!isDirty || saving}
            className={CX.buttonSecondary}
          >
            Hoàn tác
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving || nameMissing}
            className={CX.buttonPrimary}
          >
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <FootNote>
        Khu vực phục vụ, phân quyền nhân viên và tuỳ chọn thông báo cần thêm dữ liệu ở backend — chưa có trong bản này.
      </FootNote>
    </PageShell>
  );
}
