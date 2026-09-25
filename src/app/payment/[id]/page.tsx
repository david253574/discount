"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/Layout";
import { Copy, Check, Send, AlertCircle, Clock, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.id;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [txid, setTxid] = useState("");
  const [optMsg, setOptMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showBitcoinForm, setShowBitcoinForm] = useState(false);
  const [chatBody, setChatBody] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/payment/${orderId}`);
      if (res.status === 401 || res.status === 403) {
        window.location.href = `/login?redirect=/payment/${orderId}`;
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Realtime: Ably subscription ─────────────────────────────────────────
  // When Ably delivers a `message.created` event we call fetchData() to get
  // the authoritative data from the existing authenticated API.
  // We do NOT trust the Ably payload itself as authorization.
  //
  // ABLY_POLLING_FALLBACK env var: set NEXT_PUBLIC_ABLY_POLLING_FALLBACK=true
  // in your .env.local to revert to 3-second polling during transition/testing.
  useEffect(() => {
    let ablyClient: any = null;
    let channel: any = null;
    let unmounted = false;

    const setupAbly = async () => {
      // Feature flag: opt out of Ably and use polling during transition
      if (process.env.NEXT_PUBLIC_ABLY_POLLING_FALLBACK === 'true') return;

      try {
        const { Realtime } = await import('ably');

        const tokenResponse = await fetch(`/api/ably/auth?orderId=${orderId}`);
        if (!tokenResponse.ok || unmounted) return;
        const tokenData = await tokenResponse.json();

        ablyClient = new Realtime({ authCallback: (_data: any, cb: any) => cb(null, tokenData) });
        channel = ablyClient.channels.get(`private:customer-care:order:${orderId}`);

        channel.subscribe('message.created', () => {
          if (!unmounted) fetchData();
        });

        // Reconcile on reconnect in case events were missed during disconnect
        ablyClient.connection.on('connected', () => {
          if (!unmounted) fetchData();
        });
      } catch (err) {
        console.warn('[Ably] Subscription failed, relying on polling fallback:', err);
      }
    };

    // Always do an initial fetch immediately
    fetchData();
    setupAbly();

    // Polling fallback — active only when Ably is unavailable or flag is set
    const interval =
      process.env.NEXT_PUBLIC_ABLY_POLLING_FALLBACK === 'true'
        ? setInterval(fetchData, 3000)
        : null;

    return () => {
      unmounted = true;
      if (channel) { try { channel.unsubscribe(); } catch (_) {} }
      if (ablyClient) { try { ablyClient.close(); } catch (_) {} }
      if (interval) clearInterval(interval);
    };
  }, [orderId]);

  const copyAddress = () => {
    if (data?.payment?.btcAddress) {
      navigator.clipboard.writeText(data.payment.btcAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txid.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/payment/${orderId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid, message: optMsg })
      });
      if (res.ok) {
        setShowSubmitForm(false);
        fetchData();
      } else {
        alert("Error submitting payment");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/payment/${orderId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: chatBody })
      });
      if (res.ok) {
        setChatBody("");
        fetchData();
      }
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (data?.payment?.status === 'CONFIRMED') {
      const timer = setTimeout(() => {
        router.push(`/delivery/${data.payment.orderId}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [data?.payment?.status, data?.payment?.orderId, router]);

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border border-[#333] bg-white animate-pulse"></div>
        </div>
      </AppLayout>
    );
  }

  if (!data || !data.payment) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold tracking-wider mb-2">PAYMENT NOT FOUND</h1>
          <p className="text-gray-400">The requested payment record could not be located.</p>
        </div>
      </AppLayout>
    );
  }

  const { payment, conversation } = data;
  const statusColor = 
    payment.status === 'CONFIRMED' ? 'text-green-500 bg-green-500/10' :
    payment.status === 'REJECTED' ? 'text-red-500 bg-red-500/10' :
    payment.status === 'UNDER_REVIEW' ? 'text-blue-500 bg-blue-500/10' :
    'text-yellow-500 bg-yellow-500/10';



  const isCustomerCare = payment.method === 'CUSTOMER_CARE';
  const showChat = isCustomerCare && payment.status !== 'CONFIRMED';

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto w-full px-4 py-12 flex flex-col gap-10 pb-32">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 border-b border-[#333] pb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-[0.1em] uppercase text-white">PAYMENT</h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-gray-400 text-xs md:text-sm font-medium tracking-widest uppercase">Order #{payment.orderId.substring(0, 10).toUpperCase()}</p>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 ${
                payment.status === 'CONFIRMED' ? 'bg-green-500' :
                payment.status === 'REJECTED' ? 'bg-red-500' :
                payment.status === 'UNDER_REVIEW' ? 'bg-blue-500' :
                'bg-yellow-500'
              }`}></div>
              <span className={`text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase ${
                payment.status === 'CONFIRMED' ? 'text-green-500' :
                payment.status === 'REJECTED' ? 'text-red-500' :
                payment.status === 'UNDER_REVIEW' ? 'text-blue-500' :
                'text-yellow-500'
              }`}>
                {payment.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* AMOUNT DUE SECTION */}
        {payment.status !== 'CONFIRMED' && (
          <div className="flex flex-col border-l-2 border-[#555] pl-6 py-2">
            <div className="text-[10px] md:text-xs text-gray-500 tracking-[0.2em] font-semibold mb-3 uppercase">AMOUNT DUE</div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
              ${payment.amountDue.toLocaleString()} <span className="text-xl md:text-2xl text-gray-500 font-medium tracking-normal">USD</span>
            </div>
            {!isCustomerCare && (
              <p className="text-xs text-gray-400 uppercase tracking-widest">Pay exact equivalent in Bitcoin</p>
            )}
          </div>
        )}

        {/* STATUS / ASSISTANCE CARDS */}
        {(payment.status === 'PENDING' || payment.status === 'REJECTED') && (
          <div className="flex flex-col gap-8 mt-2">
            
            {/* CUSTOMER CARE REQUESTED CARD */}
            {isCustomerCare && !showBitcoinForm && (
              <div className="flex flex-col border border-[#222] bg-[#0a0a0a]">
                <div className="flex items-center justify-between border-b border-[#222] p-4 bg-[#111]">
                  <h3 className="font-bold text-xs md:text-sm tracking-[0.2em] text-white uppercase">CUSTOMER CARE</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500"></div>
                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">REQUESTED</span>
                  </div>
                </div>
                <div className="p-6 md:p-8 flex flex-col gap-6">
                  <p className="text-sm text-gray-300 leading-relaxed tracking-wide">
                    A Customer Care representative will assist you with completing your payment.
                  </p>
                  <button 
                    onClick={() => setShowBitcoinForm(true)}
                    className="w-full py-4 bg-white text-black font-bold tracking-[0.1em] hover:bg-gray-200 transition-colors text-xs uppercase"
                  >
                    PROCEED TO BITCOIN PAYMENT
                  </button>
                </div>
              </div>
            )}

            {/* BITCOIN PAYMENT UI */}
            {(!isCustomerCare || showBitcoinForm) && (
              <div className="flex flex-col gap-8 animate-in fade-in">
                <div className="flex flex-col border border-[#222] bg-[#0a0a0a]">
                  <div className="p-4 border-b border-[#222] bg-[#111]">
                     <div className="text-[10px] md:text-xs text-gray-400 tracking-[0.2em] font-bold uppercase">Bitcoin Payment Address</div>
                  </div>
                  <div className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="font-mono text-sm md:text-base break-all text-white tracking-wider">
                      {payment.btcAddress}
                    </div>
                    <button 
                      onClick={copyAddress}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold text-xs hover:bg-gray-200 transition-colors shrink-0 w-full sm:w-auto uppercase tracking-widest"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "COPIED" : "COPY"}
                    </button>
                  </div>
                </div>

                {!showSubmitForm ? (
                  <div className="flex flex-col gap-4">
                    <div className="p-5 border border-[#222] bg-[#111] flex items-start gap-4">
                      <AlertCircle className="text-gray-400 shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-gray-300 leading-relaxed tracking-wide">
                        Follow the displayed payment instructions carefully. Send Bitcoin to the address above. Once your wallet confirms the transfer is sent, click below.
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowSubmitForm(true)}
                      className="w-full py-5 bg-white text-black font-bold tracking-[0.1em] hover:bg-gray-200 transition-colors text-xs uppercase"
                    >
                      I HAVE MADE PAYMENT
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submitPayment} className="flex flex-col gap-6 border border-[#222] bg-[#0a0a0a] p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-xs font-bold tracking-[0.2em] border-b border-[#333] pb-4 uppercase text-white">SUBMIT PAYMENT DETAILS</h3>
                    <div>
                      <label className="text-[10px] md:text-xs text-gray-500 font-bold tracking-[0.2em] mb-3 block uppercase">TRANSACTION ID / TXID</label>
                      <input 
                        type="text"
                        required
                        value={txid}
                        onChange={e => setTxid(e.target.value)}
                        placeholder="Enter Bitcoin transaction ID"
                        className="w-full bg-[#111] border border-[#333] p-4 text-sm text-white focus:outline-none focus:border-white transition-colors rounded-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs text-gray-500 font-bold tracking-[0.2em] mb-3 block uppercase">OPTIONAL MESSAGE</label>
                      <input 
                        type="text"
                        value={optMsg}
                        onChange={e => setOptMsg(e.target.value)}
                        placeholder="Additional information"
                        className="w-full bg-[#111] border border-[#333] p-4 text-sm text-white focus:outline-none focus:border-white transition-colors rounded-none"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                      <button 
                        type="button"
                        onClick={() => setShowSubmitForm(false)}
                        className="flex-1 py-4 border border-[#555] text-white font-bold tracking-[0.1em] hover:bg-[#222] transition-colors text-xs uppercase"
                      >
                        CANCEL
                      </button>
                      <button 
                        type="submit"
                        disabled={submitting}
                        className="flex-[2] py-4 bg-white text-black font-bold tracking-[0.1em] hover:bg-gray-200 transition-colors disabled:opacity-50 text-xs uppercase"
                      >
                        {submitting ? "SUBMITTING..." : "SUBMIT FOR REVIEW"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* REVIEW & CONFIRMED STATES */}
        {payment.status === 'UNDER_REVIEW' && (
          <div className="p-8 border border-blue-500/30 bg-blue-500/5 flex flex-col items-center text-center gap-6 mt-4">
            <Clock className="text-blue-500 w-10 h-10" strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-sm tracking-[0.2em] mb-3 text-white uppercase">PAYMENT UNDER REVIEW</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed tracking-wide">
                Your Bitcoin transaction ({payment.txid?.substring(0,8)}...) has been submitted and is currently being verified. This usually takes a few confirmations on the blockchain.
              </p>
            </div>
          </div>
        )}

                {payment.status === 'CONFIRMED' && (
          <div className="p-8 border border-green-500/30 bg-green-500/5 flex flex-col items-center text-center gap-6 mt-4">
            <Check className="text-green-500 w-10 h-10" strokeWidth={1.5} />
            <div>
              <h3 className="font-bold text-sm tracking-[0.2em] mb-3 text-white uppercase">PAYMENT CONFIRMED</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed tracking-wide mb-6">
                {isCustomerCare ? "Customer Care has manually confirmed your payment. Your order is now approved." : "Your payment has been successfully verified. Your order is now confirmed."}
              </p>
              <button 
                onClick={() => router.push(`/delivery/${payment.orderId}`)}
                className="px-8 py-4 bg-green-600 text-white font-bold tracking-[0.1em] hover:bg-green-500 transition-colors text-xs uppercase rounded-none"
              >
                PROCEED TO DELIVERY & DOCUMENTS →
              </button>
            </div>
          </div>
        )}

        {/* CUSTOMER CARE CHAT */}
        {showChat && (
          <div className="flex flex-col gap-6 mt-8">
            <div className="flex items-center justify-between border-b border-[#333] pb-4">
              <h2 className="text-xs font-bold tracking-[0.2em] text-white uppercase">CUSTOMER CARE</h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500"></div>
                <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">ONLINE</span>
              </div>
            </div>
            
            <div className="w-full flex flex-col bg-[#0a0a0a] border border-[#222] h-[500px]">
              <div className="p-4 border-b border-[#222] bg-[#111]">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">SECURE CHAT</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6">
                
                {/* Initial automated message */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] md:max-w-[80%] p-5 text-sm bg-[#111] text-gray-200 border-l-2 border-[#444]">
                    <p className="mb-3 text-gray-300 leading-relaxed">Your payment assistance request has been received.</p>
                    <p className="text-xs text-gray-400 leading-relaxed">A representative will review your order and assist you shortly.</p>
                  </div>
                </div>

                {conversation?.messages?.map((msg: any) => {
                  const isCustomer = msg.sender === 'CUSTOMER';
                  return (
                    <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] md:max-w-[80%] p-4 text-sm ${
                        isCustomer 
                          ? 'bg-[#1a1a1a] text-white border-r-2 border-white' 
                          : 'bg-[#111] text-gray-200 border-l-2 border-[#444]'
                      }`}>
                        <div className="text-[10px] text-gray-400 font-bold tracking-[0.2em] mb-2 uppercase">
                          {isCustomer ? 'You' : 'Customer Care'}
                        </div>
                        {msg.body && <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>}
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 flex flex-col gap-2">
                            {msg.attachments.map((att: any) => (
                              <div key={att.id} className="border border-[#333] bg-[#0a0a0a] p-2">
                                {att.mimeType?.startsWith('image/') ? (
                                  <img src={att.url} alt={att.filename} className="max-w-full max-h-48 object-contain" />
                                ) : (
                                  <a href={att.url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs truncate block">
                                    📎 {att.filename}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-[9px] mt-3 text-gray-500 font-bold tracking-[0.2em] uppercase text-right">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={sendMessage} className="p-4 md:p-6 border-t border-[#222] bg-[#111]">
                <div className="relative flex items-center">
                  <input 
                    type="text"
                    value={chatBody}
                    onChange={e => setChatBody(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-[#0a0a0a] border border-[#333] pl-4 pr-14 py-4 text-sm text-white focus:outline-none focus:border-white transition-colors rounded-none placeholder:tracking-wider"
                  />
                  <button 
                    type="submit"
                    disabled={sending || !chatBody.trim()}
                    className="absolute right-2 p-2.5 text-white bg-transparent disabled:opacity-50 hover:bg-[#222] transition-colors rounded-none"
                  >
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase mr-1">SEND</span>
                    <Send size={12} className="inline mb-0.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
