import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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
