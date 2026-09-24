/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/Layout";
import { ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [tab, setTab] = useState<"INVESTMENT" | "SHOPPING">("SHOPPING");
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        if (data.models) setModels(data.models);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="flex justify-center my-4 gap-4 px-4">
        <button 
          onClick={() => setTab("INVESTMENT")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full border ${tab === "INVESTMENT" ? "bg-white text-black border-white" : "border-gray-600 text-gray-400"}`}
        >
          INVESTMENT
        </button>
        <button 
          onClick={() => setTab("SHOPPING")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full border ${tab === "SHOPPING" ? "bg-white text-black border-white" : "border-gray-600 text-gray-400"}`}
        >
          SHOPPING
        </button>
      </div>

      {tab === "SHOPPING" && (
        <div className="px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-8 w-full mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2">
              <h2 className="text-[11px] text-gray-400 tracking-wider font-semibold mb-3">ORDER SUMMARY</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111111] p-5 rounded-xl flex justify-between items-center border border-[#222]">
                  <div>
                    <h3 className="text-xs text-gray-400 font-medium mb-2">TOTAL ASSETS</h3>
                    <div className="text-4xl font-semibold mb-2">0</div>
                    <div className="text-[10px] text-gray-500 font-medium tracking-wider">VEHICLES & HARDWARE</div>
                  </div>
                  <ShoppingBag size={32} className="text-[#333]" />
                </div>

                <div className="bg-[#111111] p-5 rounded-xl flex justify-between items-center border border-[#222]">
                  <div>
                    <h3 className="text-xs text-gray-400 font-medium mb-2">IN TRANSIT</h3>
                    <div className="text-4xl font-semibold mb-2">0</div>
                    <div className="text-[10px] text-yellow-500 font-medium tracking-wider flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div> SHIPPING ACTIVE
                    </div>
                  </div>
                  <Truck size={32} className="text-[#333]" />
                </div>

                <div className="bg-[#111111] p-5 rounded-xl flex flex-col justify-center border border-[#222]">
                  <h3 className="text-xs text-gray-400 font-medium mb-2">TOTAL SPENT</h3>
                  <div className="text-4xl font-semibold mb-2">$0.00</div>
                  <div className="text-[10px] text-gray-500 font-medium tracking-wider">MARKET ESTIMATE</div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-[11px] text-gray-400 tracking-wider font-semibold mb-3">ASSET STATUS</h2>
              <div className="bg-[#111111] p-6 rounded-xl border border-[#222] flex items-center justify-center h-[164px]">
                <p className="text-gray-500 text-[11px] font-medium tracking-wider">NO ACTIVE ORDERS</p>
              </div>
            </section>
          </div>

          <section>
            <h2 className="text-[11px] text-gray-400 tracking-wider font-semibold mb-4">AVAILABLE MODELS</h2>
            {loading ? (
              <div className="text-center py-10 text-gray-500">Loading models...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {models.map((model) => (
                  <div key={model.slug} className="bg-[#111111] rounded-xl border border-[#222] overflow-hidden flex flex-col group hover:border-gray-500 transition-colors">
                    <div className="h-48 md:h-64 relative overflow-hidden">
                      <img src={model.image} alt={model.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-[15px] font-bold tracking-wider mb-6 uppercase">{model.name}</h3>
                      <div className="flex justify-between items-end mt-auto">
                        <div className="flex gap-6">
                          <div>
                            <div className="text-[10px] text-gray-400 font-medium mb-1.5 tracking-wider">RANGE</div>
                            <div className="text-sm font-bold uppercase">{model.range}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-400 font-medium mb-1.5 tracking-wider">ACCEL</div>
                            <div className="text-sm font-bold uppercase">{model.acceleration}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-[15px] font-bold">${model.price.toLocaleString()}</div>
                          <Link 
                            href={`/order/${model.slug}`}
                            className="px-5 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-gray-200 tracking-wider"
                          >
                            ORDER NOW
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "INVESTMENT" && (
        <div className="px-4 md:px-8 max-w-7xl mx-auto flex flex-col gap-6 w-full mt-4">
          <section>
            <h2 className="text-[11px] text-gray-400 tracking-wider font-semibold mb-4">ACCOUNT OVERVIEW</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#111111] p-6 rounded-xl border border-[#222]">
                <h3 className="text-[11px] text-gray-400 font-medium mb-3 tracking-wider">TOTAL BALANCE</h3>
                <div className="text-5xl font-semibold">$0.00</div>
              </div>
              
              <div className="bg-[#111111] p-6 rounded-xl border border-[#222]">
                <h3 className="text-[11px] text-gray-400 font-medium mb-3 tracking-wider">TOTAL PROFITS</h3>
                <div className="text-5xl font-semibold">$0.00</div>
              </div>

              <div className="bg-[#111111] p-6 rounded-xl border border-[#222]">
                <h3 className="text-[11px] text-gray-400 font-medium mb-3 tracking-wider">TOTAL INVESTED</h3>
                <div className="text-5xl font-semibold">$0.00</div>
              </div>
            </div>
          </section>
        </div>
      )}
    </AppLayout>
  );
}
