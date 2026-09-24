"use client";
import { useEffect, useState } from 'react';
import AppLayout from "@/components/Layout";
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export default function VerificationPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (!data.user) {
        window.location.href = '/login';
        return;
      }
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  return (
    <AppLayout title="VERIFICATION">
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 tracking-widest">IDENTITY VERIFICATION</h1>
        {loading ? (
          <div className="text-gray-500 animate-pulse">Loading status...</div>
        ) : (
          <div className="bg-[#111] border border-[#222] p-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-none bg-[#222] border border-[#333] flex items-center justify-center">
                {user.role === 'ADMIN' ? (
                  <ShieldCheck size={32} className="text-green-500" />
                ) : (
                  <ShieldAlert size={32} className="text-yellow-500" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">
                  {user.role === 'ADMIN' ? 'VERIFIED ACCOUNT' : 'NOT STARTED'}
                </h2>
                <p className="text-gray-400 text-sm mb-6 max-w-lg">
                  {user.role === 'ADMIN' 
                    ? 'Your identity has been fully verified and you have full access to all features.' 
                    : 'Your account requires identity verification to proceed with large transactions and vehicle deliveries.'}
                </p>
                {user.role !== 'ADMIN' && (
                  <button className="bg-white text-black font-bold px-8 py-3 tracking-widest hover:bg-gray-200 transition-colors text-xs">
                    START VERIFICATION
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
