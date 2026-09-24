
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (_err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#111111] p-8 rounded-2xl border border-[#222] w-full max-w-md">
        <div className="text-2xl font-bold tracking-widest text-center mb-8">TESLA ADMIN</div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 text-xs font-semibold tracking-wider p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-[10px] text-gray-500 font-semibold tracking-wider ml-1 mb-2 block">EMAIL</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-semibold tracking-wider ml-1 mb-2 block">PASSWORD</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black border border-[#333] rounded-xl p-3 text-sm focus:outline-none focus:border-white transition-colors"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black font-bold text-xs tracking-wider py-4 rounded-xl hover:bg-gray-200 transition-colors mt-2"
          >
            {loading ? "AUTHENTICATING..." : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
}
