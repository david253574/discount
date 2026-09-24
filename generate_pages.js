const fs = require('fs');
const path = require('path');

const pages = [
  'dashboard', 'deposit', 'withdraw', 'buy-crypto', 'plans', 'assets', 'orders', 'verification', 'history', 'settings', 'login'
];

pages.forEach(page => {
  const dir = path.join(__dirname, 'src', 'app', page);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  let content = `
import AppLayout from "@/components/Layout";

export default function ${page.charAt(0).toUpperCase() + page.slice(1).replace('-', '')}Page() {
  return (
    <AppLayout title="${page.toUpperCase()}">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 tracking-widest">${page.toUpperCase()}</h1>
        <div className="bg-[#111] border border-[#222] p-6 text-gray-400">
          <p>This section is currently under development or not supported by the existing architecture.</p>
        </div>
      </div>
    </AppLayout>
  );
}
`;
  
  if (page === 'login') {
    content = `
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
        window.location.href = '/dashboard';
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
`;
  }

  if (page === 'settings') {
    content = `
"use client";
import AppLayout from "@/components/Layout";

export default function SettingsPage() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <AppLayout title="SETTINGS">
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 tracking-widest">SETTINGS</h1>
        <div className="flex flex-col gap-4">
          <div className="bg-[#111] border border-[#222] p-6">
            <h2 className="text-lg font-medium mb-4">Account</h2>
            <button onClick={handleLogout} className="bg-red-900/20 text-red-500 border border-red-900/50 px-6 py-2 font-medium hover:bg-red-900/40 transition-colors tracking-widest">LOG OUT</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
`;
  }
  
  if (page === 'orders') {
    content = `
"use client";
import { useEffect, useState } from 'react';
import AppLayout from "@/components/Layout";
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) {
        window.location.href = '/login';
        return;
      }
      fetch('/api/orders').then(r => r.json()).then(res => {
        setOrders(res.orders || []);
        setLoading(false);
      });
    });
  }, []);

  return (
    <AppLayout title="SHOPPING ORDERS">
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 tracking-widest">SHOPPING ORDERS</h1>
        {loading ? (
          <div className="text-gray-500 animate-pulse">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-[#111] border border-[#222] p-8 text-center text-gray-500">No orders found.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((o: any) => (
              <Link href={\`/order/\${o.id}\`} key={o.id} className="block bg-[#111] border border-[#222] p-6 hover:border-gray-500 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm text-gray-500 tracking-wider mb-1">ORDER ID</div>
                    <div className="font-mono">{o.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 tracking-wider mb-1">STATUS</div>
                    <div className={\`font-bold \${o.status === 'PENDING' ? 'text-yellow-500' : 'text-green-500'}\`}>{o.status}</div>
                  </div>
                </div>
                <div className="text-xl font-medium">{o.model?.name} {o.variant?.name}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
`;
  }

  const filePath = path.join(dir, 'page.tsx');
  fs.writeFileSync(filePath, content);
});
console.log('Pages generated.');
