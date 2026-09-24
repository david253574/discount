
"use client";

import { useEffect, useState, use } from 'react';

export default function DocumentViewPage({ params }: { params: Promise<{ id: string, type: string }> }) {
  const unwrappedParams = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/delivery/${unwrappedParams.id}`)
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
        if (typeof window !== 'undefined' && window.location.search.includes('print=true')) {
          setTimeout(() => window.print(), 1000);
        }
      })
      .catch(() => setLoading(false));
  }, [unwrappedParams.id]);

  if (loading) return <div className="p-10 font-mono text-sm text-center tracking-widest uppercase">Initializing Document...</div>;
  if (!order || order.error) return <div className="p-10 font-mono text-sm text-center tracking-widest uppercase text-red-500">Document access denied or not found</div>;

  const doc = order.documents?.find((d: any) => d.type === unwrappedParams.type);
  if (!doc) return <div className="p-10 font-mono text-sm text-center tracking-widest uppercase">Document record unavailable</div>;

  // Stable document numbering
  const prefixMap: Record<string, string> = {
    'PURCHASE_AGREEMENT': 'PA',
    'FINAL_INVOICE': 'INV',
    'PAYMENT_RECEIPT': 'REC',
    'VEHICLE_ORDER_SUMMARY': 'VOS',
    'DELIVERY_HANDOVER': 'DH',
    'REGISTRATION_DOCUMENT': 'RP',
    'INSURANCE': 'INS'
  };
  const prefix = prefixMap[unwrappedParams.type] || 'DOC';
  const year = new Date(doc.createdAt).getFullYear();
  const shortId = doc.id.substring(doc.id.length - 6).toUpperCase();
  const docNumber = `${prefix}-${year}-${shortId}`;
  const orderNumber = order.id.substring(0, 10).toUpperCase();

  const docTitle = unwrappedParams.type.replace(/_/g, ' ');
  const issueDate = new Date(doc.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeString = new Date(doc.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  // Verification QR
  const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/document/${doc.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(verifyUrl)}`;

  // Watermark Component
  const Watermark = () => (
    <div className="watermark-layer fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 flex flex-col justify-center items-center select-none" style={{ opacity: 0.025 }}>
      <div className="text-[300px] font-black leading-none tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>T</div>
      <div className="text-[60px] font-black tracking-[0.5em] uppercase" style={{ fontFamily: 'Arial, sans-serif' }}>TESLA</div>
    </div>
  );

  return (
    <>
      <div className="document-wrapper min-h-screen bg-[#e5e7eb] flex justify-center py-4 md:py-10 font-sans text-black overflow-x-auto">
        <div className="no-print fixed top-6 right-6 flex gap-4 z-50">
          <button onClick={() => window.print()} className="bg-black text-white px-6 py-3 font-bold text-[10px] tracking-widest uppercase hover:bg-gray-800 transition-colors shadow-2xl border border-gray-700">Download / Print PDF</button>
        </div>

        <div className="document-page bg-white w-full min-w-[210mm] max-w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl relative flex flex-col mx-auto overflow-hidden">
          
          <Watermark />

          <div className="content-layer relative z-10 flex flex-col h-full">
            {/* HEADER */}
            <header className="flex justify-between items-start border-b-2 border-black pb-8 mb-10 shrink-0">
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-black tracking-widest uppercase">TESLA</div>
                <div className="text-[9px] text-gray-500 font-bold tracking-[0.2em] uppercase mt-1">Vehicle Purchase Platform</div>
                <div className="text-[9px] text-gray-400 font-medium tracking-[0.1em] uppercase mt-1">Corporate Transaction Record</div>
              </div>
              <div className="text-right flex flex-col gap-1 items-end">
                <h1 className="text-lg font-black tracking-[0.15em] uppercase text-black bg-gray-100 px-4 py-1 border border-gray-300 mb-2">{docTitle}</h1>
                <div className="text-[10px] font-bold text-gray-800 mt-2 uppercase tracking-widest">Document No: {docNumber}</div>
                <div className="text-[10px] text-gray-600 uppercase tracking-widest">Order Ref: {orderNumber}</div>
                <div className="text-[10px] text-gray-600 uppercase tracking-widest">Issue Date: {issueDate}</div>
              </div>
            </header>

            <main className="flex-1 shrink-0 text-[12px] leading-relaxed flex flex-col gap-10">
              
              {/* 1. PURCHASE AGREEMENT */}
              {unwrappedParams.type === 'PURCHASE_AGREEMENT' && (
                <>
                  <div className="text-[11px] text-justify text-gray-700 leading-loose">
                    This Purchase Agreement ("Agreement") is executed via the Tesla Vehicle Purchase Platform. It formally records the transaction between the Seller and the Customer identified below for the specified vehicle and associated configurations.
                  </div>
                  
                  <div className="grid grid-cols-2 border-2 border-black">
                    <div className="p-6 border-r-2 border-black flex flex-col gap-2">
                      <h3 className="font-bold text-[10px] tracking-widest uppercase text-gray-500 mb-2 border-b border-gray-300 pb-2">PARTIES: CUSTOMER</h3>
                      <div className="font-black text-sm tracking-wider uppercase">{order.name}</div>
                      {order.phone && <div className="text-gray-700"><span className="font-bold text-[9px] tracking-widest uppercase mr-2 text-gray-400">Phone:</span> {order.phone}</div>}
                      <div className="text-gray-700"><span className="font-bold text-[9px] tracking-widest uppercase mr-2 text-gray-400">Address:</span> {order.address}, {order.city} {order.zip}</div>
                      {order.country && <div className="text-gray-700"><span className="font-bold text-[9px] tracking-widest uppercase mr-2 text-gray-400">Country:</span> {order.country}</div>}
                    </div>
                    <div className="p-6 flex flex-col gap-2 bg-gray-50">
                      <h3 className="font-bold text-[10px] tracking-widest uppercase text-gray-500 mb-2 border-b border-gray-300 pb-2">PARTIES: SELLER / PLATFORM</h3>
                      <div className="font-black text-sm tracking-wider uppercase">TESLA VEHICLE SALES</div>
                      <div className="text-gray-700"><span className="font-bold text-[9px] tracking-widest uppercase mr-2 text-gray-400">System:</span> Tesla Vehicle Purchase Platform</div>
                      <div className="text-gray-700"><span className="font-bold text-[9px] tracking-widest uppercase mr-2 text-gray-400">Record:</span> Automated Corporate Entity</div>
                    </div>
                  </div>

                  <div className="flex flex-col border border-gray-300">
                    <div className="bg-gray-100 p-3 border-b border-gray-300 font-bold text-[10px] tracking-widest uppercase">VEHICLE DETAILS</div>
                    <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-8">
                      <div><span className="block text-[9px] tracking-widest uppercase text-gray-500">Model</span><span className="font-bold text-sm tracking-wide">Tesla {order.model.name}</span></div>
                      <div><span className="block text-[9px] tracking-widest uppercase text-gray-500">Variant</span><span className="font-bold text-sm tracking-wide">{order.variant.name}</span></div>
                      <div><span className="block text-[9px] tracking-widest uppercase text-gray-500">Vehicle Identification Number (VIN)</span><span className="font-bold font-mono tracking-widest">{order.vin || 'PENDING ASSIGNMENT'}</span></div>
                      <div><span className="block text-[9px] tracking-widest uppercase text-gray-500">Original Base Price</span><span className="font-bold">${order.variant.price.toLocaleString()} USD</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="flex flex-col border border-gray-300">
                      <div className="bg-gray-100 p-3 border-b border-gray-300 font-bold text-[10px] tracking-widest uppercase">PRICING & SAVINGS</div>
                      <div className="p-5 flex flex-col gap-3">
                        <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-600">Vehicle Price</span><span className="font-bold">${order.variant.price.toLocaleString()} USD</span></div>
                        {(order.discountAmount || 0) > 0 && (
                          <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-600">Authorized Discount</span><span className="font-bold">-${order.discountAmount.toLocaleString()} USD</span></div>
                        )}
                        <div className="flex justify-between pt-2"><span className="font-bold text-[10px] tracking-widest uppercase">Final Amount Payable</span><span className="font-bold text-base">${order.finalAmount?.toLocaleString()} USD</span></div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col border border-gray-300">
                      <div className="bg-gray-100 p-3 border-b border-gray-300 font-bold text-[10px] tracking-widest uppercase">PAYMENT TERMS</div>
                      <div className="p-5 flex flex-col gap-3">
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-600">Method</span>
                          <span className="font-bold uppercase text-[10px] tracking-wider">{order.payment?.method === 'CUSTOMER_CARE' ? 'CUSTOMER CARE — MANUAL PAYMENT' : 'BITCOIN (BTC)'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-600">Status</span><span className="font-bold uppercase tracking-widest">{order.payment?.status}</span></div>
                        <div className="flex justify-between pt-2"><span className="font-bold text-[10px] tracking-widest uppercase">Amount Confirmed</span><span className="font-bold text-base">${(order.payment?.status === 'CONFIRMED' ? order.payment?.amountDue : 0).toLocaleString()} USD</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-600 text-justify leading-relaxed border-t border-gray-300 pt-6">
                    <strong className="text-black uppercase tracking-widest">CUSTOMER ACKNOWLEDGEMENT:</strong> The Customer acknowledges the vehicle configuration, pricing, and transaction information detailed above. This document is automatically generated by the platform as a binding record of purchase upon payment confirmation. Electronic execution is recorded centrally.
                  </div>

                  <div className="grid grid-cols-2 gap-16 mt-8">
                    <div>
                      <div className="border-b border-black h-12 mb-3"></div>
                      <div className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">Customer Signature</div>
                      <div className="text-[9px] text-gray-500 mt-2 font-mono">{order.name.toUpperCase()}</div>
                      <div className="text-[9px] text-gray-500 mt-2">Date: ________________________</div>
                    </div>
                    <div>
                      <div className="border-b border-black h-12 mb-3"></div>
                      <div className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">Authorized Platform Representative</div>
                      <div className="text-[9px] text-gray-500 mt-2 font-mono">TESLA INTERNAL AUDIT</div>
                      <div className="text-[9px] text-gray-500 mt-2">Date: ________________________</div>
                    </div>
                  </div>
                </>
              )}

              {/* 2. FINAL INVOICE */}
              {unwrappedParams.type === 'FINAL_INVOICE' && (
                <>
                  <div className="grid grid-cols-2 gap-12">
                    <div className="border-l-4 border-black pl-6">
                      <h3 className="font-bold text-[10px] tracking-widest uppercase text-gray-500 mb-3">BILL TO</h3>
                      <div className="font-black text-sm tracking-wider uppercase mb-1">{order.name}</div>
                      <div className="text-gray-700">{order.address}</div>
                      <div className="text-gray-700">{order.city}, {order.zip}</div>
                      <div className="text-gray-700">{order.country}</div>
                      {order.phone && <div className="text-gray-700 mt-2">{order.phone}</div>}
                    </div>
                    <div className="text-right flex flex-col gap-2">
                      <div className="bg-gray-100 p-4 border border-gray-300 inline-block ml-auto min-w-[250px]">
                        <h3 className="font-bold text-[10px] tracking-widest uppercase text-gray-500 mb-2 border-b border-gray-300 pb-2 text-left">INVOICE SUMMARY</h3>
                        <div className="flex justify-between mb-1"><span className="text-[10px] uppercase tracking-widest text-gray-600">Number</span><span className="font-bold">{docNumber}</span></div>
                        <div className="flex justify-between mb-1"><span className="text-[10px] uppercase tracking-widest text-gray-600">Date</span><span className="font-bold">{issueDate}</span></div>
                        <div className="flex justify-between"><span className="text-[10px] uppercase tracking-widest text-gray-600">Status</span><span className="font-bold tracking-widest uppercase">{order.payment?.status}</span></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-black text-white text-left">
                          <th className="py-3 px-4 text-[10px] tracking-widest uppercase font-bold">DESCRIPTION</th>
                          <th className="py-3 px-4 text-[10px] tracking-widest uppercase font-bold w-32">VEHICLE</th>
                          <th className="py-3 px-4 text-[10px] tracking-widest uppercase font-bold w-24 text-center">QTY</th>
                          <th className="py-3 px-4 text-[10px] tracking-widest uppercase font-bold w-32 text-right">UNIT PRICE</th>
                          <th className="py-3 px-4 text-[10px] tracking-widest uppercase font-bold w-32 text-right">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="py-5 px-4">
                            <div className="font-bold text-sm tracking-wide mb-1">Tesla {order.model.name}</div>
                            <div className="text-gray-600 text-[10px] uppercase tracking-widest">VIN: {order.vin || 'PENDING'}</div>
                          </td>
                          <td className="py-5 px-4 text-gray-700">{order.variant.name}</td>
                          <td className="py-5 px-4 text-center text-gray-700">1</td>
                          <td className="py-5 px-4 text-right text-gray-700">${order.variant.price.toLocaleString()}</td>
                          <td className="py-5 px-4 text-right font-bold">${order.variant.price.toLocaleString()}</td>
                        </tr>
                        {(order.discountAmount || 0) > 0 && (
                          <tr className="border-b border-gray-300 bg-gray-50">
                            <td className="py-5 px-4" colSpan={4}>
                              <div className="font-bold text-gray-800 tracking-wide text-xs">Authorized Discount / Corporate Savings</div>
                              <div className="text-gray-500 text-[9px] uppercase tracking-widest mt-1">Platform authorized pricing adjustment applied to order</div>
                            </td>
                            <td className="py-5 px-4 text-right font-bold text-black">-${order.discountAmount.toLocaleString()}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-between items-start mt-2">
                    <div className="w-1/2 pr-10">
                      <h3 className="font-bold text-[10px] tracking-widest uppercase text-gray-500 mb-2 border-b border-black pb-2">PAYMENT INFORMATION</h3>
                      <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                        <div className="text-gray-600 uppercase tracking-widest">Method</div>
                        <div className="font-bold uppercase">{order.payment?.method === 'CUSTOMER_CARE' ? 'CUSTOMER CARE — MANUAL PAYMENT' : 'BITCOIN (BTC)'}</div>
                        <div className="text-gray-600 uppercase tracking-widest">Status</div>
                        <div className="font-bold uppercase tracking-widest">{order.payment?.status}</div>
                        
                        {order.payment?.method !== 'CUSTOMER_CARE' && order.payment?.txid && (
                          <>
                            <div className="text-gray-600 uppercase tracking-widest mt-2">TXID Ref</div>
                            <div className="font-mono text-[9px] break-all mt-2">{order.payment.txid}</div>
                          </>
                        )}
                        
                        {order.payment?.status === 'CONFIRMED' && (
                          <>
                            <div className="text-gray-600 uppercase tracking-widest mt-2">Confirmation Date</div>
                            <div className="font-bold uppercase mt-2">{new Date(order.payment.updatedAt).toLocaleDateString()}</div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-1/2 border border-black p-6 bg-gray-50">
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="font-bold text-[10px] tracking-widest uppercase text-gray-600">SUBTOTAL</span>
                        <span className="font-bold">${order.variant.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-300">
                        <span className="font-bold text-[10px] tracking-widest uppercase text-gray-600">TOTAL SAVINGS</span>
                        <span className="font-bold">-${(order.discountAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b-2 border-black">
                        <span className="font-bold text-[11px] tracking-widest uppercase text-black">TOTAL AMOUNT</span>
                        <span className="font-black text-lg">${order.finalAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-gray-300">
                        <span className="font-bold text-[10px] tracking-widest uppercase text-gray-600">AMOUNT PAID</span>
                        <span className="font-bold">${(order.payment?.status === 'CONFIRMED' ? order.finalAmount : 0)?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-3 pt-4">
                        <span className="font-bold text-[12px] tracking-widest uppercase text-black">BALANCE DUE</span>
                        <span className="font-black text-xl">${(order.payment?.status === 'CONFIRMED' ? 0 : order.finalAmount)?.toLocaleString()} USD</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-gray-300 pt-6">
                    <h3 className="font-bold text-[10px] tracking-widest uppercase text-gray-500 mb-2">TRANSACTION NOTES</h3>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest leading-relaxed">
                      {order.payment?.status === 'CONFIRMED' 
                        ? 'Payment has been successfully received and confirmed. Zero balance remaining. Delivery preparation is authorized.' 
                        : 'Payment is pending or under review. Delivery preparation will commence upon full confirmation of funds.'}
                    </p>
                  </div>
                </>
              )}

              {/* 3. PAYMENT RECEIPT */}
              {unwrappedParams.type === 'PAYMENT_RECEIPT' && (
                <div className="flex-1 flex flex-col items-center justify-center py-10">
                  <div className="border-4 border-black p-12 max-w-2xl w-full relative bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="absolute -top-5 left-12 bg-white px-6 border-x-4 border-black">
                      <h2 className="text-2xl font-black tracking-[0.2em] uppercase">PAYMENT RECEIPT</h2>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-8 mt-6">
                      <div>
                        <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Receipt Number</span>
                        <span className="font-bold text-sm tracking-widest">{docNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Order Reference</span>
                        <span className="font-bold text-sm tracking-widest">{orderNumber}</span>
                      </div>
                      
                      <div className="col-span-2 border-t-2 border-gray-200 pt-8 mt-2">
                        <span className="block text-[10px] tracking-widest uppercase text-gray-500 mb-2">Received From Customer</span>
                        <span className="font-black text-2xl tracking-wider uppercase">{order.name}</span>
                        {order.address && <span className="block text-xs text-gray-600 mt-2 uppercase tracking-widest">{order.address}, {order.city}</span>}
                      </div>

                      <div className="col-span-2 border-t-2 border-black pt-8 mt-4 flex justify-between items-center bg-gray-50 p-6">
                        <span className="block text-[11px] tracking-widest uppercase text-black font-bold">Amount Received</span>
                        <span className="font-black text-4xl">${(order.payment?.status === 'CONFIRMED' ? order.payment?.amountDue : 0)?.toLocaleString()} <span className="text-xl text-gray-500">USD</span></span>
                      </div>

                      <div className="col-span-2 border-t-2 border-gray-200 pt-8 mt-4">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Payment Method</span>
                            <span className="font-bold text-sm uppercase tracking-wider">
                              {order.payment?.method === 'CUSTOMER_CARE' ? 'CUSTOMER CARE — MANUAL PAYMENT' : 'BITCOIN (BTC)'}
                            </span>
                            {order.payment?.method !== 'CUSTOMER_CARE' && order.payment?.txid && (
                              <div className="mt-3">
                                <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Transaction ID (TXID)</span>
                                <span className="font-mono text-[10px] break-all">{order.payment.txid}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Transaction Status</span>
                            <span className="font-bold text-sm uppercase tracking-widest">{order.payment?.status}</span>
                            <div className="mt-3">
                              <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Confirmation Date</span>
                              <span className="font-bold text-sm uppercase tracking-widest">{order.payment?.status === 'CONFIRMED' ? new Date(order.payment.updatedAt).toLocaleDateString() : 'PENDING'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-16 pt-8 border-t-2 border-black">
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest text-justify leading-relaxed">
                        This receipt confirms that the payment detailed above has been officially recorded by the Tesla Vehicle Purchase Platform. This is a corporate transaction record and does not imply banking certification. All payments are subject to final audit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. VEHICLE ORDER SUMMARY */}
              {unwrappedParams.type === 'VEHICLE_ORDER_SUMMARY' && (
                <>
                  <div className="flex gap-8 items-stretch mb-4">
                    <div className="flex-1 bg-gray-50 border border-gray-300 p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
                      <div className="absolute top-4 left-4 text-[10px] font-bold tracking-widest uppercase text-gray-400">VEHICLE CONFIGURATION</div>
                      <h2 className="text-3xl font-black uppercase tracking-[0.2em] mt-6 mb-2">TESLA {order.model.name}</h2>
                      <div className="text-gray-800 uppercase tracking-widest font-bold text-sm mb-6 pb-4 border-b border-gray-300 inline-block px-8">{order.variant.name}</div>
                      {order.model.image ? (
                        <img src={order.model.image} alt="Vehicle" className="w-full max-w-lg object-contain mix-blend-multiply drop-shadow-2xl z-10 relative" />
                      ) : (
                        <div className="h-48 flex items-center justify-center text-gray-300 font-mono text-sm tracking-widest uppercase">Image Unavailable</div>
                      )}
                    </div>
                    <div className="w-1/3 flex flex-col gap-4">
                      <div className="bg-black text-white p-6 flex-1">
                        <h3 className="font-bold text-[10px] tracking-widest uppercase text-gray-400 mb-4 border-b border-gray-700 pb-2">ORDER SPECS</h3>
                        <div className="flex flex-col gap-4">
                          <div><span className="block text-[9px] tracking-widest uppercase text-gray-500">Order Reference</span><span className="font-bold tracking-wider">{orderNumber}</span></div>
                          <div><span className="block text-[9px] tracking-widest uppercase text-gray-500">Order Date</span><span className="font-bold tracking-wider">{new Date(order.createdAt).toLocaleDateString()}</span></div>
                          <div><span className="block text-[9px] tracking-widest uppercase text-gray-500">Customer</span><span className="font-bold tracking-wider uppercase">{order.name}</span></div>
                          <div><span className="block text-[9px] tracking-widest uppercase text-gray-500">Order Status</span><span className="font-bold tracking-wider uppercase text-green-400">{order.status}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-12 gap-y-10 border-t-2 border-black pt-8">
                    <div>
                      <h3 className="font-bold text-[11px] tracking-widest uppercase text-black border-b border-gray-300 pb-2 mb-4 flex items-center"><span className="w-2 h-2 bg-black mr-3"></span>TECHNICAL SPECIFICATIONS</h3>
                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b border-gray-100"><td className="py-3 text-gray-600 uppercase tracking-widest text-[9px]">Est. Range</td><td className="py-3 font-bold text-right">{order.variant.range}</td></tr>
                          <tr className="border-b border-gray-100"><td className="py-3 text-gray-600 uppercase tracking-widest text-[9px]">Top Speed</td><td className="py-3 font-bold text-right">{order.variant.speed}</td></tr>
                          <tr className="border-b border-gray-100"><td className="py-3 text-gray-600 uppercase tracking-widest text-[9px]">Acceleration (0-60 mph)</td><td className="py-3 font-bold text-right">{order.variant.acceleration}</td></tr>
                          <tr className="border-b border-gray-100"><td className="py-3 text-gray-600 uppercase tracking-widest text-[9px]">Powertrain / Layout</td><td className="py-3 font-bold text-right">Dual Motor All-Wheel Drive (Standard)</td></tr>
                          <tr className="border-b border-gray-100"><td className="py-3 text-gray-600 uppercase tracking-widest text-[9px]">Autopilot</td><td className="py-3 font-bold text-right">Basic Autopilot Included</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h3 className="font-bold text-[11px] tracking-widest uppercase text-black border-b border-gray-300 pb-2 mb-4 flex items-center"><span className="w-2 h-2 bg-black mr-3"></span>FINANCIAL & DELIVERY SUMMARY</h3>
                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b border-gray-100"><td className="py-3 text-gray-600 uppercase tracking-widest text-[9px]">Original Base Price</td><td className="py-3 font-bold text-right">${order.variant.price.toLocaleString()} USD</td></tr>
                          <tr className="border-b border-gray-100"><td className="py-3 text-gray-600 uppercase tracking-widest text-[9px]">Authorized Savings</td><td className="py-3 font-bold text-right text-black">-${(order.discountAmount||0).toLocaleString()} USD</td></tr>
                          <tr className="border-b border-gray-100"><td className="py-3 text-gray-600 uppercase tracking-widest text-[9px]">Final Order Amount</td><td className="py-3 font-bold text-right">${order.finalAmount?.toLocaleString()} USD</td></tr>
                          <tr className="border-b border-gray-100"><td className="py-3 text-gray-600 uppercase tracking-widest text-[9px]">Payment Status</td><td className="py-3 font-bold text-right uppercase tracking-widest">{order.payment?.status}</td></tr>
                          <tr className="border-b border-gray-100"><td className="py-3 text-gray-600 uppercase tracking-widest text-[9px]">Delivery Location</td><td className="py-3 font-bold text-right uppercase">{order.deliveryAddress || 'PENDING'}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* 5. DELIVERY HANDOVER */}
              {unwrappedParams.type === 'DELIVERY_HANDOVER' && (
                <>
                  <div className="bg-black text-white p-6 mb-6 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] tracking-widest uppercase text-gray-400 mb-1">HANDOVER RECORD</div>
                      <div className="font-bold text-lg tracking-widest uppercase">VEHICLE DELIVERY CONFIRMATION</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] tracking-widest uppercase text-gray-400 mb-1">Status</div>
                      <div className="font-bold tracking-widest uppercase">{order.deliveryStatus || 'PENDING'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-0 border-2 border-black">
                    <div className="p-5 border-r-2 border-b-2 border-black bg-gray-50">
                      <span className="text-gray-500 block text-[9px] tracking-widest uppercase font-bold mb-1">Customer Name</span>
                      <span className="font-black text-sm tracking-wider uppercase">{order.name}</span>
                    </div>
                    <div className="p-5 border-b-2 border-black">
                      <span className="text-gray-500 block text-[9px] tracking-widest uppercase font-bold mb-1">Order Reference</span>
                      <span className="font-black text-sm tracking-wider uppercase">{orderNumber}</span>
                    </div>
                    <div className="p-5 border-r-2 border-black">
                      <span className="text-gray-500 block text-[9px] tracking-widest uppercase font-bold mb-1">Vehicle Details</span>
                      <span className="font-bold text-sm tracking-wide">Tesla {order.model.name} ({order.variant.name})</span>
                    </div>
                    <div className="p-5 bg-gray-50">
                      <span className="text-gray-500 block text-[9px] tracking-widest uppercase font-bold mb-1">Vehicle Identification Number (VIN)</span>
                      <span className="font-mono font-bold text-sm">{order.vin || 'TO BE PROVIDED / NOT YET ASSIGNED'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-12 mt-8">
                    <div>
                      <h3 className="font-bold text-[11px] tracking-widest uppercase text-black border-b-2 border-black pb-2 mb-4">DELIVERY LOGISTICS</h3>
                      <div className="flex flex-col gap-4">
                        <div>
                          <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Approved Delivery Location</span>
                          <div className="font-bold text-sm uppercase">{order.deliveryAddress || 'PENDING SUBMISSION'}</div>
                        </div>
                        <div>
                          <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Preferred Handover Date</span>
                          <div className="font-bold text-sm uppercase">{order.deliveryDatePref || 'PENDING SUBMISSION'}</div>
                        </div>
                        <div>
                          <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Delivery Instructions</span>
                          <div className="font-medium text-sm text-gray-700">{order.deliveryInstructions || 'None provided'}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-[11px] tracking-widest uppercase text-black border-b-2 border-black pb-2 mb-4">HANDOVER CHECKLIST</h3>
                      <div className="flex flex-col gap-3">
                        {['Vehicle physically received', 'Vehicle configuration verified', 'Vehicle identification (VIN) verified', 'Exterior condition inspected', 'Interior condition inspected', 'Included accessories checked', 'Documentation received'].map((item, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className="w-5 h-5 border-2 border-black shrink-0 mt-0.5"></div>
                            <span className="text-black font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-300 p-6 mt-8">
                    <h3 className="font-bold text-[10px] tracking-widest uppercase text-gray-500 mb-2">HANDOVER NOTES</h3>
                    <div className="w-full border-b border-gray-300 h-8"></div>
                    <div className="w-full border-b border-gray-300 h-8"></div>
                    <div className="w-full border-b border-gray-300 h-8"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-16 mt-12">
                    <div>
                      <div className="text-[10px] font-bold tracking-widest text-gray-800 uppercase mb-4">Customer Acknowledgement</div>
                      <div className="text-[9px] text-gray-500 mb-8 text-justify leading-relaxed">By signing below, I confirm receipt of the vehicle detailed above and acknowledge that it has been inspected to my satisfaction in accordance with the checklist criteria.</div>
                      <div className="border-b border-black h-8 mb-2"></div>
                      <div className="flex justify-between">
                        <div className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">Signature ({order.name})</div>
                        <div className="text-[9px] text-gray-500">Date: ______/______/______</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold tracking-widest text-gray-800 uppercase mb-4">Platform Representative</div>
                      <div className="text-[9px] text-gray-500 mb-8 text-justify leading-relaxed">Authorized platform representative confirms the physical handover of the vehicle and the completion of the delivery record in the system.</div>
                      <div className="border-b border-black h-8 mb-2"></div>
                      <div className="flex justify-between">
                        <div className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">Authorized Signature</div>
                        <div className="text-[9px] text-gray-500">Date: ______/______/______</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 6. REGISTRATION DOCUMENT */}
              {unwrappedParams.type === 'REGISTRATION_DOCUMENT' && (
                <>
                  <div className="bg-gray-100 border border-gray-300 p-8 text-center mb-8">
                    <h2 className="text-2xl font-black tracking-[0.2em] uppercase text-black mb-2">VEHICLE REGISTRATION PACK</h2>
                    <div className="text-xs font-bold tracking-[0.3em] uppercase text-gray-500">PLATFORM PREPARATION / TRACKING DOCUMENT</div>
                  </div>

                  <div className="grid grid-cols-2 gap-12">
                    <div className="flex flex-col gap-8">
                      <div className="border border-black p-6 relative">
                        <div className="absolute -top-3 left-4 bg-white px-2 font-bold text-[9px] tracking-widest uppercase text-gray-500">CUSTOMER INFORMATION</div>
                        <div className="font-black text-base tracking-wider uppercase mb-2">{order.name}</div>
                        <div className="text-gray-700 text-sm">{order.address}</div>
                        <div className="text-gray-700 text-sm">{order.city}, {order.zip}</div>
                        {order.phone && <div className="text-gray-700 text-sm mt-2">{order.phone}</div>}
                      </div>

                      <div className="border border-black p-6 relative">
                        <div className="absolute -top-3 left-4 bg-white px-2 font-bold text-[9px] tracking-widest uppercase text-gray-500">VEHICLE INFORMATION</div>
                        <div className="font-bold text-sm mb-1">Tesla {order.model.name}</div>
                        <div className="text-gray-700 text-xs uppercase tracking-widest mb-3">{order.variant.name}</div>
                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                          <span className="text-[9px] tracking-widest uppercase text-gray-500">VIN</span>
                          <span className="font-mono font-bold">{order.vin || 'PENDING ASSIGNMENT'}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center">
                          <span className="text-[9px] tracking-widest uppercase text-gray-500">Order Ref</span>
                          <span className="font-bold">{orderNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-8">
                      <div>
                        <h3 className="font-bold text-[10px] tracking-widest uppercase text-black border-b-2 border-black pb-2 mb-4">REGISTRATION STATUS</h3>
                        <div className={`inline-block px-6 py-3 font-black tracking-[0.2em] uppercase text-sm border-2 ${doc.status === 'READY' || doc.status === 'COMPLETED' ? 'border-green-600 text-green-600 bg-green-50' : 'border-black text-black bg-gray-50'}`}>
                          {doc.status.replace(/_/g, ' ')}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-4 leading-relaxed text-justify">
                          This status reflects the internal platform tracking state for registration preparation. This document is NOT a government-issued registration certificate.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-bold text-[10px] tracking-widest uppercase text-black border-b-2 border-black pb-2 mb-4">PREPARATION CHECKLIST</h3>
                        <div className="flex flex-col gap-3">
                          {[
                            { label: 'Customer identity verified', done: order.name !== null },
                            { label: 'Delivery address complete', done: order.deliveryAddress !== null },
                            { label: 'Vehicle identification (VIN) assigned', done: order.vin !== null },
                            { label: 'Payment fully confirmed', done: order.payment?.status === 'CONFIRMED' },
                            { label: 'Required documentation received', done: doc.status === 'UPLOADED' || doc.status === 'READY' || doc.status === 'APPROVED' }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`w-4 h-4 border border-black flex items-center justify-center shrink-0 ${item.done ? 'bg-black text-white' : 'bg-white'}`}>
                                {item.done && <span className="text-[10px]">✓</span>}
                              </div>
                              <span className={`text-xs ${item.done ? 'font-bold text-black' : 'text-gray-500'}`}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 7. INSURANCE */}
              {unwrappedParams.type === 'INSURANCE' && (
                <>
                  <div className="border-l-8 border-black pl-8 py-4 mb-8 bg-gray-50">
                    <h2 className="text-2xl font-black tracking-[0.2em] uppercase text-black mb-1">INSURANCE DOCUMENTATION</h2>
                    <div className="text-xs font-bold tracking-widest uppercase text-gray-500">Internal Platform Verification Record</div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 border-2 border-black p-8 relative">
                    <div className="absolute -top-3 left-6 bg-white px-2 font-bold text-[9px] tracking-widest uppercase text-gray-500">TRANSACTION DATA</div>
                    <div>
                      <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Customer</span>
                      <span className="font-black tracking-wider uppercase text-sm">{order.name}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Order Ref</span>
                      <span className="font-bold text-sm tracking-widest">{orderNumber}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">Vehicle</span>
                      <span className="font-bold text-sm">Tesla {order.model.name}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] tracking-widest uppercase text-gray-500 mb-1">VIN</span>
                      <span className="font-mono font-bold text-sm">{order.vin || 'PENDING ASSIGNMENT'}</span>
                    </div>
                  </div>

                  <div className="mt-10">
                    <h3 className="font-bold text-[10px] tracking-widest uppercase text-black border-b-2 border-black pb-2 mb-6">INSURANCE STATUS RECORD</h3>
                    
                    <div className="flex items-center justify-center p-12 border border-gray-300 bg-gray-50">
                      <div className="text-center">
                        <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4">Current Platform Status</div>
                        <div className="inline-block px-8 py-4 border-2 border-black font-black text-xl tracking-[0.2em] uppercase text-black bg-white">
                          {doc.status.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border border-gray-200 p-6 flex flex-col gap-4 text-xs text-gray-600 leading-relaxed text-justify">
                      <p>
                        This document serves solely as an internal platform record tracking the submission and verification of mandatory vehicle insurance documentation prior to delivery.
                      </p>
                      <p>
                        <strong>If Status is PENDING or REQUIRED:</strong> Valid insurance documentation must be uploaded by the customer or authorized representative. No coverage is currently recorded in the platform.
                      </p>
                      <p>
                        <strong>If Status is UPLOADED, APPROVED, or READY:</strong> Supporting insurance documents have been received. Actual policy details (Provider, Policy Number, Coverage Dates) are maintained securely in the platform document repository and are governed by the respective third-party insurance provider.
                      </p>
                      <p className="font-bold text-black uppercase tracking-widest text-[9px] mt-2 border-t border-gray-200 pt-4">
                        Disclaimer: The Tesla Vehicle Purchase Platform does not issue insurance policies. This record is not an insurance certificate.
                      </p>
                    </div>
                  </div>
                </>
              )}

            </main>

            {/* FOOTER */}
            <footer className="mt-16 pt-6 border-t-2 border-black shrink-0 flex justify-between items-end relative z-10">
              <div className="flex flex-col gap-1.5 max-w-[60%]">
                <div className="text-[9px] text-black font-bold uppercase tracking-[0.2em]">Generated electronically by Tesla Platform</div>
                <div className="text-[8px] text-gray-500 leading-relaxed text-justify pr-4">
                  This document is a certified extract from the corporate transaction database. Information contained herein is valid as of the generation timestamp. Not for government use unless accompanied by official third-party certificates.
                </div>
              </div>
              <div className="flex items-end gap-6 shrink-0">
                <div className="text-right flex flex-col gap-1">
                  <div className="text-[9px] font-bold text-black uppercase tracking-widest">Doc No: {docNumber}</div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest">{timeString}</div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest">Page 1 of 1</div>
                </div>
                <div className="w-16 h-16 border-2 border-black p-1 bg-white shrink-0">
                  <img src={qrUrl} alt="Verification QR Code" className="w-full h-full object-contain" />
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; size: auto; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            background: white !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
          .document-wrapper {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
            display: block !important;
            overflow: visible !important;
          }
          .document-page {
            box-shadow: none !important;
            width: 100% !important;
            max-width: none !important;
            min-height: auto !important;
            padding: 20mm !important;
            margin: 0 !important;
            page-break-after: always;
          }
          /* Ensure watermark prints correctly */
          .watermark-layer {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 0 !important;
          }
          .content-layer {
            position: relative !important;
            z-index: 10 !important;
          }
        }
      `}} />
    </>
  );
}
