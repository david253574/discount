import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tesla.com' },
    update: {},
    create: {
      email: 'admin@tesla.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  console.log({ admin })

  const model3 = await prisma.vehicleModel.upsert({
    where: { slug: 'model-3' },
    update: {},
    create: {
      slug: 'model-3',
      name: 'Model 3',
      subtitle: 'Everyday usability.',
      image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop',
      range: '272 mi',
      speed: '140 mph',
      acceleration: '5.8 s',
      price: 36990,
      variants: {
        create: [
          { slug: 'standard', name: 'Model 3 Standard', range: '272 mi', acceleration: '5.8 s', speed: '140 mph', price: 36990 },
          { slug: 'long-range', name: 'Model 3 Long Range', range: '333 mi', acceleration: '4.2 s', speed: '145 mph', price: 46990, popular: true },
          { slug: 'performance', name: 'Model 3 Performance', range: '315 mi', acceleration: '3.1 s', speed: '162 mph', price: 53990 },
        ]
      }
    },
  })

  const modelY = await prisma.vehicleModel.upsert({
    where: { slug: 'model-y' },
    update: {},
    create: {
      slug: 'model-y',
      name: 'Model Y',
      subtitle: 'Versatile and capable.',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop',
      range: '260 mi',
      speed: '135 mph',
      acceleration: '6.6 s',
      price: 39990,
      variants: {
        create: [
          { slug: 'standard', name: 'Model Y Standard', range: '260 mi', acceleration: '6.6 s', speed: '135 mph', price: 39990 },
          { slug: 'long-range', name: 'Model Y Long Range', range: '300 mi', acceleration: '6.1 s', speed: '135 mph', price: 45990, popular: true },
          { slug: 'performance', name: 'Model Y Performance', range: '280 mi', acceleration: '5.4 s', speed: '155 mph', price: 51990 },
        ]
      }
    },
  })

  const cybertruck = await prisma.vehicleModel.upsert({
    where: { slug: 'cybertruck' },
    update: {},
    create: {
      slug: 'cybertruck',
      name: 'Cybertruck',
      subtitle: 'Built for any planet.',
      image: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Tesla_Cybertruck_unveiling.jpg',
      range: '340 mi',
      speed: '112 mph',
      acceleration: '2.6 s',
      price: 39990,
      variants: {
        create: [
          { slug: 'standard', name: 'Cybertruck Standard', range: '250 mi', acceleration: '6.5 s', speed: '112 mph', price: 39990 },
          { slug: 'long-range', name: 'Cybertruck All-Wheel Drive', range: '340 mi', acceleration: '4.1 s', speed: '112 mph', price: 79990, popular: true },
          { slug: 'performance', name: 'Cyberbeast', range: '320 mi', acceleration: '2.6 s', speed: '130 mph', price: 99990 },
        ]
      }
    },
  })

  const modelS = await prisma.vehicleModel.upsert({
    where: { slug: 'model-s' },
    update: {},
    create: {
      slug: 'model-s',
      name: 'Model S',
      subtitle: 'Dual Motor All-Wheel Drive',
      image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop', // Reusing placeholder since we don't have a specific URL, but actually let's use a Model S image URL if possible, or leave as is.
      range: '402 mi',
      speed: '130 mph',
      acceleration: '3.1 s',
      price: 74990,
      variants: {
        create: [
          { slug: 'long-range', name: 'Model S Long Range', range: '402 mi', acceleration: '3.1 s', speed: '130 mph', price: 74990, popular: true },
          { slug: 'plaid', name: 'Model S Plaid', range: '359 mi', acceleration: '1.99 s', speed: '200 mph', price: 89990 },
        ]
      }
    },
  })

  const modelX = await prisma.vehicleModel.upsert({
    where: { slug: 'model-x' },
    update: {},
    create: {
      slug: 'model-x',
      name: 'Model X',
      subtitle: 'Built for Utility and Performance',
      image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2071&auto=format&fit=crop',
      range: '335 mi',
      speed: '149 mph',
      acceleration: '3.8 s',
      price: 79990,
      variants: {
        create: [
          { slug: 'long-range', name: 'Model X Long Range', range: '335 mi', acceleration: '3.8 s', speed: '149 mph', price: 79990, popular: true },
          { slug: 'plaid', name: 'Model X Plaid', range: '326 mi', acceleration: '2.5 s', speed: '149 mph', price: 94990 },
        ]
      }
    },
  })

  console.log({ model3, modelY, cybertruck, modelS, modelX })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
