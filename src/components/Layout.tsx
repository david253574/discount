"use client";

import React, { useState } from "react";
import { Menu, Bell, Home, ArrowDownToLine, CheckSquare, User, MessageCircle, ArrowLeft, Gift } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppLayout({ children, showHeader = true, title = "" }: { children: React.ReactNode, showHeader?: boolean, title?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      {/* Side Menu Overlay (Mobile) */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 transition-opacity md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div 
            className="absolute top-0 left-0 w-3/4 max-w-[300px] h-full bg-[#111111] p-4 flex flex-col shadow-xl transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-8 px-2 mt-4">
              <span className="text-xl font-bold tracking-widest text-[#a9a9a9]">TESLA</span>
            </div>
            
            <div className="flex flex-col gap-6 overflow-y-auto pb-20">
              <div>
                <h3 className="text-xs text-gray-500 font-medium mb-3 px-2 tracking-wider">MAIN</h3>
                <nav className="flex flex-col gap-1">
                  <MenuLink icon={<Home size={18} />} label="DASHBOARD" />
                  <MenuLink icon={<ArrowDownToLine size={18} />} label="DEPOSIT" />
                  <MenuLink icon={<ArrowLeft size={18} />} label="WITHDRAW" />
                  <MenuLink icon={<span className="font-bold">₿</span>} label="BUY CRYPTO" />
                </nav>
              </div>

              <div>
                <h3 className="text-xs text-gray-500 font-medium mb-3 px-2 tracking-wider">INVESTMENTS</h3>
                <nav className="flex flex-col gap-1">
                  <MenuLink icon={<CheckSquare size={18} />} label="PLANS" />
                  <MenuLink icon={<User size={18} />} label="MY ASSETS" />
                  <MenuLink icon={<CheckSquare size={18} />} label="SHOPPING ORDERS" />
                </nav>
              </div>

              <div>
                <h3 className="text-xs text-gray-500 font-medium mb-3 px-2 tracking-wider">ACCOUNT</h3>
                <nav className="flex flex-col gap-1">
                  <MenuLink icon={<CheckSquare size={18} />} label="VERIFICATION" />
                  <MenuLink icon={<CheckSquare size={18} />} label="HISTORY" />
                  <Link href="/check-discount">
                    <MenuLink icon={<Gift size={18} />} label="CHECK DISCOUNT" />
                  </Link>
                  <MenuLink icon={<CheckSquare size={18} />} label="SETTINGS" />
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {showHeader && (
        <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-[#0a0a0a] z-40 sticky top-0 border-b border-[#222]">
          <div className="flex items-center gap-3">
            {/* Mobile Title / Menu */}
            <div className="md:hidden flex items-center">
              {title ? (
                <button className="p-1 mr-2" onClick={() => window.history.back()}>
                  <ArrowLeft size={24} />
                </button>
              ) : (
                <button className="p-1 mr-2" onClick={() => setMenuOpen(true)}>
                  <Menu size={24} className="text-gray-300" />
                </button>
              )}
            </div>

            {/* Desktop & Mobile Logo */}
            {!title || (title && <span className="hidden md:inline text-lg font-bold tracking-[0.3em] mr-8">TESLA</span>)}
            {!title && <span className="text-lg font-bold tracking-[0.3em] md:mr-8">TESLA</span>}
            {title && <span className="text-sm font-semibold tracking-wider text-gray-300 md:hidden">{title}</span>}

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className={`text-sm font-semibold tracking-wider hover:text-white transition-colors ${pathname === "/" ? "text-white" : "text-gray-400"}`}>SHOP</Link>
              <Link href="/check-discount" className={`text-sm font-semibold tracking-wider hover:text-white transition-colors ${pathname === "/check-discount" ? "text-white" : "text-gray-400"}`}>DISCOUNT</Link>
              <span className="text-sm font-semibold tracking-wider text-gray-400 hover:text-white cursor-pointer transition-colors">INVESTMENTS</span>
              <span className="text-sm font-semibold tracking-wider text-gray-400 hover:text-white cursor-pointer transition-colors">ACCOUNT</span>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative hover:text-white text-gray-300 transition-colors">
              <Bell size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-xs font-bold cursor-pointer">
              WI
            </div>
          </div>
        </header>
      )}

      {/* Ticker (only on main page or desktop) */}
      {(!title || <div className="hidden md:block"></div>) && showHeader && (
        <div className={`bg-[#111111] overflow-hidden whitespace-nowrap py-2 border-b border-[#222] text-xs font-mono text-gray-400 flex items-center ${title ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center px-4 animate-[ticker_20s_linear_infinite]">
            <span className="flex items-center gap-1 mx-4"><span className="w-2 h-2 rounded-full bg-red-500"></span> LIVE MARKETS</span>
            <span className="mx-4"><span className="text-white">BTC</span> $64,230.00 <span className="text-green-500">+2.4%</span></span>
            <span className="mx-4"><span className="text-white">ETH</span> $3,450.20 <span className="text-green-500">+1.1%</span></span>
            <span className="mx-4"><span className="text-white">TSLA</span> $202.64 <span className="text-red-500">-1.2%</span></span>
            <span className="mx-4"><span className="text-white">SPACEX (EST)</span> $110.50</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      {!title && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#222] z-40 px-6 py-2 md:hidden">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <BottomNavLink icon={<Home size={20} />} label="HOME" active={pathname === "/"} />
            <BottomNavLink icon={<ArrowDownToLine size={20} />} label="DEPOSIT" />
            <BottomNavLink icon={<CheckSquare size={20} />} label="PLANS" />
            <BottomNavLink icon={<User size={20} />} label="PROFILE" />
          </div>
        </nav>
      )}

      {/* Floating Chat Button */}
      {!title && (
        <button className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-12 md:w-14 h-12 md:h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg z-40 hover:bg-red-700 transition-colors">
          <MessageCircle size={24} />
          <span className="absolute top-0 right-0 w-3 md:w-4 h-3 md:h-4 bg-green-500 border-2 border-[#0a0a0a] rounded-full"></span>
        </button>
      )}
    </div>
  );
}

function MenuLink({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex items-center gap-3 px-2 py-3 text-sm text-gray-300 hover:bg-[#222] rounded-md transition-colors w-full text-left">
      <span className="text-gray-400">{icon}</span>
      <span className="font-medium tracking-wide">{label}</span>
    </button>
  );
}

function BottomNavLink({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex flex-col items-center gap-1 ${active ? "text-red-500" : "text-gray-500"}`}>
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
