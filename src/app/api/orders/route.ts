import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validate basic requirements
    if (!data.modelId || !data.variantId || !data.name || !data.address || !data.city || !data.zip || !data.paymentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let finalAmount = null;
    let discountAmount = null;

    if (data.discountReference) {
      const pass = await prisma.discountCredential.findUnique({
        where: { reference: data.discountReference }
      });
      if (!pass || pass.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Invalid or redeemed discount credential' }, { status: 400 })
      }
      if (pass.recipientName.toLowerCase() !== data.name.trim().toLowerCase()) {
        return NextResponse.json({ error: 'Discount pass name does not match order name' }, { status: 400 })
      }

      // Fetch pricing config
      const allEligible = await prisma.discountEligibility.findMany()
      const person = allEligible.find(e => e.name.toLowerCase() === pass.recipientName.toLowerCase())

      if (person && person.amountToPay !== null) {
        const variant = await prisma.variant.findUnique({ where: { id: data.variantId } })
        if (variant) {
          if (person.amountToPay > variant.price) {
            return NextResponse.json({ error: 'Authorized amount exceeds vehicle price' }, { status: 400 })
          }
          finalAmount = person.amountToPay;
          discountAmount = variant.price - finalAmount;
        }
      }
      
      // Mark as redeemed
      await prisma.discountCredential.update({
        where: { reference: data.discountReference },
        data: { status: 'REDEEMED', redeemedAt: new Date() }
      })
    }

    let orderData: any = {
      modelId: data.modelId,
      variantId: data.variantId,
      name: data.name,
      address: data.address,
      city: data.city,
      zip: data.zip,
      paymentType: data.paymentType,
      crypto: data.crypto,
      receiptUrl: data.receiptUrl,
      finalAmount,
      discountAmount,
      status: 'PENDING'
    }
    
    // Create order and relations in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Calculate actual final amount ensuring server acts as source of truth
      let actualFinalAmt = finalAmount;
      if (actualFinalAmt === null) {
        const v = await tx.variant.findUnique({ where: { id: data.variantId } })
        actualFinalAmt = v ? v.price : 0;
      }
      
      // Enforce that only the server's finalAmount is saved
      orderData.finalAmount = actualFinalAmt;
      
      const createdOrder = await tx.order.create({ data: orderData })
      
      if (data.paymentType === 'BITCOIN' || data.paymentType === 'CUSTOMER_CARE') {
        const btcAddress = process.env.BTC_ADDRESS || 'bc1qtest1234567890abcdefghijklmnopqrstuvwx';
        
        await tx.payment.create({
          data: {
            orderId: createdOrder.id,
            method: data.paymentType, // 'BITCOIN' or 'CUSTOMER_CARE'
            amountDue: actualFinalAmt,
            btcAddress: btcAddress,
            status: 'PENDING'
          }
        })
        
        // Create Conversation
        await tx.conversation.create({
          data: {
            orderId: createdOrder.id,
            status: 'OPEN'
          }
        })
      }
      return createdOrder;
    });

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Create order error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.id as string },
      include: {
        model: true,
        variant: true,
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch orders error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
