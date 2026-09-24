"use client";
import AppLayout from "@/components/Layout";
import Link from 'next/link';

export default function SupportPage() {
  return (
    <AppLayout title="CUSTOMER SUPPORT">
      <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-2xl font-bold mb-4 tracking-widest">CUSTOMER CARE</h1>
        <p className="text-gray-400 mb-8 max-w-md text-sm">
          Secure chat is tied directly to your active vehicle orders. Please select an order to communicate with your dedicated Customer Care representative.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/orders" className="bg-white text-black font-bold tracking-widest text-xs px-8 py-3 hover:bg-gray-200 transition-colors">
            GO TO ORDERS
          </Link>
          <a href="mailto:support@tesla.com" className="bg-[#111] border border-[#333] text-white font-bold tracking-widest text-xs px-8 py-3 hover:bg-[#222] transition-colors">
            GENERAL EMAIL
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
