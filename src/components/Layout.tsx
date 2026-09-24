
"use client";

import React, { useState, useEffect } from "react";
import { Menu, Bell, Home, ArrowDownToLine, CheckSquare, User, MessageCircle, ArrowLeft, Gift, Wallet, Clock, Settings, CreditCard, Box, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function AppLayout({ children, showHeader = true, title = "" }: { children: React.ReactNode, showHeader?: boolean, title?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        setUser(data.user);
        setStats(data.stats);
      })
      .catch(err => console.error(err));
  }, []);

  const navigationSections: NavSection[] = [
    {
      title: "MAIN",
      items: [
        { label: "DASHBOARD", href: "/dashboard", icon: <Home size={18} /> },
        { label: "DEPOSIT", href: "/deposit", icon: <ArrowDownToLine size={18} /> },
        { label: "WITHDRAW", href: "/withdraw", icon: <ArrowLeft size={18} /> },
        { label: "BUY CRYPTO", href: "/buy-crypto", icon: <span className="font-bold font-mono pl-1">₿</span> }
      ]
    },
    {
      title: "INVESTMENTS",
      items: [
        { label: "PLANS", href: "/plans", icon: <Activity size={18} /> },
        { label: "MY ASSETS", href: "/assets", icon: <Wallet size={18} /> },
        { label: "SHOPPING ORDERS", href: "/orders", icon: <Box size={18} />, badge: stats?.pendingOrders }
      ]
    },
    {
      title: "ACCOUNT",
      items: [
        { label: "VERIFICATION", href: "/verification", icon: <ShieldCheck size={18} /> },
        { label: "HISTORY", href: "/history", icon: <Clock size={18} /> },
        { label: "CHECK DISCOUNT", href: "/check-discount", icon: <Gift size={18} /> },
        { label: "SETTINGS", href: "/settings", icon: <Settings size={18} /> }
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      {/* Side Menu Overlay (Mobile) */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 transition-opacity md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div 
            className="absolute top-0 left-0 w-3/4 max-w-[300px] h-full bg-[#0a0a0a] border-r border-[#222] p-0 flex flex-col shadow-2xl transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[#222]">
              <span className="text-xl font-bold tracking-widest text-white">TESLA</span>
              {user && (
                <div className="w-8 h-8 bg-[#222] text-xs font-bold flex items-center justify-center text-white border border-[#333]">
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-6 overflow-y-auto p-4 pb-20">
              {navigationSections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-[10px] text-gray-500 font-bold mb-3 px-3 tracking-[0.2em]">{section.title}</h3>
                  <nav className="flex flex-col gap-1">
                    {section.items.map((item, itemIdx) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link 
                          key={itemIdx} 
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center justify-between px-3 py-3 text-sm transition-colors border-l-2 ${
                            isActive 
                              ? "bg-[#1a1a1a] border-white text-white" 
                              : "border-transparent text-gray-400 hover:bg-[#111] hover:text-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={isActive ? "text-white" : "text-gray-500"}>{item.icon}</span>
                            <span className="font-semibold tracking-wider text-[11px]">{item.label}</span>
                          </div>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-none min-w-[20px] text-center">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
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
                <button className="p-1 mr-2 hover:bg-[#111] transition-colors" onClick={() => setMenuOpen(true)}>
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
              <Link href="/dashboard" className={`text-sm font-semibold tracking-wider hover:text-white transition-colors ${pathname === "/dashboard" ? "text-white" : "text-gray-400"}`}>DASHBOARD</Link>
              <Link href="/orders" className={`text-sm font-semibold tracking-wider hover:text-white transition-colors ${pathname === "/orders" ? "text-white" : "text-gray-400"}`}>ORDERS</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button className="relative hover:text-white text-gray-300 transition-colors">
              <Bell size={20} />
              {stats?.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full"></span>
              )}
            </button>
            <Link href="/settings">
              <div className="w-8 h-8 bg-[#222] border border-[#333] flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-[#333] transition-colors">
                {user ? user.email.substring(0, 2).toUpperCase() : '👤'}
              </div>
            </Link>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 relative">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      {!title && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#222] z-40 px-6 py-3 md:hidden">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === "/" ? "text-white" : "text-gray-500"}`}>
              <Home size={20} />
              <span className="text-[10px] font-semibold tracking-wider">SHOP</span>
            </Link>
            <Link href="/dashboard" className={`flex flex-col items-center gap-1 ${pathname === "/dashboard" ? "text-white" : "text-gray-500"}`}>
              <Activity size={20} />
              <span className="text-[10px] font-semibold tracking-wider">DASHBOARD</span>
            </Link>
            <Link href="/orders" className={`flex flex-col items-center gap-1 relative ${pathname === "/orders" ? "text-white" : "text-gray-500"}`}>
              <Box size={20} />
              {stats?.pendingOrders > 0 && (
                <span className="absolute -top-1 -right-2 w-3 h-3 bg-red-600 rounded-full border border-[#0a0a0a]"></span>
              )}
              <span className="text-[10px] font-semibold tracking-wider">ORDERS</span>
            </Link>
            <Link href="/settings" className={`flex flex-col items-center gap-1 ${pathname === "/settings" ? "text-white" : "text-gray-500"}`}>
              <Settings size={20} />
              <span className="text-[10px] font-semibold tracking-wider">SETTINGS</span>
            </Link>
          </div>
        </nav>
      )}

      {/* Floating Chat Button */}
      {!title && (
        <Link href="/support" className="fixed bottom-24 md:bottom-8 right-4 md:right-8 w-12 md:w-14 h-12 md:h-14 bg-red-600 flex items-center justify-center text-white shadow-lg z-40 hover:bg-red-700 transition-colors">
          <MessageCircle size={24} />
          {stats?.unreadMessages > 0 && (
            <span className="absolute top-0 right-0 w-3 md:w-4 h-3 md:h-4 bg-green-500 border-2 border-[#0a0a0a]"></span>
          )}
        </Link>
      )}
    </div>
  );
}
