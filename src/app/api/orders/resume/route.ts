import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Lightweight endpoint called on order page mount.
 * If the discount reference has already been redeemed and has a linked orderId,
 * returns that order so the client can redirect straight to the payment page.
 * Returns 204 (no content) if there is nothing to resume.
 */
export async function POST(request: Request) {
  try {
    const { discountReference } = await request.json()

    if (!discountReference) {
      return new NextResponse(null, { status: 204 })
    }

    const pass = await prisma.discountCredential.findUnique({
      where: { reference: discountReference }
    })

    if (!pass || pass.status !== 'REDEEMED' || !pass.redeemedOrderId) {
      return new NextResponse(null, { status: 204 })
    }

    const order = await prisma.order.findUnique({
      where: { id: pass.redeemedOrderId }
    })

    if (!order) {
      return new NextResponse(null, { status: 204 })
    }

    return NextResponse.json({ order, resumed: true })
  } catch (error) {
    console.error('Resume check error', error)
    return new NextResponse(null, { status: 204 })
  }
}
