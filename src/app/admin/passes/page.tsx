
"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Download, FileText, CheckCircle, XCircle } from "lucide-react";

export default function AdminPassesPage() {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [passes, setPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [eligibleNames, setEligibleNames] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPass, setGeneratedPass] = useState<{ reference: string, rawPin: string, recipientName: string } | null>(null);

  const fetchData = () => {
    Promise.all([
      fetch('/api/admin/passes').then(res => res.json()),
      fetch('/api/admin/eligibility').then(res => res.json())
    ]).then(([passesData, eligData]) => {
      if (passesData.passes) setPasses(passesData.passes);
      if (eligData.list) setEligibleNames(eligData.list);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssuePass = async () => {
    if (!selectedName) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedName })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedPass({
          reference: data.pass.reference,
          rawPin: data.rawPin,
          recipientName: data.pass.recipientName
        });
        setSelectedName("");
        setSearch("");
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (_e) {
      alert("Error generating pass");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (reference: string) => {
    if (!confirm("Are you sure you want to revoke this pass?")) return;
    try {
      const res = await fetch(`/api/admin/passes/${reference}/revoke`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to revoke pass");
      }
    } catch (_e) {
      alert("Error revoking pass");
    }
  };

  const handleDownloadPDF = (reference: string, rawPin?: string) => {
    let url = `/api/admin/passes/pdf/${reference}`;
    if (rawPin) {
      url += `?pin=${encodeURIComponent(rawPin)}`;
    }
    window.open(url, "_blank");
  };

  const filteredNames = search.trim() ? eligibleNames.filter(n => n.name.toLowerCase().includes(search.toLowerCase())) : [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-wider mb-2">DISCOUNT PASSES</h1>
        <p className="text-gray-400 text-sm">Issue and manage secure discount credentials and PDFs.</p>
      </div>

      {!generatedPass ? (
        <div className="bg-[#111111] p-6 rounded-2xl border border-[#222]">
          <h2 className="text-sm font-semibold tracking-wider mb-4">ISSUE DISCOUNT PASS</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Search eligible names</label>
              <input 
                type="text" 
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedName(""); }}
                placeholder="Search database..."
                className="w-full bg-black border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-white transition-colors"
              />
            </div>

            {search.trim() && !selectedName && (
              <div className="bg-black border border-[#333] rounded-xl max-h-48 overflow-y-auto p-2 flex flex-col gap-1">
                {filteredNames.length === 0 ? (
                  <div className="p-3 text-xs text-gray-500">No matching eligible names found.</div>
                ) : (
                  filteredNames.map((n, i) => (
                    <button 
                      key={i}
                      onClick={() => setSelectedName(n.name)}
                      className="text-left p-3 text-sm hover:bg-[#1a1a1a] rounded-lg transition-colors capitalize"
                    >
                      {n.name}
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedName && (
              <div className="mt-4 border-t border-[#222] pt-4">
                <p className="text-xs text-gray-500 mb-2 uppercase">Recipient</p>
                <div className="flex items-center justify-between bg-black p-4 rounded-xl border border-[#333]">
                  <div>
                    <div className="font-bold capitalize">{selectedName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle size={12} className="text-green-500" />
                      <span className="text-[10px] text-green-500 tracking-wider font-bold">ELIGIBLE</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleIssuePass}
                    disabled={isGenerating}
                    className="bg-white text-black font-bold text-xs tracking-wider px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? "GENERATING..." : "GENERATE PIN & PDF"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border border-green-500/30 p-8 rounded-2xl flex flex-col items-center text-center">
          <CheckCircle size={40} className="text-green-500 mb-4" />
          <h2 className="text-xl font-bold tracking-wider mb-2 text-green-500">DISCOUNT PASS CREATED</h2>
          
          <div className="bg-black border border-[#333] w-full max-w-md rounded-xl p-6 mt-6 flex flex-col gap-4 text-left">
            <div>
              <p className="text-xs text-gray-500 uppercase">Recipient</p>
              <p className="font-bold text-lg capitalize">{generatedPass.recipientName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">PIN</p>
              <p className="font-mono font-bold text-2xl tracking-widest">{generatedPass.rawPin}</p>
              <p className="text-[10px] text-gray-400 mt-1">This PIN is shown only once. Please copy it now.</p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(generatedPass.rawPin);
                alert("PIN copied to clipboard!");
              }}
              className="bg-[#222] text-white font-bold text-xs tracking-wider px-6 py-3 rounded-xl hover:bg-[#333] transition-colors"
            >
              COPY PIN
            </button>
            <button 
              onClick={() => handleDownloadPDF(generatedPass.reference, generatedPass.rawPin)}
              className="bg-white text-black font-bold text-xs tracking-wider px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Download size={16} /> DOWNLOAD PDF
            </button>
          </div>
          
          <button 
            onClick={() => setGeneratedPass(null)}
            className="mt-8 text-xs text-gray-400 hover:text-white"
          >
            Create Another Pass
          </button>
        </div>
      )}

      <div className="bg-[#111111] rounded-2xl border border-[#222] overflow-hidden">
        <div className="p-6 border-b border-[#222]">
          <h2 className="text-sm font-semibold tracking-wider">ISSUED CREDENTIALS</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a1a1a] text-gray-400 text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">RECIPIENT</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">ISSUED</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">Loading passes...</td>
                </tr>
              ) : passes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No passes issued yet.</td>
                </tr>
              ) : (
                passes.map(pass => (
                  <tr key={pass.id} className="hover:bg-[#1a1a1a] transition-colors group">
                    <td className="p-4 font-medium capitalize">{pass.recipientName}</td>
                    <td className="p-4">
                      {pass.status === 'ACTIVE' && <span className="text-green-500 text-[10px] font-bold tracking-wider px-2 py-1 bg-green-500/10 rounded-md">ACTIVE</span>}
                      {pass.status === 'REVOKED' && <span className="text-red-500 text-[10px] font-bold tracking-wider px-2 py-1 bg-red-500/10 rounded-md">REVOKED</span>}
                      {pass.status === 'REDEEMED' && <span className="text-blue-500 text-[10px] font-bold tracking-wider px-2 py-1 bg-blue-500/10 rounded-md">REDEEMED</span>}
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                      {new Date(pass.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDownloadPDF(pass.reference)}
                          className="text-gray-400 hover:text-white p-2"
                          title="Download PDF"
                        >
                          <FileText size={16} />
                        </button>
                        {pass.status === 'ACTIVE' && (
                          <button 
                            onClick={() => handleRevoke(pass.reference)}
                            className="text-red-500 hover:text-red-400 p-2"
                            title="Revoke Pass"
                          >
                            <ShieldAlert size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
