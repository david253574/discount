"use client";
import { useEffect, useState } from 'react';
import AppLayout from "@/components/Layout";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) {
        window.location.href = '/login';
        return;
      }
      fetch('/api/orders').then(r => r.json()).then(res => {
        // Map orders to a history timeline format
        const items = (res.orders || []).map((o: any) => ({
          id: o.id,
          date: o.createdAt,
          type: 'ORDER',
          description: `Placed order for \${o.model?.name} \${o.variant?.name}`,
          amount: o.finalAmount,
          status: o.status
        }));
        setHistory(items);
        setLoading(false);
      });
    });
  }, []);

  return (
    <AppLayout title="HISTORY">
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 tracking-widest">ACCOUNT HISTORY</h1>
        {loading ? (
          <div className="text-gray-500 animate-pulse">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="bg-[#111] border border-[#222] p-8 text-center text-gray-500">No activity history found.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((item: any) => (
              <div key={item.id} className="bg-[#111] border border-[#222] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-500 transition-colors">
                <div>
                  <div className="text-xs text-gray-500 font-mono mb-2">{new Date(item.date).toLocaleDateString()}</div>
                  <div className="font-medium text-lg">{item.description}</div>
                  <div className="text-sm text-gray-400 mt-1">Ref: {item.id}</div>
                </div>
                <div className="md:text-right flex flex-col gap-1">
                  <div className="font-bold text-xl text-white">$\{(item.amount || 0).toLocaleString()}</div>
                  <div className={`text-xs font-bold tracking-widest \${item.status === 'PENDING' ? 'text-yellow-500' : 'text-green-500'}`}>{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
