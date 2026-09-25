
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from "@/components/Layout";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || '/dashboard';
        window.location.href = redirectUrl;
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  return (
    <AppLayout title="LOGIN" showHeader={false}>
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] p-4">
        <div className="w-full max-w-md bg-[#111] p-8 border border-[#222]">
          <h1 className="text-2xl font-bold mb-6 tracking-widest text-center">TESLA ACCOUNT</h1>
          {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 mb-6 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 tracking-wider">EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#222] border border-[#333] p-3 text-white focus:outline-none focus:border-gray-500 transition-colors" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 tracking-wider">PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#222] border border-[#333] p-3 text-white focus:outline-none focus:border-gray-500 transition-colors" required />
            </div>
            <button type="submit" className="w-full bg-white text-black font-bold py-3 mt-4 hover:bg-gray-200 transition-colors tracking-widest">SIGN IN</button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
