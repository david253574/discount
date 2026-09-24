
"use client";

import { useEffect, useState, use } from 'react';

export default function AdminDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [order, setOrder] = useState<any>(null);

  const fetchOrder = async () => {
    // We can reuse the customer endpoint or make an admin one. 
    // To be secure, admin needs an admin endpoint.
    const res = await fetch(`/api/admin/delivery/${unwrappedParams.id}`);
    if (res.ok) {
      setOrder(await res.json());
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [unwrappedParams.id]);

  const updateDocStatus = async (docId: string, status: string) => {
    await fetch(`/api/admin/delivery/${unwrappedParams.id}/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchOrder();
  };

  if (!order) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 text-white max-w-5xl mx-auto flex flex-col gap-8">
      <h1 className="text-2xl font-bold tracking-widest uppercase mb-4">DELIVERY & DOCUMENTS MANAGEMENT</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="border border-[#333] p-6 bg-[#111]">
          <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase">Order Details</h2>
          <div className="text-sm space-y-2">
            <div><span className="text-gray-400">Order ID:</span> {order.id}</div>
            <div><span className="text-gray-400">Customer:</span> {order.name}</div>
            <div><span className="text-gray-400">Vehicle:</span> {order.model.name} ({order.variant.name})</div>
            <div><span className="text-gray-400">Payment Status:</span> {order.payment?.status}</div>
            <div><span className="text-gray-400">Delivery Status:</span> <span className="text-blue-400 font-bold">{order.deliveryStatus}</span></div>
          </div>
        </div>
        
        <div className="border border-[#333] p-6 bg-[#111]">
          <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase">Information Completion</h2>
          <div className="text-sm space-y-2">
            <div>
              <span className="text-gray-400">Buyer Info:</span> 
              {(order.name && order.address && order.phone) ? <span className="text-green-500"> Complete</span> : <span className="text-yellow-500"> Incomplete</span>}
            </div>
            <div>
              <span className="text-gray-400">Delivery Info:</span> 
              {(order.deliveryAddress && order.deliveryPhone) ? <span className="text-green-500"> Complete</span> : <span className="text-yellow-500"> Incomplete</span>}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold tracking-widest uppercase mb-4 mt-8 border-b border-[#333] pb-2">Documents</h2>
        <div className="grid grid-cols-1 gap-4">
          {order.documents?.map((doc: any) => (
            <div key={doc.id} className="border border-[#222] bg-[#111] p-4 flex justify-between items-center">
              <div>
                <div className="font-bold text-sm uppercase tracking-wider">{doc.type.replace(/_/g, ' ')}</div>
                <div className="text-xs text-gray-400 mt-1">Status: <span className="text-white">{doc.status}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.open(`/delivery/${order.id}/document/${doc.type}`, '_blank')} className="px-4 py-2 border border-[#333] text-xs hover:bg-[#222]">VIEW</button>
                <select 
                  value={doc.status}
                  onChange={(e) => updateDocStatus(doc.id, e.target.value)}
                  className="bg-[#222] border border-[#444] text-xs p-2 focus:outline-none"
                >
                  <option value="NOT_READY">NOT READY</option>
                  <option value="REQUIRED">REQUIRED</option>
                  <option value="OPTIONAL">OPTIONAL</option>
                  <option value="NOT_APPLICABLE">NOT APPLICABLE</option>
                  <option value="UPLOADED">UPLOADED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="READY">READY</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
