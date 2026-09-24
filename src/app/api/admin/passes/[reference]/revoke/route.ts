import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const user = await getSession()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reference } = await params

    const credential = await prisma.discountCredential.update({
      where: { reference },
      data: { status: 'REVOKED' }
    })

    return NextResponse.json({ success: true, credential })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
