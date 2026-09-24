"use client";
import { useEffect, useState } from 'react';
import AppLayout from "@/components/Layout";

export default function AssetsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) {
        window.location.href = '/login';
        return;
      }
      setLoading(false);
    });
  }, []);

  return (
    <AppLayout title="MY ASSETS">
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 tracking-widest">MY ASSETS</h1>
        {loading ? (
          <div className="text-gray-500 animate-pulse">Loading assets...</div>
        ) : (
          <div className="bg-[#111] border border-[#222] p-8 text-center text-gray-500 flex flex-col items-center justify-center min-h-[300px]">
            <span className="text-4xl mb-4">🚗</span>
            <p className="text-lg text-white mb-2">No Vehicles Currently Owned</p>
            <p className="text-sm">When your orders are finalized and delivered, your assets will appear here.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
