import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { model: true, variant: true }
    })
    
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Fetch orders error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
