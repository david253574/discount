
"use client";

import { useEffect, useState } from "react";
import { Trash2, Edit2, X, Check } from "lucide-react";

export default function AdminEligibilityPage() {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add state
  const [newName, setNewName] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [addError, setAddError] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [editError, setEditError] = useState("");

  const fetchList = () => {
    fetch('/api/admin/eligibility')
      .then(res => res.json())
      .then(data => {
        if (data.list) setList(data.list);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!newName.trim() || !newDiscount.trim()) {
      setAddError("Please fill out all fields.");
      return;
    }

    try {
      const res = await fetch('/api/admin/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName, 
          amountToPay: newDiscount 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNewName("");
        setNewDiscount("");
        fetchList();
      } else {
        setAddError(data.error || "Failed to add user");
      }
    } catch (_err) {
      setAddError("An error occurred");
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDiscount(item.amountToPay !== null ? String(item.amountToPay) : "");
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editDiscount.trim()) {
      setEditError("Fields cannot be empty.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/eligibility/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          amountToPay: editDiscount
        })
      });
      const data = await res.json();
      if (res.ok) {
        setEditingId(null);
        fetchList();
      } else {
        setEditError(data.error || "Failed to save");
      }
    } catch (_err) {
      setEditError("An error occurred");
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Are you sure you want to remove this name?")) return;
    try {
      const res = await fetch(`/api/admin/eligibility/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchList();
      }
    } catch (_err) {
      alert("Failed to remove name");
    }
  };

  const parsedNewDiscount = parseFloat(newDiscount);
  const isValidAmount = !isNaN(parsedNewDiscount) && parsedNewDiscount >= 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-wider mb-2">CHRISTMAS DISCOUNT ELIGIBILITY</h1>
        <p className="text-gray-400 text-sm">Manage the list of eligible customers and their global discount authorization.</p>
      </div>

      <div className="bg-[#111111] p-6 rounded-2xl border border-[#222]">
        <h2 className="text-sm font-semibold tracking-wider mb-4">ADD NEW ELIGIBLE CUSTOMER</h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Full Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Daniel Wilson"
                className="w-full bg-black border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-white transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2 block">Amount Customer Pays ($)</label>
              <input 
                type="number" 
                value={newDiscount}
                onChange={e => setNewDiscount(e.target.value)}
                placeholder="e.g. 4000"
                className="w-full bg-black border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>
          
          <div className="border-t border-[#333] my-2 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black p-4 rounded-xl border border-[#333]">
              <div>
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">AUTHORIZED AMOUNT</p>
                <p className="text-xl font-bold text-white mt-1">{isValidAmount ? formatCurrency(parsedNewDiscount) : "$0"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">APPLIES TO</p>
                <p className="text-sm font-bold text-green-500 mt-2 tracking-wider">ALL VEHICLES</p>
                <p className="text-xs text-gray-400 mt-1">The discount percentage and savings are calculated automatically when the customer selects a vehicle.</p>
              </div>
            </div>
          </div>

          {addError && <p className="text-red-500 text-xs">{addError}</p>}
          
          <div className="flex justify-end mt-2">
            <button 
              type="submit" 
              className="bg-white text-black font-bold text-xs tracking-wider px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              ADD ELIGIBLE CUSTOMER
            </button>
          </div>
        </form>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#222] overflow-hidden">
        <div className="p-6 border-b border-[#222]">
          <h2 className="text-sm font-semibold tracking-wider">ELIGIBILITY LIST</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1a1a1a] text-gray-400 text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">NAME</th>
                <th className="p-4 text-right">AUTHORIZED AMOUNT</th>
                <th className="p-4">APPLIES TO</th>
                <th className="p-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">Loading list...</td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No names on the list yet.</td>
                </tr>
              ) : (
                list.map(item => {
                  const isEditing = editingId === item.id;
                  
                  if (isEditing) {
                    return (
                      <tr key={item.id} className="bg-black">
                        <td className="p-4">
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-sm focus:outline-none focus:border-white" />
                        </td>
                        <td className="p-4">
                          <input type="number" step="0.01" value={editDiscount} onChange={e => setEditDiscount(e.target.value)} className="w-32 bg-[#111] border border-[#333] rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-white float-right" />
                        </td>
                        <td className="p-4 text-green-500 text-xs tracking-widest uppercase font-bold">
                          All Vehicles
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-400 p-1" title="Save"><Check size={16} /></button>
                            <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-400 p-1" title="Cancel"><X size={16} /></button>
                          </div>
                          {editError && <div className="text-[10px] text-red-500 mt-1 absolute">{editError}</div>}
                        </td>
                      </tr>
                    );
                  }

                  const hasPricing = item.amountToPay !== null;

                  return (
                    <tr key={item.id} className="hover:bg-[#1a1a1a] transition-colors group">
                      <td className="p-4 font-medium capitalize">
                        {item.name}
                        {!hasPricing && <span className="ml-2 text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Needs Config</span>}
                      </td>
                      <td className="p-4 text-right font-bold text-white">
                        {hasPricing ? formatCurrency(item.amountToPay) : '-'}
                      </td>
                      <td className="p-4 text-gray-500 text-xs tracking-widest uppercase">
                        All Vehicles
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => startEdit(item)}
                            className="text-gray-400 hover:text-white p-1"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleRemove(item.id)}
                            className="text-red-500 hover:text-red-400 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
