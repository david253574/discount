"use client";
import { useEffect, useState } from 'react';
import AppLayout from "@/components/Layout";
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.user) {
          window.location.href = '/login';
          return;
        }
        setUser(data.user);
        setStats(data.stats);
        setLoading(false);
      });
  }, []);

  return (
    <AppLayout title="DASHBOARD">
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 tracking-widest">ACCOUNT DASHBOARD</h1>
        
        {loading ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-32 bg-[#111] border border-[#222]"></div>
            <div className="h-32 bg-[#111] border border-[#222]"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="bg-[#111] border border-[#222] p-6 flex flex-col gap-2">
              <h2 className="text-xs text-gray-500 font-bold tracking-[0.2em] mb-2">WELCOME BACK</h2>
              <div className="text-xl font-medium">{user.email}</div>
              <div className="text-sm text-gray-400 mt-2">Role: <span className="text-white">{user.role}</span></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#111] border border-[#222] p-4 flex flex-col items-center justify-center text-center">
                <div className="text-[10px] text-gray-500 font-bold tracking-[0.2em] mb-2">PENDING ORDERS</div>
                <div className="text-2xl font-mono">{stats?.pendingOrders || 0}</div>
              </div>
              <div className="bg-[#111] border border-[#222] p-4 flex flex-col items-center justify-center text-center">
                <div className="text-[10px] text-gray-500 font-bold tracking-[0.2em] mb-2">UNREAD MESSAGES</div>
                <div className="text-2xl font-mono">{stats?.unreadMessages || 0}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              <Link href="/orders" className="bg-white text-black font-bold tracking-widest text-xs px-6 py-3 hover:bg-gray-200 transition-colors">
                VIEW ORDERS
              </Link>
              <Link href="/" className="bg-[#222] border border-[#333] text-white font-bold tracking-widest text-xs px-6 py-3 hover:bg-[#333] transition-colors">
                NEW ORDER
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
