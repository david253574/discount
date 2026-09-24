"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import AppLayout from "@/components/Layout";
import { CheckCircle, XCircle, ShieldCheck, Loader2, Search, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { DISCOUNT_CONFIG } from "@/lib/discount";

export default function CheckDiscountPage() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [status, setStatus] = useState<"IDLE" | "LOADING" | "ELIGIBLE" | "NOT_ELIGIBLE" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = useState("");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [pricing, setPricing] = useState<any>(null);

  const [allNames, setAllNames] = useState<{name: string}[]>([]);
  const [loadingNames, setLoadingNames] = useState(true);
  const [directorySearch, setDirectorySearch] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/eligibility')
      .then(res => res.json())
      .then(data => {
        if (data.list) setAllNames(data.list);
      })
      .catch(() => {})
      .finally(() => setLoadingNames(false));
  }, []);

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName || !pin.trim()) {
      setStatus("ERROR");
      setErrorMessage("Please enter both your full name and PIN.");
      return;
    }
    
    setStatus("LOADING");
    setErrorMessage("");

    try {
      const res = await fetch('/api/eligibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, pin: pin.trim() })
      });
      
      if (!res.ok) throw new Error("API error");
      
      const data = await res.json();
      if (data.eligible) {
        setVerifiedName(data.name || trimmedName);
        setPricing(data.pricing);
        setStatus("ELIGIBLE");
        localStorage.setItem("verifiedDiscountName", data.name || trimmedName);
        localStorage.setItem("verifiedDiscountReference", data.reference);
        if (data.pricing && data.pricing.finalAmount !== undefined) {
          localStorage.setItem("verifiedDiscountAmount", data.pricing.finalAmount.toString());
        }
      } else {
        setStatus("NOT_ELIGIBLE");
        setPricing(null);
        localStorage.removeItem("verifiedDiscountName");
        localStorage.removeItem("verifiedDiscountReference");
      }
    } catch (_err) {
      setStatus("ERROR");
      setErrorMessage("We couldn't complete the verification right now. Please try again.");
    }
  };

  const handleNameClick = (clickedName: string) => {
    setName(clickedName);
    setStatus("IDLE");
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      pinInputRef.current?.focus();
    }, 400);
  };

  const filteredDirectory = useMemo(() => {
    if (!directorySearch.trim()) return allNames;
    const search = directorySearch.toLowerCase().trim();
    return allNames.filter(n => n.name.toLowerCase().includes(search));
  }, [allNames, directorySearch]);

  const groupedDirectory = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const item of filteredDirectory) {
      const rawFirstLetter = item.name.charAt(0).toUpperCase();
      const firstLetter = /[A-Z]/.test(rawFirstLetter) ? rawFirstLetter : '#';
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(item.name);
    }
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, string[]>);
  }, [filteredDirectory]);

  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span className="capitalize">{text}</span>;
    const regex = new RegExp(`(${highlight.trim()})`, 'gi');
    const parts = text.split(regex);
    return (
      <span className="capitalize">
        {parts.map((part, i) => 
          regex.test(part) ? 
          <span key={i} className="text-white font-bold bg-white/10 rounded-sm px-0.5">{part}</span> : 
          part
        )}
      </span>
    );
  };

  return (
    <AppLayout showHeader={true} title={DISCOUNT_CONFIG.name.toUpperCase()}>
      <div className="flex flex-col items-center justify-start min-h-screen px-4 pt-12 pb-24 md:pt-24 max-w-6xl mx-auto">
        
        <div className="max-w-2xl w-full mb-24">
          <div className="text-center mb-10">
            <h1 className="text-[10px] text-gray-500 font-bold tracking-[0.3em] mb-4 uppercase">{DISCOUNT_CONFIG.name}</h1>
            <h2 className="text-3xl md:text-4xl font-bold tracking-widest mb-4">ACCESS YOUR DISCOUNT</h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-md mx-auto">
              Enter your name and the PIN provided with your authorized pass.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#222] rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden max-w-lg mx-auto">
            
            {(status === "IDLE" || status === "LOADING" || status === "ERROR") && (
              <form onSubmit={handleCheck} className="flex flex-col gap-8 relative z-10 animate-in fade-in duration-300">
                <div className="flex flex-col gap-3">
                  <label htmlFor="name-input" className="text-xs font-bold tracking-widest text-gray-400 ml-1">FULL NAME</label>
                  <div className="relative">
                    <input 
                      ref={nameInputRef}
                      id="name-input"
                      type="text" 
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (status !== "IDLE") setStatus("IDLE"); }}
                      placeholder="e.g. Jane Doe"
                      autoComplete="name"
                      disabled={status === "LOADING"}
                      className={`w-full bg-[#111111] border ${status === "ERROR" ? "border-red-500/50 focus:border-red-500" : "border-[#333] focus:border-white"} rounded-xl p-4 md:p-5 text-base focus:outline-none transition-colors disabled:opacity-50`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 -mt-2">
                  <label htmlFor="pin-input" className="text-xs font-bold tracking-widest text-gray-400 ml-1 flex items-center gap-2"><Lock size={12}/> AUTHORIZED PIN</label>
                  <div className="relative">
                    <input 
                      ref={pinInputRef}
                      id="pin-input"
                      type="text"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); if (status !== "IDLE") setStatus("IDLE"); }}
                      placeholder="6-digit PIN"
                      disabled={status === "LOADING"}
                      className={`w-full bg-[#111111] font-mono tracking-[0.2em] border ${status === "ERROR" ? "border-red-500/50 focus:border-red-500" : "border-[#333] focus:border-white"} rounded-xl p-4 md:p-5 text-lg focus:outline-none transition-colors disabled:opacity-50`}
                    />
                  </div>
                  {status === "ERROR" && (
                    <p className="text-red-500 text-xs font-medium ml-1 animate-in slide-in-from-top-1">{errorMessage}</p>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={status === "LOADING" || !name.trim() || pin.length < 4}
                  className="w-full bg-white text-black font-bold text-sm tracking-widest py-4 md:py-5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[56px] md:h-[64px]"
                >
                  {status === "LOADING" ? (
                    <span className="flex items-center gap-3">
                      <Loader2 size={18} className="animate-spin" /> VERIFYING PIN...
                    </span>
                  ) : (
                    "ACCESS DISCOUNT"
                  )}
                </button>
                
                <div className="flex items-center justify-center gap-2 mt-2 opacity-70">
                  <ShieldCheck size={14} className="text-gray-500" />
                  <p className="text-[10px] text-gray-500 tracking-widest text-center uppercase">
                    Secured by Server-Side Verification
                  </p>
                </div>
              </form>
            )}

            {status === "ELIGIBLE" && (
              <div className="flex flex-col items-center text-center py-4 relative z-10 animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="flex items-center gap-2 text-green-500 mb-6">
                  <CheckCircle size={24} className="animate-in zoom-in duration-500 delay-150" />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase">DISCOUNT VERIFIED</span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold tracking-widest mb-2 uppercase text-white">
                  CONGRATULATIONS, {verifiedName}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mb-8">
                  Your authorized {DISCOUNT_CONFIG.name} pass has been verified successfully.
                </p>

                <div className="bg-[#111] border border-[#333] w-full rounded-2xl overflow-hidden mb-8 text-left flex flex-col">
                  {pricing && typeof pricing.finalAmount === 'number' && !isNaN(pricing.finalAmount) ? (
                    <div className="p-8 bg-black flex flex-col items-center justify-center text-center">
                      <span className="text-xs text-gray-500 font-bold tracking-[0.3em] uppercase mb-4">YOUR AUTHORIZED PRICE</span>
                      
                      <span className="text-5xl md:text-7xl font-bold text-white tracking-widest mb-6">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(pricing.finalAmount)}
                      </span>
                      
                      <span className="text-sm font-bold text-green-500 tracking-wider mb-2">
                        AVAILABLE FOR ALL VEHICLES
                      </span>
                      
                      <span className="text-xs text-gray-500">
                        Select a vehicle to see your exact discount.
                      </span>
                    </div>
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                      <span className="text-sm md:text-base font-bold text-yellow-500 tracking-widest mb-2">PENDING CONFIGURATION</span>
                      <span className="text-xs text-gray-500 tracking-widest uppercase max-w-xs leading-relaxed">Your eligibility is verified but your authorized price has not been configured yet.</span>
                    </div>
                  )}
                </div>

                <Link href={DISCOUNT_CONFIG.redirectUrl} className="w-full bg-white text-black font-bold text-sm tracking-widest py-4 md:py-5 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center h-[56px] md:h-[64px] mb-4 gap-2">
                  CONTINUE TO RESERVATION <ArrowRight size={18} />
                </Link>
              </div>
            )}

            {status === "NOT_ELIGIBLE" && (
              <div className="flex flex-col items-center text-center py-8 relative z-10 animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="w-24 h-24 bg-[#111111] text-gray-400 flex items-center justify-center rounded-full mb-8 border border-[#222]">
                  <XCircle size={48} className="animate-in zoom-in duration-500 delay-150" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-widest mb-4 uppercase">PIN NOT RECOGNIZED</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mb-10">
                  The PIN you entered is invalid or the credential has been revoked/expired. Please verify your details.
                </p>
                <button onClick={() => { setStatus("IDLE"); setPin(""); }} className="text-xs font-bold tracking-widest text-white border border-[#333] hover:bg-[#111] px-8 py-4 rounded-xl transition-colors">
                  TRY AGAIN
                </button>
              </div>
            )}
          </div>

          {status === "ELIGIBLE" && (
            <div className="mt-16 md:mt-24 max-w-2xl mx-auto px-4 md:px-0 animate-in fade-in duration-700 delay-300">
              <h3 className="text-[10px] font-bold tracking-[0.3em] text-gray-500 mb-10 text-center md:text-left">HOW TO USE YOUR DISCOUNT</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-4 relative">
                <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-[1px] bg-[#222] z-0"></div>
                {DISCOUNT_CONFIG.howToUse.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left relative z-10">
                    <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-[#333] flex items-center justify-center text-xs font-mono mb-5 text-white">{step.step}</div>
                    <h4 className="font-bold text-sm tracking-wider mb-3">{step.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed md:max-w-[180px]">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-5xl mx-auto border-t border-[#222] pt-24">
          <div className="flex flex-col items-center text-center mb-12">
            <h2 className="text-xs font-bold tracking-[0.3em] text-gray-500 mb-4 uppercase">Directory</h2>
            <h3 className="text-2xl md:text-3xl font-bold tracking-widest mb-4">Eligible Names</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-10">
              Search the directory to locate your name. Click your name to populate the authorization form.
            </p>
            
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-500" />
              </div>
              <input 
                type="text" 
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder="Search eligible names..."
                className="w-full bg-[#111111] border border-[#333] rounded-xl py-4 pl-12 pr-4 text-left focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          <div className="w-full">
            {loadingNames ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse px-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <div className="h-6 w-8 bg-[#222] rounded mb-2"></div>
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="h-10 w-full bg-[#111] rounded-lg"></div>
                    ))}
                  </div>
                ))}
              </div>
            ) : filteredDirectory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-[#111] rounded-3xl border border-[#222] max-w-2xl mx-auto">
                <Search size={32} className="text-gray-600 mb-4" />
                <h3 className="text-lg font-bold tracking-wider mb-2">No eligible names found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 px-4 md:px-0">
                {Object.keys(groupedDirectory).map((letter) => (
                  <div key={letter} className="flex flex-col">
                    <div className="text-2xl font-bold tracking-widest text-white border-b border-[#333] pb-3 mb-4 pl-2">
                      {letter}
                    </div>
                    <div className="flex flex-col gap-1">
                      {groupedDirectory[letter].map((personName, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleNameClick(personName)}
                          className="text-left px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors block w-full truncate"
                        >
                          {highlightMatch(personName, directorySearch)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
