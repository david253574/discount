"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/Layout';
import { Check, Download, FileText, ChevronRight, Edit2 } from 'lucide-react';

export default function DeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);

  // Form states
  const [buyerData, setBuyerData] = useState({ phone: '', country: '', address: '', city: '', zip: '' });
  const [deliveryData, setDeliveryData] = useState({ deliveryAddress: '', deliveryPhone: '', deliveryDatePref: '', deliveryInstructions: '' });

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/delivery/${unwrappedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setBuyerData({
          phone: data.phone || '',
          country: data.country || '',
          address: data.address || '',
          city: data.city || '',
          zip: data.zip || ''
        });
        setDeliveryData({
          deliveryAddress: data.deliveryAddress || '',
          deliveryPhone: data.deliveryPhone || '',
          deliveryDatePref: data.deliveryDatePref || '',
          deliveryInstructions: data.deliveryInstructions || ''
        });
      } else {
        const err = await res.json().catch(()=>({}));
        setError(err.error || 'Failed to load delivery state');
      }
    } catch (e) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [unwrappedParams.id]);

  const updateSection = async (action: string, payload: any, callback: () => void) => {
    const res = await fetch(`/api/delivery/${unwrappedParams.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    if (res.ok) {
      callback();
      fetchOrder();
    } else {
      alert('Failed to update information');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-6 h-6 bg-white animate-pulse"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !order) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto w-full px-4 py-12">
          <div className="p-8 border border-red-500/30 bg-red-500/5 text-red-500 font-bold uppercase tracking-widest text-sm text-center">
            {error || 'Error loading delivery details'}
          </div>
        </div>
      </AppLayout>
    );
  }

  const isBuyerComplete = order.name && order.address && order.city && order.zip && order.phone && order.country;
  const isDeliveryComplete = order.deliveryAddress && order.deliveryPhone;

  const getDocStatus = (type: string) => {
    const d = order.documents?.find((doc: any) => doc.type === type);
    return d ? d.status : 'NOT_READY';
  };

  const getReadinessStr = () => {
    if (order.deliveryStatus === 'READY') return 'READY FOR DELIVERY';
    if (order.deliveryStatus === 'DELIVERED') return 'DELIVERED';
    return 'PREPARING';
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto w-full px-4 py-12 flex flex-col gap-12 pb-32">
        
        {/* HEADER */}
        <div className="flex flex-col gap-4 border-b border-[#333] pb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-[0.1em] uppercase text-white">DELIVERY & DOCUMENTS</h1>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-3 text-green-500">
              <Check size={16} strokeWidth={3} />
              <span className="text-xs font-bold tracking-widest uppercase">Payment Received</span>
            </div>
            <div className="flex items-center gap-3 text-green-500">
              <Check size={16} strokeWidth={3} />
              <span className="text-xs font-bold tracking-widest uppercase">Order Confirmed</span>
            </div>
          </div>
        </div>

        {/* VEHICLE */}
        <div className="flex flex-col border border-[#222] bg-[#0a0a0a]">
          <div className="p-4 border-b border-[#222] bg-[#111]">
            <h3 className="font-bold text-xs tracking-[0.2em] text-white uppercase">YOUR VEHICLE</h3>
          </div>
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2">
              <img src={order.model.image} alt={order.model.name} className="w-full h-auto object-cover" />
            </div>
            <div className="w-full md:w-1/2 flex flex-col gap-4">
              <h2 className="text-2xl font-bold tracking-wider text-white">TESLA {order.model.name.toUpperCase()}</h2>
              <div className="text-gray-400 text-sm tracking-widest uppercase">{order.variant.name}</div>
              <div className="text-xs text-gray-500 tracking-[0.2em] mt-4 uppercase">Order #{order.id.substring(0, 10)}</div>
            </div>
          </div>
        </div>

        {/* PREPARATION PROGRESS */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-[0.2em] text-white uppercase border-l-2 border-white pl-4 py-1">DELIVERY PREPARATION</h2>
            <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400">{getReadinessStr()}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* BUYER INFO */}
            <div className="border border-[#222] bg-[#0a0a0a] p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 tracking-[0.2em] font-bold">01</span>
                  <span className="text-xs font-bold text-white tracking-wider uppercase">BUYER INFORMATION</span>
                </div>
                <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${isBuyerComplete ? 'text-green-500' : 'text-yellow-500'}`}>
                  {isBuyerComplete ? 'COMPLETE' : 'REQUIRED'}
                </span>
              </div>
              {!showBuyerForm ? (
                <button 
                  onClick={() => setShowBuyerForm(true)}
                  className="mt-2 py-3 border border-[#333] hover:bg-[#111] transition-colors text-[10px] font-bold tracking-widest text-white uppercase text-center"
                >
                  {isBuyerComplete ? 'EDIT DETAILS' : 'PROVIDE DETAILS'}
                </button>
              ) : (
                <div className="flex flex-col gap-3 mt-2">
                  <input type="text" placeholder="Phone" value={buyerData.phone} onChange={e=>setBuyerData({...buyerData, phone: e.target.value})} className="bg-[#111] border border-[#333] p-3 text-xs text-white rounded-none w-full" />
                  <input type="text" placeholder="Address" value={buyerData.address} onChange={e=>setBuyerData({...buyerData, address: e.target.value})} className="bg-[#111] border border-[#333] p-3 text-xs text-white rounded-none w-full" />
                  <input type="text" placeholder="City" value={buyerData.city} onChange={e=>setBuyerData({...buyerData, city: e.target.value})} className="bg-[#111] border border-[#333] p-3 text-xs text-white rounded-none w-full" />
                  <input type="text" placeholder="ZIP" value={buyerData.zip} onChange={e=>setBuyerData({...buyerData, zip: e.target.value})} className="bg-[#111] border border-[#333] p-3 text-xs text-white rounded-none w-full" />
                  <input type="text" placeholder="Country" value={buyerData.country} onChange={e=>setBuyerData({...buyerData, country: e.target.value})} className="bg-[#111] border border-[#333] p-3 text-xs text-white rounded-none w-full" />
                  <button onClick={() => updateSection('BUYER_INFO', buyerData, () => setShowBuyerForm(false))} className="py-3 bg-white text-black text-[10px] font-bold tracking-widest uppercase">SAVE</button>
                </div>
              )}
            </div>

            {/* DELIVERY DETAILS */}
            <div className="border border-[#222] bg-[#0a0a0a] p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 tracking-[0.2em] font-bold">02</span>
                  <span className="text-xs font-bold text-white tracking-wider uppercase">DELIVERY DETAILS</span>
                </div>
                <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${isDeliveryComplete ? 'text-green-500' : 'text-yellow-500'}`}>
                  {isDeliveryComplete ? 'COMPLETE' : 'REQUIRED'}
                </span>
              </div>
              {!showDeliveryForm ? (
                <button 
                  onClick={() => setShowDeliveryForm(true)}
                  className="mt-2 py-3 border border-[#333] hover:bg-[#111] transition-colors text-[10px] font-bold tracking-widest text-white uppercase text-center"
                >
                  {isDeliveryComplete ? 'EDIT DETAILS' : 'PROVIDE DETAILS'}
                </button>
              ) : (
                <div className="flex flex-col gap-3 mt-2">
                  <input type="text" placeholder="Delivery Address" value={deliveryData.deliveryAddress} onChange={e=>setDeliveryData({...deliveryData, deliveryAddress: e.target.value})} className="bg-[#111] border border-[#333] p-3 text-xs text-white rounded-none w-full" />
                  <input type="text" placeholder="Contact Phone" value={deliveryData.deliveryPhone} onChange={e=>setDeliveryData({...deliveryData, deliveryPhone: e.target.value})} className="bg-[#111] border border-[#333] p-3 text-xs text-white rounded-none w-full" />
                  <input type="text" placeholder="Preferred Date (YYYY-MM-DD)" value={deliveryData.deliveryDatePref} onChange={e=>setDeliveryData({...deliveryData, deliveryDatePref: e.target.value})} className="bg-[#111] border border-[#333] p-3 text-xs text-white rounded-none w-full" />
                  <input type="text" placeholder="Instructions" value={deliveryData.deliveryInstructions} onChange={e=>setDeliveryData({...deliveryData, deliveryInstructions: e.target.value})} className="bg-[#111] border border-[#333] p-3 text-xs text-white rounded-none w-full" />
                  <button onClick={() => updateSection('DELIVERY_INFO', deliveryData, () => setShowDeliveryForm(false))} className="py-3 bg-white text-black text-[10px] font-bold tracking-widest uppercase">SAVE</button>
                </div>
              )}
            </div>

            {/* REGISTRATION */}
            <div className="border border-[#222] bg-[#0a0a0a] p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 tracking-[0.2em] font-bold">03</span>
                  <span className="text-xs font-bold text-white tracking-wider uppercase">REGISTRATION</span>
                </div>
                <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${getDocStatus('REGISTRATION_DOCUMENT') === 'READY' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {getDocStatus('REGISTRATION_DOCUMENT')}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-400">Staff will process your official vehicle registration.</div>
            </div>

            {/* INSURANCE */}
            <div className="border border-[#222] bg-[#0a0a0a] p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 tracking-[0.2em] font-bold">04</span>
                  <span className="text-xs font-bold text-white tracking-wider uppercase">INSURANCE</span>
                </div>
                <span className={`text-[9px] font-bold tracking-[0.2em] uppercase ${getDocStatus('INSURANCE') === 'APPROVED' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {getDocStatus('INSURANCE')}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-400">Please provide insurance details to your delivery advisor.</div>
            </div>

          </div>
        </div>

        {/* DOCUMENTS */}
        <div className="flex flex-col gap-6 mt-8">
          <h2 className="text-sm font-bold tracking-[0.2em] text-white uppercase border-l-2 border-white pl-4 py-1">CORE DOCUMENTS</h2>
          <div className="flex flex-col gap-4">
            
            {order.documents?.filter((d:any) => d.type !== 'REGISTRATION_DOCUMENT' && d.type !== 'INSURANCE').map((doc: any) => (
              <div key={doc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-[#222] bg-[#0a0a0a] p-6 gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-bold tracking-[0.15em] text-white uppercase">{doc.type.replace(/_/g, ' ')}</h3>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">{doc.status}</div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => window.open(`/delivery/${order.id}/document/${doc.type}`, '_blank')}
                    disabled={doc.status !== 'READY'}
                    className="flex-1 sm:flex-none py-3 px-6 bg-[#1a1a1a] text-white border border-[#333] font-bold tracking-[0.1em] text-[10px] uppercase hover:bg-[#222] disabled:opacity-50 rounded-none transition-colors"
                  >
                    VIEW DOCUMENT
                  </button>
                  <button 
                    onClick={() => {
                      const w = window.open(`/delivery/${order.id}/document/${doc.type}?print=true`, '_blank');
                    }}
                    disabled={doc.status !== 'READY'}
                    className="flex-1 sm:flex-none py-3 px-6 bg-white text-black font-bold tracking-[0.1em] text-[10px] uppercase hover:bg-gray-200 disabled:opacity-50 rounded-none transition-colors"
                  >
                    PRINT
                  </button>
                </div>
              </div>
            ))}

          </div>
        </div>

      </div>
    </AppLayout>
  );
}
