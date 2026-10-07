'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { MAX_USER_MESSAGE_CHARS } from '@/lib/ai/expert/expertContext';

interface ExpertComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

/**
 * Message input. The length cap matches the server's so an over-long message is
 * stopped here rather than bouncing off the API, and submit is blocked while a
 * request is in flight — the first half of double-submit protection (the server
 * rate limiter is the other half).
 */
export default function ExpertComposer({ disabled, onSend }: ExpertComposerProps) {
  const [text, setText] = useState('');
  const trimmed = text.trim();
  const tooLong = text.length > MAX_USER_MESSAGE_CHARS;

  const submit = () => {
    if (!trimmed || disabled || tooLong) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="shrink-0 border-t border-[#D8E2EA] bg-white p-3"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Hỏi LivLab Expert về sản phẩm, kích thước, ngân sách…"
          aria-label="Câu hỏi cho LivLab Expert"
          maxLength={MAX_USER_MESSAGE_CHARS + 50}
          className="flex-1 rounded-xl bg-[#EEF4F7] px-3.5 py-2.5 text-sm text-[#0B1623] focus:outline-none focus:ring-2 focus:ring-[#123C5A]"
        />
        <button
          type="submit"
          disabled={!trimmed || disabled || tooLong}
          aria-label="Gửi câu hỏi"
          className="rounded-xl bg-[#123C5A] p-2.5 text-white transition-colors hover:bg-[#0D2B42] disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      {tooLong && (
        <p className="mt-1.5 text-[11px] text-red-500">
          Câu hỏi quá dài (tối đa {MAX_USER_MESSAGE_CHARS} ký tự). Bạn rút gọn giúp tôi nhé.
        </p>
      )}
    </form>
  );
}
