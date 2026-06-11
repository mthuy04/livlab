'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Bot, Phone, ThumbsUp, FileText, X, ChevronRight, MessageSquare } from 'lucide-react';
import LivLabAiChat from './LivLabAiChat';

export default function FloatingSupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Hide on admin/showroom
  if (pathname.startsWith('/admin') || pathname.startsWith('/showroom')) {
    return null;
  }

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setChatOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const zaloUrl = process.env.NEXT_PUBLIC_ZALO_URL || '#';
  const fbUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || '#';
  const hotline = process.env.NEXT_PUBLIC_HOTLINE || '#';

  const menuItems = [
    {
      id: 'ai-chat',
      icon: <Bot className="w-5 h-5 text-[#C8A96A]" />,
      title: 'Chat với LivLab AI',
      desc: 'Hỏi nhanh về concept, ngân sách, quy trình',
      action: () => {
        setChatOpen(true);
      }
    },
    {
      id: 'zalo',
      icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
      title: 'Nhắn Zalo',
      desc: 'Tư vấn nhanh chóng qua Zalo',
      action: () => window.open(zaloUrl, '_blank')
    },
    {
      id: 'facebook',
      icon: <ThumbsUp className="w-5 h-5 text-blue-600" />,
      title: 'Facebook',
      desc: 'Theo dõi LivLab hoặc nhắn tin',
      action: () => window.open(fbUrl, '_blank')
    },
    {
      id: 'quote',
      icon: <FileText className="w-5 h-5 text-[#123C5A]" />,
      title: 'Gửi yêu cầu báo giá',
      desc: 'Điền nhu cầu để showroom tư vấn',
      action: () => {
        setIsOpen(false);
        router.push('/quote');
      }
    },
    {
      id: 'hotline',
      icon: <Phone className="w-5 h-5 text-green-600" />,
      title: 'Hotline tư vấn',
      desc: hotline !== '#' ? hotline : 'Chưa cập nhật',
      action: () => window.open(`tel:${hotline}`, '_self')
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end" ref={menuRef}>
      <AnimatePresence>
        {isOpen && !chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-80 bg-white rounded-3xl shadow-2xl border border-[#D8E2EA] overflow-hidden"
          >
            <div className="bg-[#123C5A] p-5 text-white">
              <h3 className="font-bold text-lg">Bạn cần hỗ trợ?</h3>
              <p className="text-white/80 text-xs mt-1">
                LivLab có thể giúp bạn chọn concept, ước lượng ngân sách và gửi yêu cầu báo giá.
              </p>
            </div>
            <div className="p-2 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-[#EEF4F7] transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F3F7FA] flex items-center justify-center flex-shrink-0 group-hover:bg-white border border-transparent group-hover:border-[#D8E2EA] transition-all">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[#0B1623]">{item.title}</h4>
                    <p className="text-xs text-[#627386] truncate">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#D8E2EA] group-hover:text-[#627386]" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#D8E2EA] overflow-hidden flex flex-col h-[500px] max-h-[70vh]"
          >
            <LivLabAiChat onClose={() => setChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (chatOpen) {
            setChatOpen(false);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-colors duration-300 ${
          isOpen || chatOpen ? 'bg-white border border-[#D8E2EA] text-[#0B1623]' : 'bg-[#123C5A] text-white'
        }`}
      >
        {isOpen || chatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
