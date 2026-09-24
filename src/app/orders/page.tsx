
"use client";
import { useEffect, useState } from 'react';
import AppLayout from "@/components/Layout";
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) {
        window.location.href = '/login';
        return;
      }
      fetch('/api/orders').then(r => r.json()).then(res => {
        setOrders(res.orders || []);
        setLoading(false);
      });
    });
  }, []);

  return (
    <AppLayout title="SHOPPING ORDERS">
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 tracking-widest">SHOPPING ORDERS</h1>
        {loading ? (
          <div className="text-gray-500 animate-pulse">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-[#111] border border-[#222] p-8 text-center text-gray-500">No orders found.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((o: any) => (
              <Link href={`/order/${o.id}`} key={o.id} className="block bg-[#111] border border-[#222] p-6 hover:border-gray-500 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm text-gray-500 tracking-wider mb-1">ORDER ID</div>
                    <div className="font-mono">{o.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 tracking-wider mb-1">STATUS</div>
                    <div className={`font-bold ${o.status === 'PENDING' ? 'text-yellow-500' : 'text-green-500'}`}>{o.status}</div>
                  </div>
                </div>
                <div className="text-xl font-medium">{o.model?.name} {o.variant?.name}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
