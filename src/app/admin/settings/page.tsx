"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Bitcoin, Check, AlertCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [btcAddress, setBtcAddress] = useState("");
  const [originalBtcAddress, setOriginalBtcAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        const addr = data.settings?.BTC_ADDRESS || "";
        setBtcAddress(addr);
        setOriginalBtcAddress(addr);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!btcAddress.trim()) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "BTC_ADDRESS", value: btcAddress.trim() }),
      });
      if (res.ok) {
        setOriginalBtcAddress(btcAddress.trim());
        setSaveResult("success");
      } else {
        setSaveResult("error");
      }
    } catch {
      setSaveResult("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveResult(null), 3000);
    }
  };

  const isDirty = btcAddress.trim() !== originalBtcAddress;

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-wider mb-2 flex items-center gap-3">
          <Settings size={24} /> SETTINGS
        </h1>
        <p className="text-gray-400 text-sm">
          Manage system-wide configuration for the platform.
        </p>
      </div>

      {/* Bitcoin Address Card */}
      <div className="bg-[#111111] rounded-2xl border border-[#222] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <Bitcoin size={20} className="text-orange-400" />
          </div>
          <div>
            <h2 className="font-bold tracking-wider text-sm">BITCOIN PAYMENT ADDRESS</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              The wallet address customers send Bitcoin payments to.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="h-12 bg-[#1a1a1a] rounded-xl animate-pulse" />
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-500 font-semibold tracking-wider uppercase mb-2 block">
                Wallet Address
              </label>
              <input
                type="text"
                value={btcAddress}
                onChange={(e) => setBtcAddress(e.target.value)}
                placeholder="e.g. bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {originalBtcAddress && (
              <div className="text-xs text-gray-500 bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a] font-mono break-all">
                <span className="text-gray-600 font-sans">Current: </span>
                {originalBtcAddress}
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                disabled={saving || !isDirty || !btcAddress.trim()}
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold tracking-wider rounded-xl transition-colors text-sm"
              >
                <Save size={16} />
                {saving ? "SAVING..." : "SAVE ADDRESS"}
              </button>

              {saveResult === "success" && (
                <div className="flex items-center gap-2 text-green-500 text-sm font-semibold">
                  <Check size={16} /> Saved successfully
                </div>
              )}
              {saveResult === "error" && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-semibold">
                  <AlertCircle size={16} /> Failed to save
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5 text-sm text-orange-300">
        <p className="font-bold tracking-wider mb-1">⚠ IMPORTANT</p>
        <p className="text-orange-400/80 text-xs leading-relaxed">
          This address will be shown to all new customers placing Bitcoin or Customer Care payment orders.
          Changes apply immediately to new orders. Existing orders retain the address set at the time of order.
        </p>
      </div>
    </div>
  );
}
