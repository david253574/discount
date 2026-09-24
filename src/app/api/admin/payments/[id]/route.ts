import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify role
    const staffUser = await prisma.user.findUnique({ where: { id: session.id as string } });
    if (!staffUser || (staffUser.role !== 'ADMIN' && staffUser.role !== 'CUSTOMER_CARE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status, reason, isManualConfirmation, internalNote } = await request.json()
    if (!status || !['CONFIRMED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({ where: { id: unwrappedParams.id } })
    if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Idempotency / Double confirmation prevention
    if (status === 'CONFIRMED' && payment.status === 'CONFIRMED') {
      return NextResponse.json({ error: 'PAYMENT_ALREADY_CONFIRMED' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status,
          rejectionReason: status === 'REJECTED' ? reason : null,
          confirmedAt: status === 'CONFIRMED' ? new Date() : null,
          confirmedBy: status === 'CONFIRMED' ? staffUser.id : null
        }
      })
      
      if (status === 'CONFIRMED') {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'APPROVED' }
        })
      }
      
      const actionValue = (isManualConfirmation && status === 'CONFIRMED') 
                            ? 'MANUAL_PAYMENT_CONFIRMED' 
                            : status;

      await tx.paymentAuditLog.create({
        data: {
          paymentId: payment.id,
          action: actionValue,
          previousStatus: payment.status,
          newStatus: status,
          reason: internalNote || reason || null,
          staffUserId: staffUser.id
        }
      })
      return p;
    })

    return NextResponse.json({ success: true, payment: updated })
  } catch (error) {
    console.error('Update payment error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
