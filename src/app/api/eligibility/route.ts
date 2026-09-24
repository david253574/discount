import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const list = await prisma.discountEligibility.findMany({
      orderBy: { name: 'asc' },
      select: { name: true }
    })
    return NextResponse.json({ list })
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
