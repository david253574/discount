export const dynamic = "force-dynamic";


import { prisma } from "@/lib/prisma"

export default async function AdminDashboard() {
  const [userCount, orderCount, modelCount, recentOrders] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.vehicleModel.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { model: true, variant: true }
    })
  ])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-wider mb-2">DASHBOARD</h1>
        <p className="text-gray-400 text-sm">Overview of your Tesla application data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111111] p-6 rounded-2xl border border-[#222]">
          <h3 className="text-[11px] text-gray-500 font-semibold tracking-wider mb-2">TOTAL ORDERS</h3>
          <div className="text-4xl font-bold">{orderCount}</div>
        </div>
        <div className="bg-[#111111] p-6 rounded-2xl border border-[#222]">
          <h3 className="text-[11px] text-gray-500 font-semibold tracking-wider mb-2">VEHICLE MODELS</h3>
          <div className="text-4xl font-bold">{modelCount}</div>
        </div>
        <div className="bg-[#111111] p-6 rounded-2xl border border-[#222]">
          <h3 className="text-[11px] text-gray-500 font-semibold tracking-wider mb-2">TOTAL USERS</h3>
          <div className="text-4xl font-bold">{userCount}</div>
        </div>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#222] overflow-hidden">
        <div className="p-6 border-b border-[#222]">
          <h2 className="text-sm font-semibold tracking-wider">RECENT ORDERS</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a1a1a] text-gray-400 text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">CUSTOMER</th>
                <th className="p-4">MODEL</th>
                <th className="p-4">PAYMENT</th>
                <th className="p-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No orders yet.</td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4 font-mono text-xs">{order.id.slice(-6)}</td>
                    <td className="p-4">{order.name}</td>
                    <td className="p-4">
                      {order.model.name} <span className="text-gray-500 text-xs">({order.variant.name})</span>
                    </td>
                    <td className="p-4">{order.paymentType} {order.crypto ? `(${order.crypto})` : ''}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded-md ${
                        order.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                        order.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                        order.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {order.status}
                      </span>
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
