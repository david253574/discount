import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'CUSTOMER_CARE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        order: { include: { payment: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    return NextResponse.json({ conversations })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
