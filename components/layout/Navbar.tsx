'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Square, ShoppingBag, ChevronDown, LayoutGrid } from 'lucide-react';
import { useQuote } from '@/lib/context/QuoteContext';
import { useAuth } from '@/lib/context/AuthContext';
import { User } from 'lucide-react';
import Image from 'next/image';

const exploreLinks = [
  { href: '/concepts',             label: 'Concept' },
  { href: '/products',             label: 'Sản phẩm' },
  { href: '/small-bathroom-combo', label: 'Combo phòng tắm' },
  { href: '/ai-suggestion',        label: 'Gợi ý AI' },
  { href: '/visual-studio',        label: 'Visual Studio' },
  { href: '/room-studio',          label: 'Room Studio' },
  { href: '/blog',                 label: 'Cẩm nang' },
];

const mainLinks = [
  { href: '/',            label: 'Trang chủ' },
  { href: '/about',       label: 'Về LivLab' },
  { href: '/track-quote', label: 'Tra cứu báo giá' },
];

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();
  const { count, toggleDrawer } = useQuote();
  const { user, logout } = useAuth();
  const isHome = pathname === '/';
  const dropRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Do not render this navbar in admin or showroom pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/showroom')) {
    return null;
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { 
    setMenuOpen(false); 
    setExploreOpen(false); 
    setAccountOpen(false); 
  }, [pathname]);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setExploreOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setExploreOpen(false);
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const solidBg = scrolled || !isHome;
  const textColor = solidBg ? 'text-[#627386]' : 'text-white/80';
  const activeColor = 'text-[#C8A96A]';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${solidBg ? 'bg-white/95 backdrop-blur-md border-b border-[#D8E2EA] shadow-sm' : 'bg-gradient-to-b from-[#0B1623]/60 to-transparent border-b border-transparent'}`}>
      <nav className="max-w-8xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
       {/* Logo */}
<Link
  href="/"
  aria-label="LivLab"
  className={`flex items-center group flex-shrink-0 rounded-2xl transition-all duration-200 ${solidBg ? '' : 'bg-white/95 px-3 py-1.5 shadow-sm'}`}
>
  <Image
    src="/images/logo.png"
    alt="LivLab"
    width={132}
    height={40}
    priority
    className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
  />
</Link>
        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          <Link href="/" className={`text-sm font-medium transition-colors hover:text-[#C8A96A] ${pathname === '/' ? activeColor : textColor}`}>
            Trang chủ
          </Link>
          <Link href="/about" className={`text-sm font-medium transition-colors hover:text-[#C8A96A] ${pathname === '/about' ? activeColor : textColor}`}>
            Về LivLab
          </Link>

          {/* Explore Dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setExploreOpen((p) => !p)}
              className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-[#C8A96A] ${exploreLinks.some(l => pathname.startsWith(l.href)) ? activeColor : textColor}`}
            >
              Khám phá
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
            </button>
            {exploreOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#D8E2EA] py-2 z-50">
                {exploreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[#EEF4F7] hover:text-[#0B1623] ${pathname === link.href ? 'text-[#C8A96A] font-semibold' : 'text-[#627386]'}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/track-quote" className={`text-sm font-medium transition-colors hover:text-[#C8A96A] ${pathname === '/track-quote' ? activeColor : textColor}`}>
            Tra cứu báo giá
          </Link>

          {/* Quote icon */}
          <button
            onClick={toggleDrawer}
            className={`relative p-2 rounded-xl transition-colors hover:bg-[#EEF4F7] ${solidBg ? 'text-[#627386]' : 'text-white hover:bg-white/10'}`}
            aria-label="Giỏ báo giá"
          >
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#123C5A] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {user && user.role === 'CUSTOMER' ? (
            <div className="flex items-center gap-4">
              <div className="relative" ref={accountRef}>
                <button 
                  onClick={() => setAccountOpen(!accountOpen)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[#C8A96A] ${textColor}`}
                >
                  <User className="w-4 h-4" />
                  Tài khoản
                </button>
                {accountOpen && (
                  <div role="menu" className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#D8E2EA] py-2 z-50">
                    <div className="px-4 py-2 text-xs text-[#627386] border-b border-[#D8E2EA] mb-1">{user.name}</div>
                    <Link href="/account" onClick={() => setAccountOpen(false)} role="menuitem" className="block px-4 py-2 text-sm text-[#0B1623] hover:bg-[#EEF4F7] transition-colors">Tài khoản</Link>
                    <Link href="/my-quotes" onClick={() => setAccountOpen(false)} role="menuitem" className="block px-4 py-2 text-sm text-[#0B1623] hover:bg-[#EEF4F7] transition-colors">Yêu cầu đã gửi</Link>
                    <Link href="/saved" onClick={() => setAccountOpen(false)} role="menuitem" className="block px-4 py-2 text-sm text-[#0B1623] hover:bg-[#EEF4F7] transition-colors">Concept đã lưu</Link>
                    <button onClick={() => { setAccountOpen(false); logout(); }} role="menuitem" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Đăng xuất</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link href="/login" className={`text-sm font-medium transition-colors hover:text-[#C8A96A] ${textColor}`}>
              Đăng nhập
            </Link>
          )}

          <Link
            href="/quote"
            className="px-5 py-2 bg-[#123C5A] text-white text-sm font-semibold rounded-full hover:bg-[#0D2B42] transition-colors duration-200"
          >
            Yêu cầu báo giá
          </Link>
        </div>

        {/* Mobile right */}
        <div className="lg:hidden flex items-center gap-2">
          <button onClick={toggleDrawer} className={`relative p-2 rounded-xl ${solidBg ? 'text-[#0B1623]' : 'text-white'}`}>
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#123C5A] text-white text-[9px] font-bold rounded-full flex items-center justify-center">{count}</span>
            )}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-2 rounded-xl transition-colors ${solidBg ? 'text-[#0B1623] hover:bg-[#EEF4F7]' : 'text-white hover:bg-white/10'}`}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-b border-[#D8E2EA] px-6 pb-5 pt-2">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#627386] uppercase tracking-widest mt-3 mb-1">Trang</p>
            {[{ href: '/', label: 'Trang chủ' }, { href: '/about', label: 'Về LivLab' }, { href: '/track-quote', label: 'Tra cứu báo giá' }].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium text-[#0B1623] border-b border-[#D8E2EA] hover:text-[#C8A96A] transition-colors">{l.label}</Link>
            ))}
            <p className="text-[10px] font-bold text-[#627386] uppercase tracking-widest mt-4 mb-1">Khám phá</p>
            {exploreLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium text-[#0B1623] border-b border-[#D8E2EA] hover:text-[#C8A96A] transition-colors">{l.label}</Link>
            ))}
            
            {user && user.role === 'CUSTOMER' ? (
              <>
                <p className="text-[10px] font-bold text-[#627386] uppercase tracking-widest mt-4 mb-1">Tài khoản ({user.name})</p>
                <Link href="/account" onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium text-[#0B1623] border-b border-[#D8E2EA] hover:text-[#C8A96A] transition-colors">Tài khoản</Link>
                <Link href="/my-quotes" onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium text-[#0B1623] border-b border-[#D8E2EA] hover:text-[#C8A96A] transition-colors">Yêu cầu đã gửi</Link>
                <Link href="/saved" onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium text-[#0B1623] border-b border-[#D8E2EA] hover:text-[#C8A96A] transition-colors">Concept đã lưu</Link>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full text-left block py-2.5 text-sm font-medium text-red-600 border-b border-[#D8E2EA] transition-colors">Đăng xuất</button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block mt-4 py-2.5 text-sm font-medium text-[#123C5A] font-semibold border-b border-[#D8E2EA] hover:text-[#C8A96A] transition-colors">Đăng nhập</Link>
            )}
          </div>
          <div className="pt-4">
            <Link href="/quote" className="block w-full text-center px-5 py-3 bg-[#123C5A] text-white text-sm font-semibold rounded-full hover:bg-[#0D2B42] transition-colors">
              Yêu cầu báo giá
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
