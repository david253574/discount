export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  try {
    const session = await getSession() as any;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payment = await prisma.payment.findFirst({
      where: { orderId: unwrappedParams.id },
      include: {
        order: {
          include: { model: true, variant: true }
        }
      }
    })

    if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isStaff = session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE';
    if (!isStaff && payment.order.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { orderId: unwrappedParams.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true }
        }
      }
    })

    if (conversation) {
      conversation.messages = conversation.messages.map(msg => ({
        ...msg,
        attachments: msg.attachments.map(a => ({
          ...a,
          url: `/api/attachments/${a.id}`
        }))
      })) as any;
    }

    return NextResponse.json({ payment, conversation })
  } catch (error) {
    console.error('Fetch payment error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
