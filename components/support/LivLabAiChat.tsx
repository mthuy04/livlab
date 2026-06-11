'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LivLabAiChat({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: 'Chào bạn, tôi là LivLab AI trợ lý. Bạn cần tìm hiểu thông tin gì về phòng tắm hay muốn tôi giúp lên dự toán concept?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: messages })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Xin lỗi, tôi đang quá tải hoặc gặp lỗi. Vui lòng thử lại sau.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#123C5A] p-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#C8A96A]" />
            <span className="font-bold">LivLab AI</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#C8A96A] text-white' : 'bg-white border border-[#D8E2EA] text-[#123C5A]'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[#123C5A] text-white rounded-tr-sm' : 'bg-white border border-[#D8E2EA] text-[#0B1623] rounded-tl-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-[#D8E2EA] text-[#123C5A] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white border border-[#D8E2EA] rounded-tl-sm flex gap-1">
              <span className="w-2 h-2 bg-[#627386] rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-[#627386] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-[#627386] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion CTA */}
      <div className="p-3 bg-white border-t border-[#D8E2EA]">
        <button 
          onClick={() => {
            onClose();
            router.push('/ai-suggestion');
          }}
          className="w-full py-2 bg-[#EEF4F7] text-[#123C5A] text-xs font-bold rounded-xl hover:bg-[#D8E2EA] transition-colors flex items-center justify-center gap-1 mb-2"
        >
          <Bot className="w-3.5 h-3.5" /> Thử công cụ Gợi ý AI theo ngân sách
        </button>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi LivLab AI..."
            className="flex-1 bg-[#EEF4F7] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#123C5A]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-[#123C5A] text-white p-2.5 rounded-xl disabled:opacity-50 hover:bg-[#0D2B42] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
