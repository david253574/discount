
"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, Clock, User } from "lucide-react";

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [chatBody, setChatBody] = useState("");
  const [sending, setSending] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const intv = setInterval(fetchConversations, 10000);
    return () => clearInterval(intv);
  }, []);

  useEffect(() => {
    let ablyClient: any = null;
    let channel: any = null;
    let unmounted = false;

    if (activeId) {
      const fetchActive = async () => {
        const res = await fetch(`/api/payment/${activeId}`);
        if (res.ok && !unmounted) {
          const data = await res.json();
          setActiveConv({ ...data.conversation, order: data.payment.order, payment: data.payment });
        }
      };
      fetchActive();

      const setupAbly = async () => {
        if (process.env.NEXT_PUBLIC_ABLY_POLLING_FALLBACK === 'true') return;
        try {
          const { Realtime } = await import('ably');
          const tokenResponse = await fetch(`/api/ably/auth?orderId=${activeId}`);
          if (!tokenResponse.ok || unmounted) return;
          const tokenData = await tokenResponse.json();

          ablyClient = new Realtime({ authCallback: (_data: any, cb: any) => cb(null, tokenData) });
          channel = ablyClient.channels.get(`private:customer-care:order:${activeId}`);

          channel.subscribe('message.created', () => {
            if (!unmounted) fetchActive();
          });

          ablyClient.connection.on('connected', () => {
            if (!unmounted) fetchActive();
          });
        } catch (err) {
          console.warn('[Ably] Subscription failed', err);
        }
      };
      
      setupAbly();

      const intv = process.env.NEXT_PUBLIC_ABLY_POLLING_FALLBACK === 'true' ? setInterval(fetchActive, 5000) : null;
      return () => {
        unmounted = true;
        if (channel) { try { channel.unsubscribe(); } catch (_) {} }
        if (ablyClient) { try { ablyClient.close(); } catch (_) {} }
        if (intv) clearInterval(intv);
      };
    } else {
      setActiveConv(null);
    }
  }, [activeId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatBody.trim() || !activeId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/payment/${activeId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: chatBody, sender: 'CUSTOMER_CARE' })
      });
      if (res.ok) {
        setChatBody("");
        const data = await fetch(`/api/payment/${activeId}`).then(r => r.json());
        setActiveConv({ ...data.conversation, order: data.payment.order, payment: data.payment });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-wider mb-2">CONVERSATIONS</h1>
        <p className="text-gray-400 text-sm">Customer Care Support Inbox.</p>
      </div>

      <div className="bg-[#111111] border border-[#222] rounded-2xl flex-1 flex overflow-hidden min-h-[600px]">
        {/* Inbox List */}
        <div className="w-1/3 border-r border-[#222] flex flex-col bg-[#1a1a1a]">
          <div className="p-4 border-b border-[#222] font-bold tracking-widest text-xs text-gray-500">INBOX</div>
          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No conversations.</div>
            ) : (
              conversations.map(c => {
                const latestMsg = c.messages?.[0];
                return (
                  <div 
                    key={c.id} 
                    onClick={() => setActiveId(c.orderId)}
                    className={`p-4 border-b border-[#222] cursor-pointer hover:bg-[#222] transition-colors ${activeId === c.orderId ? 'bg-[#222] border-l-2 border-l-[#1d4ed8]' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-white">{c.order?.name || 'Unknown'}</span>
                      <span className="text-[10px] text-gray-500">{new Date(c.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="text-xs text-blue-500 font-mono mb-2">ORD-{c.orderId.substring(0,8).toUpperCase()}</div>
                    <p className="text-xs text-gray-400 truncate">
                      {latestMsg ? (latestMsg.sender === 'CUSTOMER_CARE' ? 'You: ' : '') + latestMsg.body : 'No messages yet'}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
          {activeConv ? (
            <>
              {/* Info Header */}
              <div className="p-5 border-b border-[#222] bg-[#111] flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{activeConv.order?.name}</h3>
                  <div className="text-sm text-gray-500">Order: ORD-{activeConv.orderId.substring(0,8).toUpperCase()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white mb-1">
                    {activeConv.payment?.method} / ${activeConv.payment?.amountDue.toLocaleString()}
                  </div>
                  <div className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded inline-block ${
                    activeConv.payment?.status === 'CONFIRMED' ? 'text-green-500 bg-green-500/10' :
                    activeConv.payment?.status === 'REJECTED' ? 'text-red-500 bg-red-500/10' :
                    activeConv.payment?.status === 'UNDER_REVIEW' ? 'text-blue-500 bg-blue-500/10' :
                    'text-yellow-500 bg-yellow-500/10'
                  }`}>
                    {activeConv.payment?.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                <div className="text-center text-xs text-gray-500 mb-4 border-b border-[#222] pb-4">
                  Conversation Started
                </div>
                {activeConv.messages?.map((msg: any) => (
                  <div key={msg.id} className={`flex ${(msg.sender === 'CUSTOMER_CARE' || msg.sender === 'ADMIN') ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-3 px-4 text-sm ${
                      (msg.sender === 'CUSTOMER_CARE' || msg.sender === 'ADMIN') 
                        ? 'bg-[#1d4ed8] text-white rounded-br-sm' 
                        : 'bg-[#222] text-gray-200 border border-[#333] rounded-bl-sm'
                    }`}>
                      <div className="text-[10px] mb-1 font-bold opacity-75">{(msg.sender === 'CUSTOMER_CARE' || msg.sender === 'ADMIN') ? 'CUSTOMER CARE' : activeConv.order?.name.toUpperCase()}</div>
                      {msg.body}
                      <div className={`text-[9px] mt-2 text-right opacity-50`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-5 border-t border-[#222] bg-[#111]">
                <div className="relative flex items-center">
                  <input 
                    type="text"
                    value={chatBody}
                    onChange={e => setChatBody(e.target.value)}
                    placeholder="Type a message to the customer..."
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:border-gray-500"
                  />
                  <button 
                    type="submit"
                    disabled={sending || !chatBody.trim()}
                    className="absolute right-2 p-2 text-white bg-[#1d4ed8] rounded-full disabled:opacity-50 hover:bg-blue-600 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
