export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  try {
    const payment = await prisma.payment.findFirst({
      where: { orderId: unwrappedParams.id },
      include: {
        order: {
          include: { model: true, variant: true }
        }
      }
    })

    if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const conversation = await prisma.conversation.findUnique({
      where: { orderId: unwrappedParams.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json({ payment, conversation })
  } catch (error) {
    console.error('Fetch payment error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
