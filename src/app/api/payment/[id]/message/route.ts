import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  try {
    const { body, sender } = await request.json()
    if (!body) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    const conversation = await prisma.conversation.findUnique({ where: { orderId: unwrappedParams.id } })
    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const msg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        body,
        sender: sender || 'CUSTOMER'
      }
    })

    return NextResponse.json({ success: true, message: msg })
  } catch (error) {
    console.error('Send message error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
