"use client";

import { useEffect, useState, use } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function VerifyDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/verify/document/${unwrappedParams.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setDoc(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [unwrappedParams.id]);

  if (loading) return <div className="p-10 font-mono text-sm flex justify-center items-center h-screen bg-black text-white uppercase tracking-widest">Verifying...</div>;

  if (error || !doc) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-8">
      <AlertCircle className="w-16 h-16 text-red-500 mb-6" strokeWidth={1.5} />
      <h1 className="text-2xl font-bold tracking-[0.2em] uppercase text-red-500 mb-2">VERIFICATION FAILED</h1>
      <p className="text-gray-400 tracking-widest text-sm uppercase">Invalid or unrecognized document reference.</p>
    </div>
  );

  const prefixMap: any = {
    'PURCHASE_AGREEMENT': 'PA',
    'FINAL_INVOICE': 'INV',
    'PAYMENT_RECEIPT': 'REC',
    'VEHICLE_ORDER_SUMMARY': 'VOS',
    'DELIVERY_HANDOVER': 'DH',
    'REGISTRATION_DOCUMENT': 'RP',
    'INSURANCE': 'INS'
  };
  const prefix = prefixMap[doc.type] || 'DOC';
  const year = new Date(doc.createdAt).getFullYear();
  const shortId = doc.id.substring(doc.id.length - 6).toUpperCase();
  const docNumber = `${prefix}-${year}-${shortId}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="w-full max-w-md border border-[#222] bg-[#111] p-10 flex flex-col items-center shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>

        <CheckCircle className="w-16 h-16 text-green-500 mb-6" strokeWidth={1.5} />
        <h1 className="text-2xl font-black tracking-[0.2em] uppercase text-white mb-2">DOCUMENT VERIFIED</h1>
        <p className="text-gray-400 tracking-widest text-xs uppercase text-center mb-10">This is a genuine document issued by the Tesla Vehicle Purchase Platform.</p>

        <div className="w-full flex flex-col gap-6">
          <div className="border-b border-[#333] pb-4">
            <span className="block text-[10px] tracking-widest uppercase text-gray-500 mb-1">Document Number</span>
            <span className="font-bold text-lg tracking-wider">{docNumber}</span>
          </div>
          <div className="border-b border-[#333] pb-4">
            <span className="block text-[10px] tracking-widest uppercase text-gray-500 mb-1">Document Type</span>
            <span className="font-bold tracking-wider">{doc.type.replace(/_/g, ' ')}</span>
          </div>
          <div className="border-b border-[#333] pb-4">
            <span className="block text-[10px] tracking-widest uppercase text-gray-500 mb-1">Order Number</span>
            <span className="font-bold tracking-wider">{doc.orderId.substring(0, 10).toUpperCase()}</span>
          </div>
          <div className="border-b border-[#333] pb-4">
            <span className="block text-[10px] tracking-widest uppercase text-gray-500 mb-1">Issue Date</span>
            <span className="font-bold tracking-wider">{new Date(doc.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div>
            <span className="block text-[10px] tracking-widest uppercase text-gray-500 mb-1">Current Status</span>
            <span className="font-bold tracking-wider text-green-400">{doc.status.replace(/_/g, ' ')}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
