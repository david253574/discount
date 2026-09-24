
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
