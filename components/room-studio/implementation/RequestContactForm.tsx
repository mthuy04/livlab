'use client';

import { useId, useState } from 'react';
import type { CustomerContact, ImplementationRequestType } from '@/lib/implementation/types';

interface RequestContactFormProps {
  requestType: ImplementationRequestType;
  initial?: Partial<CustomerContact>;
  onSubmit: (contact: CustomerContact) => void;
}

export interface ContactErrors {
  fullName?: string;
  phone?: string;
}

const CONTACT_TIMES = ['Trong giờ hành chính', 'Buổi tối', 'Cuối tuần', 'Bất kỳ lúc nào'];

const inputCls = (hasError?: boolean) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-[13px] text-[#0B1623] placeholder-[#9AA9B6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C8A96A] ${
    hasError ? 'border-red-400' : 'border-[#D8E2EA]'
  }`;
const labelCls = 'mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#627386]';

/**
 * Deliberately short: name and phone are the only required fields.
 *
 * Everything LivLab already knows — room size, products, prices, technical
 * findings — is NOT asked for again. That is the entire point of the handoff;
 * a form that re-collected it would undo the work the customer just did.
 *
 * A location field appears only for technical checks, where someone has to go
 * somewhere. Asking every customer for an address to receive a price quote
 * would be collecting data with no use for it.
 */
export default function RequestContactForm({ requestType, initial, onSubmit }: RequestContactFormProps) {
  const ids = useId();
  const [contact, setContact] = useState<CustomerContact>({
    fullName: initial?.fullName ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    serviceArea: initial?.serviceArea ?? '',
    preferredContactTime: initial?.preferredContactTime ?? '',
    notes: initial?.notes ?? '',
  });
  const [errors, setErrors] = useState<ContactErrors>({});

  const needsLocation = requestType === 'TECHNICAL_CHECK';

  const set = (key: keyof CustomerContact, value: string) => {
    setContact((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof ContactErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: ContactErrors = {};
    if (!contact.fullName.trim()) next.fullName = 'Vui lòng nhập họ và tên.';
    // Permissive on format: Vietnamese numbers are written many ways, and
    // rejecting a real number is worse than accepting an odd-looking one.
    if (contact.phone.replace(/\D/g, '').length < 8) next.phone = 'Vui lòng nhập số điện thoại hợp lệ.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Trim here so empty optional fields become absent rather than "".
    onSubmit({
      fullName: contact.fullName.trim(),
      phone: contact.phone.trim(),
      email: contact.email?.trim() || undefined,
      serviceArea: contact.serviceArea?.trim() || undefined,
      preferredContactTime: contact.preferredContactTime || undefined,
      notes: contact.notes?.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      <div>
        <label className={labelCls} htmlFor={`${ids}-name`}>
          Họ và tên *
        </label>
        <input
          id={`${ids}-name`}
          type="text"
          value={contact.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          placeholder="VD: Nguyễn Văn An"
          className={inputCls(Boolean(errors.fullName))}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? `${ids}-name-err` : undefined}
        />
        {errors.fullName && (
          <p id={`${ids}-name-err`} role="alert" className="mt-1 text-[11px] text-red-600">
            {errors.fullName}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor={`${ids}-phone`}>
            Số điện thoại *
          </label>
          <input
            id={`${ids}-phone`}
            type="tel"
            inputMode="tel"
            value={contact.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="09xx xxx xxx"
            className={inputCls(Boolean(errors.phone))}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${ids}-phone-err` : undefined}
          />
          {errors.phone && (
            <p id={`${ids}-phone-err`} role="alert" className="mt-1 text-[11px] text-red-600">
              {errors.phone}
            </p>
          )}
        </div>
        <div>
          <label className={labelCls} htmlFor={`${ids}-email`}>
            Email (không bắt buộc)
          </label>
          <input
            id={`${ids}-email`}
            type="email"
            value={contact.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="ban@email.com"
            className={inputCls()}
          />
        </div>
      </div>

      {needsLocation && (
        <div>
          <label className={labelCls} htmlFor={`${ids}-area`}>
            Địa điểm cần kiểm tra
          </label>
          <input
            id={`${ids}-area`}
            type="text"
            value={contact.serviceArea}
            onChange={(e) => set('serviceArea', e.target.value)}
            placeholder="VD: Quận 7, TP.HCM"
            className={inputCls()}
          />
        </div>
      )}

      <div>
        <label className={labelCls} htmlFor={`${ids}-time`}>
          Thời gian muốn được liên hệ
        </label>
        <select
          id={`${ids}-time`}
          value={contact.preferredContactTime}
          onChange={(e) => set('preferredContactTime', e.target.value)}
          className={inputCls()}
        >
          <option value="">Không ưu tiên</option>
          {CONTACT_TIMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls} htmlFor={`${ids}-notes`}>
          {needsLocation ? 'Vấn đề cần kiểm tra thêm' : 'Ghi chú'}
        </label>
        <textarea
          id={`${ids}-notes`}
          rows={3}
          value={contact.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder={
            needsLocation
              ? 'VD: Nhà cũ, chưa rõ vị trí thoát sàn.'
              : 'Điều bạn muốn showroom lưu ý.'
          }
          className={`${inputCls()} resize-none`}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-[#0B2239] px-4 py-3 text-[13px] font-bold text-white transition-colors hover:bg-[#061827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96A]"
      >
        Xem lại yêu cầu
      </button>
    </form>
  );
}
