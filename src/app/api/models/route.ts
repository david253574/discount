import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const models = await prisma.vehicleModel.findMany({
      where: { status: 'ACTIVE' },
      include: {
        variants: {
          where: { status: 'ACTIVE' }
        }
      }
    })
    
    return NextResponse.json({ models })
  } catch (error) {
    console.error('Fetch models error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
