
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        if (data.orders) setOrders(data.orders);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (_e) {
      alert("Error updating order status");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-wider mb-2">ORDERS</h1>
        <p className="text-gray-400 text-sm">Manage all vehicle reservations and orders.</p>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#222] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a1a1a] text-gray-400 text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">DATE</th>
                <th className="p-4">CUSTOMER</th>
                <th className="p-4">VEHICLE</th>
                <th className="p-4">PRICING</th>
                <th className="p-4">PAYMENT</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">No orders found.</td>
                </tr>
              ) : (
                orders.map(order => {
                  const hasDiscount = typeof order.discountAmount === 'number' && typeof order.finalAmount === 'number';
                  const origPrice = order.variant ? order.variant.price : 0;
                  const discPct = hasDiscount && origPrice > 0 ? (order.discountAmount / origPrice) * 100 : 0;
                  
                  return (
                    <tr key={order.id} className="hover:bg-[#1a1a1a] transition-colors group">
                      <td className="p-4 text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{order.name}</div>
                        <div className="text-xs text-gray-500">{order.city}, {order.zip}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{order.model.name}</div>
                        <div className="text-xs text-gray-500">{order.variant.name}</div>
                      </td>
                      <td className="p-4">
                        {hasDiscount ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-500 line-through decoration-[#444] tracking-widest">${origPrice.toLocaleString()}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-green-500 text-[10px] font-bold bg-green-500/10 px-1 rounded">{discPct.toFixed(1).replace('.0', '')}% OFF</span>
                              <span className="text-white font-bold text-sm">${order.finalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-white font-bold text-sm">${origPrice.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="p-4 text-xs">
                        {order.paymentType} {order.crypto ? `(${order.crypto})` : ''}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded-md ${
                          order.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                          order.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                          order.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2 items-center">
                        <button onClick={() => window.open(`/admin/delivery/${order.id}`, '_blank')} className="text-purple-500 hover:text-purple-400 border border-purple-500/30 px-2 py-1 rounded text-[10px] font-bold tracking-wider transition-colors mt-2">DOCS</button>
                        {order.status === 'PENDING' && (
                          <div className="flex justify-end gap-2 text-[10px] font-bold tracking-wider">
                             <button onClick={() => updateStatus(order.id, 'APPROVED')} className="text-green-500 hover:text-green-400 border border-green-500/30 px-2 py-1 rounded transition-colors">APPROVE</button>
                             <button onClick={() => updateStatus(order.id, 'REJECTED')} className="text-red-500 hover:text-red-400 border border-red-500/30 px-2 py-1 rounded transition-colors">REJECT</button>
                          </div>
                        )}
                        {order.status === 'APPROVED' && (
                          <div className="flex justify-end gap-2 text-[10px] font-bold tracking-wider">
                             <button onClick={() => updateStatus(order.id, 'DELIVERED')} className="text-blue-500 hover:text-blue-400 border border-blue-500/30 px-2 py-1 rounded transition-colors">MARK DELIVERED</button>
                             <button onClick={() => window.open(`/admin/delivery/${order.id}`, '_blank')} className="text-purple-500 hover:text-purple-400 border border-purple-500/30 px-2 py-1 rounded transition-colors">DOCUMENTS</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
