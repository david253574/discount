"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/Layout';
import { use } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [variant, setVariant] = useState<any>(null);
  const [paymentType, setPaymentType] = useState<"BITCOIN" | "CUSTOMER_CARE">("BITCOIN");
  
  const [shipping, setShipping] = useState({ name: "", address: "", city: "", zip: "" });
  const [discountAmount, setDiscountAmount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/models/${id}`)
      .then(res => res.json())
      .then(data => {
        setModel(data.model);
        if (data.model?.variants?.length > 0) {
          setVariant(data.model.variants[0]);
        }
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const verifiedRef = localStorage.getItem('verifiedDiscountReference');
    const amtStr = localStorage.getItem('verifiedDiscountAmount');
    
    if (verifiedRef && amtStr && variant) {
      const amt = parseFloat(amtStr);
      if (!isNaN(amt) && variant.price >= amt) {
        setDiscountAmount(amt);
      }
    }
  }, [variant]);

  const submitOrder = async () => {
    if (!model || !variant) return;
    setSubmitting(true);
    try {
      const endpoint = paymentType === 'CUSTOMER_CARE' ? '/api/customer-care/requests' : '/api/orders';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: model.id,
          variantId: variant.id,
          discountReference: localStorage.getItem('verifiedDiscountReference'),
          name: shipping.name || "Customer",
          address: shipping.address || "N/A",
          city: shipping.city || "N/A",
          zip: shipping.zip || "N/A",
          paymentType,
        })
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/payment/${data.order.id}`);
      } else {
        const err = await res.json().catch(()=>({}));
        alert(err.error || 'An error occurred processing your request.');
      }
    } catch (_e) {
      alert('Unable to connect to Customer Care. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AppLayout showHeader={true} title="LOADING"><div className="flex justify-center items-center h-[50vh]">Loading...</div></AppLayout>;
  if (!model) return <AppLayout showHeader={true} title="NOT FOUND"><div className="flex justify-center items-center h-[50vh]">Model not found</div></AppLayout>;

  return (
    <AppLayout showHeader={true} title={model.name.toUpperCase()}> 
      <div className="flex flex-col md:flex-row md:h-[calc(100vh-64px)]">
        {step < 5 && (
          <div className="relative h-64 md:h-full md:flex-1 md:border-r border-[#222]">
            <img src={model.image} alt={model.name} className="w-full h-full object-cover" />
            
            {/* Discount Banner overlay */}
            {discountAmount !== null && variant && (
              <div className="absolute top-4 right-4 bg-[#ff6b00] text-white px-4 py-3 rounded-lg shadow-2xl flex flex-col items-center">
                <span className="text-[10px] font-bold tracking-widest opacity-80 mb-1">CHRISTMAS SPECIAL</span>
                <span className="font-bold text-lg">{(((variant.price - discountAmount) / variant.price) * 100).toFixed(1).replace('.0', '')}% OFF</span>
              </div>
            )}
            
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 md:p-12">
              <h1 className="text-3xl md:text-5xl font-bold mb-2">{model.name}</h1>
              <p className="text-gray-300 text-sm md:text-base">{variant?.name || model.subtitle}</p>
            </div>
          </div>
        )}

        <div className="flex-1 md:overflow-y-auto bg-[#0a0a0a] relative pb-24 md:pb-0">
          
          <div className="flex items-center px-4 py-3 md:px-8 md:py-6 border-b border-[#222] bg-[#111111] sticky top-0 z-10 text-[10px] md:text-xs font-semibold tracking-wider text-gray-500 overflow-x-auto whitespace-nowrap">
            <span className={step >= 1 ? "text-white" : ""}>1. ADDRESS</span>
            <ChevronRight size={14} className="mx-2" />
            <span className={step >= 2 ? "text-white" : ""}>2. PAYMENT METHOD</span>
          </div>

          {step === 1 && (
            <div className="px-4 py-6 md:px-8 md:py-10 flex flex-col gap-8 md:gap-12">
              <section>
                <h2 className="text-[11px] md:text-xs text-gray-400 tracking-wider font-semibold mb-4">SELECT VARIANT</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                  {model.variants?.map((v: any) => (
                    <div 
                      key={v.id}
                      onClick={() => setVariant(v)}
                      className={`min-w-[240px] md:min-w-[280px] p-5 rounded-xl border cursor-pointer snap-start transition-all ${variant?.id === v.id ? "border-white bg-[#111111]" : "border-[#333] hover:border-gray-500"}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-sm">{v.name}</h3>
                        {v.popular && <span className="text-[9px] font-bold bg-white text-black px-2 py-0.5 rounded-full">POPULAR</span>}
                      </div>
                      <p className="text-xl font-bold mb-4">${v.price.toLocaleString()}</p>
                      <div className="flex gap-4 text-xs text-gray-400">
                        <div className="flex flex-col"><span className="text-white font-medium">{v.range}</span><span>Range</span></div>
                        <div className="flex flex-col"><span className="text-white font-medium">{v.speed}</span><span>Top Speed</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-[11px] md:text-xs text-gray-400 tracking-wider font-semibold mb-4">SHIPPING DETAILS</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Full Name" value={shipping.name} onChange={e => setShipping({...shipping, name: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-sm focus:outline-none focus:border-white transition-colors" />
                  <input type="text" placeholder="Address" value={shipping.address} onChange={e => setShipping({...shipping, address: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-sm focus:outline-none focus:border-white transition-colors" />
                  <input type="text" placeholder="City" value={shipping.city} onChange={e => setShipping({...shipping, city: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-sm focus:outline-none focus:border-white transition-colors" />
                  <input type="text" placeholder="ZIP Code" value={shipping.zip} onChange={e => setShipping({...shipping, zip: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-sm focus:outline-none focus:border-white transition-colors" />
                </div>
              </section>
              
              <section>
                <h2 className="text-[11px] md:text-xs text-gray-400 tracking-wider font-semibold mb-4">ORDER SUMMARY</h2>
                <div className="bg-[#111111] border border-[#222] rounded-xl p-6 text-sm flex flex-col gap-4">
                  {discountAmount !== null && variant ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Vehicle price</span>
                        <span className="text-gray-500 line-through decoration-[#444]">${variant.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Discount</span>
                        <span className="text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded text-xs tracking-wider">
                          {(((variant.price - discountAmount) / variant.price) * 100).toFixed(1).replace('.0', '')}% OFF
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-green-500">You Save</span>
                        <span className="text-green-500 font-bold">${(variant.price - discountAmount).toLocaleString()}</span>
                      </div>
                      <div className="w-full h-[1px] bg-[#333] my-2"></div>
                      <div className="flex justify-between font-bold text-xl md:text-2xl items-center">
                        <span className="text-[10px] md:text-xs text-gray-500 tracking-[0.3em] uppercase">AMOUNT TO PAY</span>
                        <span className="text-white text-3xl">${discountAmount.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Vehicle price</span>
                        <span>${variant.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Delivery</span>
                        <span>Calculated at checkout</span>
                      </div>
                      <div className="w-full h-[1px] bg-[#333] my-2"></div>
                      <div className="flex justify-between font-bold text-xl md:text-2xl">
                        <span>Total</span>
                        <span>${variant.price.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <p className="text-[10px] md:text-xs text-gray-500 text-center mt-2">Excludes taxes and local fees</p>
                </div>
              </section>
            </div>
          )}

          {step === 2 && (
            <div className="px-4 py-6 md:px-8 md:py-10 flex flex-col gap-6 w-full max-w-xl mx-auto">
              <h2 className="text-[11px] md:text-xs text-gray-400 tracking-wider font-semibold">PAYMENT METHOD</h2>
              <div className="flex flex-col gap-4">
                <div 
                  onClick={() => setPaymentType("BITCOIN")}
                  className={`p-6 border rounded-xl cursor-pointer transition-colors ${paymentType === "BITCOIN" ? "border-[#1d4ed8] bg-blue-500/10" : "border-[#333] bg-[#111111] hover:border-gray-500"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#f7931a] flex items-center justify-center text-white font-bold text-xl">₿</div>
                    <h3 className="font-bold text-lg">Bitcoin</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed ml-11">Pay using Bitcoin and submit your transaction ID for verification.</p>
                </div>
                
                <div 
                  onClick={() => setPaymentType("CUSTOMER_CARE")}
                  className={`p-6 border rounded-xl cursor-pointer transition-colors ${paymentType === "CUSTOMER_CARE" ? "border-[#1d4ed8] bg-blue-500/10" : "border-[#333] bg-[#111111] hover:border-gray-500"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center text-white font-bold text-sm">CC</div>
                    <h3 className="font-bold text-lg">Customer Care</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed ml-11">Need help completing your payment? Contact Customer Care for assistance.</p>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Bar */}
          {step < 3 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-[#0a0a0a] border-t border-[#222] max-w-md md:max-w-none mx-auto md:absolute md:w-[500px] lg:w-[600px] md:left-auto z-40">
              <button 
                onClick={() => {
                  if (step === 2) {
                    submitOrder();
                  } else {
                    setStep(s => s + 1);
                  }
                }}
                disabled={submitting || (step === 1 && (!shipping.name || !shipping.address || !shipping.city || !shipping.zip))}
                className={`w-full py-4 md:py-5 font-bold text-[13px] md:text-sm tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors ${submitting || (step === 1 && (!shipping.name || !shipping.address || !shipping.city || !shipping.zip)) ? "bg-[#333] text-gray-500" : "bg-[#1d4ed8] text-white hover:bg-blue-600"}`}
              >
                {step === 1 && "Continue to Payment ↗"}
                {step === 2 && (!submitting ? "Confirm Reservation ↗" : "Processing...")}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
