export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma"

export default async function AdminModelsPage() {
  const models = await prisma.vehicleModel.findMany({
    orderBy: { createdAt: 'desc' },
    include: { variants: true }
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-wider mb-2">MODELS</h1>
          <p className="text-gray-400 text-sm">Manage vehicle models and variants.</p>
        </div>
        <button className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold tracking-wider hover:bg-gray-200 transition-colors">
          + ADD MODEL
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {models.map(model => (
          <div key={model.id} className="bg-[#111111] border border-[#222] rounded-2xl overflow-hidden flex flex-col">
            <div className="h-48 relative">
              <img src={model.image} alt={model.name} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4">
                 <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded-md ${
                   model.status === 'ACTIVE' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                 }`}>
                   {model.status}
                 </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-wider mb-1">{model.name}</h2>
                  <p className="text-gray-400 text-xs">{model.subtitle}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs bg-[#222] hover:bg-[#333] px-3 py-1.5 rounded transition-colors text-white font-semibold">EDIT</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="bg-black border border-[#222] p-3 rounded-xl">
                  <div className="text-xs text-gray-500 font-semibold mb-1">RANGE</div>
                  <div className="font-bold">{model.range}</div>
                </div>
                <div className="bg-black border border-[#222] p-3 rounded-xl">
                  <div className="text-xs text-gray-500 font-semibold mb-1">ACCEL</div>
                  <div className="font-bold">{model.acceleration}</div>
                </div>
                <div className="bg-black border border-[#222] p-3 rounded-xl">
                  <div className="text-xs text-gray-500 font-semibold mb-1">SPEED</div>
                  <div className="font-bold">{model.speed}</div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] text-gray-500 font-bold tracking-wider mb-3">VARIANTS ({model.variants.length})</h3>
                <div className="flex flex-col gap-2">
                  {model.variants.map(variant => (
                    <div key={variant.id} className="bg-black border border-[#222] p-3 rounded-xl flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{variant.name}</span>
                        {variant.popular && <span className="bg-blue-500/20 text-blue-500 text-[9px] px-1.5 py-0.5 rounded font-bold">POPULAR</span>}
                      </div>
                      <div className="font-mono text-gray-400">${variant.price.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
