import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  try {
    const { txid, message } = await request.json()
    if (!txid) return NextResponse.json({ error: 'TXID required' }, { status: 400 })

    const payment = await prisma.payment.findFirst({ where: { orderId: unwrappedParams.id } })
    if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    if (payment.status !== 'PENDING' && payment.status !== 'REJECTED') {
      return NextResponse.json({ error: 'Payment is already submitted' }, { status: 400 })
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        txid,
        message,
        status: 'UNDER_REVIEW',
        submittedAt: new Date()
      }
    })
    
    // Add audit log
    await prisma.paymentAuditLog.create({
      data: {
        paymentId: payment.id,
        action: 'SUBMITTED',
        previousStatus: payment.status,
        newStatus: 'UNDER_REVIEW',
        staffUserId: null
      }
    })

    return NextResponse.json({ success: true, payment: updated })
  } catch (error) {
    console.error('Submit payment error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
