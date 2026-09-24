
"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Check, X, Eye } from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleUpdate = async (id: string, status: string) => {
    if (status === 'REJECTED' && !rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: rejectReason })
      });
      if (res.ok) {
        setSelectedPayment(null);
        setRejectReason("");
        fetchPayments();
      } else {
        alert("Error updating payment");
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-wider mb-2">PAYMENTS</h1>
          <p className="text-gray-400 text-sm">Review and confirm customer Bitcoin payments.</p>
        </div>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#222] overflow-hidden flex flex-col min-h-[60vh]">
        <div className="p-4 border-b border-[#222] flex gap-4 bg-[#1a1a1a]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search by customer or order..." 
              className="w-full bg-[#111] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#333] rounded-lg text-sm font-semibold tracking-wider hover:bg-[#222] transition-colors">
            <Filter size={16} /> FILTER
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a1a1a] text-gray-400 text-[10px] tracking-wider font-semibold sticky top-0">
              <tr>
                <th className="p-4">CUSTOMER</th>
                <th className="p-4">ORDER</th>
                <th className="p-4">AMOUNT DUE</th>
                <th className="p-4">METHOD</th>
                <th className="p-4">STATUS</th>
                <th className="p-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading payments...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No payments found.</td></tr>
              ) : (
                payments.map(p => {
                  const statusColor = 
                    p.status === 'CONFIRMED' ? 'text-green-500 bg-green-500/10' :
                    p.status === 'REJECTED' ? 'text-red-500 bg-red-500/10' :
                    p.status === 'UNDER_REVIEW' ? 'text-blue-500 bg-blue-500/10' :
                    'text-yellow-500 bg-yellow-500/10';

                  return (
                    <tr key={p.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{p.order?.name}</div>
                        <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-xs">{p.orderId.substring(0,8).toUpperCase()}</div>
                      </td>
                      <td className="p-4 font-bold">
                        ${p.amountDue.toLocaleString()} {p.currency}
                      </td>
                      <td className="p-4 text-xs font-semibold tracking-wider">
                        {p.method}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded-md ${statusColor}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setSelectedPayment(p)}
                          className="px-3 py-1.5 border border-[#333] rounded text-xs font-bold tracking-wider hover:bg-[#222] transition-colors inline-flex items-center gap-1"
                        >
                          <Eye size={14} /> REVIEW
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#222] rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative">
            <button 
              onClick={() => { setSelectedPayment(null); setRejectReason(""); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-xl font-bold tracking-wider mb-6">PAYMENT REVIEW</h2>
            
            <div className="space-y-4 mb-8 text-sm bg-[#1a1a1a] p-5 rounded-xl border border-[#333]">
              <div className="flex justify-between border-b border-[#222] pb-3">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium">{selectedPayment.order?.name}</span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-3">
                <span className="text-gray-500">Order</span>
                <span className="font-mono">{selectedPayment.orderId.substring(0,8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-3">
                <span className="text-gray-500">Vehicle</span>
                <span className="font-medium">{selectedPayment.order?.model?.name} {selectedPayment.order?.variant?.name}</span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-3">
                <span className="text-gray-500">Original Price</span>
                <span className="font-medium line-through decoration-gray-500">${selectedPayment.order?.variant?.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-3">
                <span className="text-gray-500">Discount Amount</span>
                <span className="font-medium text-green-500">
                  ${selectedPayment.order?.discountAmount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-3">
                <span className="text-gray-500 font-bold">Amount Due</span>
                <span className="font-bold text-lg">${selectedPayment.amountDue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-3">
                <span className="text-gray-500">Status</span>
                <span className="font-bold text-blue-500">{selectedPayment.status.replace('_', ' ')}</span>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-gray-500">Bitcoin TXID:</span>
                <span className="font-mono break-all bg-[#111] p-2 rounded border border-[#222]">
                  {selectedPayment.txid || 'Not submitted'}
                </span>
              </div>
              {selectedPayment.message && (
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-gray-500">Customer Message:</span>
                  <span className="bg-[#111] p-2 rounded border border-[#222]">
                    {selectedPayment.message}
                  </span>
                </div>
              )}
            </div>

            {selectedPayment.status === 'UNDER_REVIEW' && (
              <div className="flex flex-col gap-4">
                <input 
                  type="text"
                  placeholder="Rejection reason (required if rejecting)"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-3 text-sm focus:border-red-500 outline-none"
                />
                <div className="flex gap-4">
                  <button 
                    disabled={updating}
                    onClick={() => handleUpdate(selectedPayment.id, 'REJECTED')}
                    className="flex-1 py-3 border border-red-500/50 text-red-500 font-bold tracking-wider rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    REJECT
                  </button>
                  <button 
                    disabled={updating}
                    onClick={() => handleUpdate(selectedPayment.id, 'CONFIRMED')}
                    className="flex-[2] py-3 bg-green-600 text-white font-bold tracking-wider rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} /> CONFIRM PAYMENT
                  </button>
                </div>
              </div>
            )}
            
            {selectedPayment.status === 'CONFIRMED' && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-500 text-center rounded-lg font-bold">
                PAYMENT CONFIRMED
              </div>
            )}
            
            {selectedPayment.status === 'REJECTED' && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-center rounded-lg font-bold">
                PAYMENT REJECTED
                {selectedPayment.rejectionReason && <div className="text-xs mt-1 font-normal text-red-400">{selectedPayment.rejectionReason}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
