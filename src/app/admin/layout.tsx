
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, Car, ShoppingCart, Gift, Bitcoin, MessageSquare } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/admin/login') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/admin/login');
        }
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">Loading...</div>;
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#222] bg-[#111111] p-6 flex flex-col hidden md:flex">
        <div className="mb-10 text-2xl font-bold tracking-widest text-center">TESLA ADMIN</div>
        <nav className="flex-1 flex flex-col gap-2">
          <Link href="/admin" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname === '/admin' ? 'bg-[#222]' : 'hover:bg-[#1a1a1a]'}`}>
            <LayoutDashboard size={20} />
            <span className="text-sm font-semibold tracking-wider">DASHBOARD</span>
          </Link>
          <Link href="/admin/models" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname.startsWith('/admin/models') ? 'bg-[#222]' : 'hover:bg-[#1a1a1a]'}`}>
            <Car size={20} />
            <span className="text-sm font-semibold tracking-wider">MODELS</span>
          </Link>
          <Link href="/admin/orders" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname.startsWith('/admin/orders') ? 'bg-[#222]' : 'hover:bg-[#1a1a1a]'}`}>
            <ShoppingCart size={20} />
            <span className="text-sm font-semibold tracking-wider">ORDERS</span>
          </Link>
          <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-4 mb-1 pl-3">CUSTOMER CARE</div>
          <Link href="/admin/payments" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname.startsWith('/admin/payments') ? 'bg-[#222]' : 'hover:bg-[#1a1a1a]'}`}>
            <Bitcoin size={20} />
            <span className="text-sm font-semibold tracking-wider">PAYMENTS</span>
          </Link>
          <Link href="/admin/conversations" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname.startsWith('/admin/conversations') ? 'bg-[#222]' : 'hover:bg-[#1a1a1a]'}`}>
            <MessageSquare size={20} />
            <span className="text-sm font-semibold tracking-wider">CONVERSATIONS</span>
          </Link>
          <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-4 mb-1 pl-3">PROMOTIONS</div>
          <Link href="/admin/eligibility" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname === '/admin/eligibility' ? 'bg-[#222]' : 'hover:bg-[#1a1a1a]'}`}>
            <Gift size={20} />
            <span className="text-sm font-semibold tracking-wider">ELIGIBILITY</span>
          </Link>
          <Link href="/admin/passes" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${pathname.startsWith('/admin/passes') ? 'bg-[#222]' : 'hover:bg-[#1a1a1a]'}`}>
            <Gift size={20} />
            <span className="text-sm font-semibold tracking-wider">PASSES</span>
          </Link>
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#1a1a1a] transition-colors mt-auto text-gray-400 hover:text-white">
          <LogOut size={20} />
          <span className="text-sm font-semibold tracking-wider">LOGOUT</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-[#222] flex items-center justify-between px-8 bg-[#111111]/50 backdrop-blur-md">
          <h2 className="text-sm font-semibold tracking-wider text-gray-400">ADMINISTRATION PANEL</h2>
          <div className="text-sm font-mono text-gray-500">{user.email}</div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
