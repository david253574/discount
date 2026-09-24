import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { status } = await request.json()

    if (!['PENDING', 'APPROVED', 'REJECTED', 'DELIVERED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: resolvedParams.id },
        data: { status }
      });
      if (status === 'APPROVED') {
        const p = await tx.payment.findFirst({ where: { orderId: resolvedParams.id } });
        if (p && p.status !== 'CONFIRMED') {
          await tx.payment.update({
            where: { id: p.id },
            data: { status: 'CONFIRMED', confirmedAt: new Date() }
          });
        }
      }
      return o;
    });

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Update order error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
