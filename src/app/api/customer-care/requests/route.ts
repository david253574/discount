import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendCustomerCarePushNotification } from '@/lib/notifications'

import { sendCustomerCareNotification } from '@/lib/whatsapp'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.modelId || !data.variantId) {
      return NextResponse.json({ error: 'Missing vehicle details' }, { status: 400 })
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
      name: data.name || 'Customer',
      address: data.address || 'N/A',
      city: data.city || 'N/A',
      zip: data.zip || 'N/A',
      paymentType: 'CUSTOMER_CARE',
      status: 'PENDING'
    }
    
    let paymentIdForAudit = '';
    const order = await prisma.$transaction(async (tx) => {
      let actualFinalAmt = finalAmount;
      if (actualFinalAmt === null) {
        const v = await tx.variant.findUnique({ where: { id: data.variantId } })
        actualFinalAmt = v ? v.price : 0;
      }
      
      orderData.finalAmount = actualFinalAmt;
      orderData.discountAmount = discountAmount;
      
      const createdOrder = await tx.order.create({ data: orderData })
      
      const btcAddress = process.env.BTC_ADDRESS || 'bc1qtest1234567890abcdefghijklmnopqrstuvwx';
      const createdPayment = await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          method: 'CUSTOMER_CARE',
          amountDue: actualFinalAmt,
          btcAddress: btcAddress,
          status: 'PENDING'
        }
      })
      paymentIdForAudit = createdPayment.id;
      
      await tx.conversation.create({
        data: {
          orderId: createdOrder.id,
          status: 'OPEN'
        }
      })
      
      return createdOrder;
    });

    // Fire WhatsApp notification asynchronously (fire and forget)
    // We don't await it to block the response, but we process it in background.
    // Actually, in serverless environments, fire-and-forget might be killed.
    // It's safer to await it so the function doesn't exit before fetch completes.
    try {
      const variantInfo = await prisma.variant.findUnique({ 
        where: { id: data.variantId },
        include: { model: true }
      });
      
      const vName = variantInfo ? `${variantInfo.model.name} - ${variantInfo.name}` : 'Unknown Vehicle';
      
      const waResult = await sendCustomerCareNotification({
        orderId: order.id,
        customerName: order.name,
        vehicleName: vName,
        amountDue: order.finalAmount || 0
      });
      
      await prisma.paymentAuditLog.create({
        data: {
          paymentId: paymentIdForAudit,
          action: waResult.success ? 'WHATSAPP_NOTIFICATION_SENT' : 'WHATSAPP_NOTIFICATION_FAILED',
          reason: waResult.reason || waResult.messageId || null
        }
      });
    } catch (waError) {
      console.error('Failed to send WhatsApp notification', waError);
      await prisma.paymentAuditLog.create({
        data: {
          paymentId: paymentIdForAudit,
          action: 'WHATSAPP_NOTIFICATION_FAILED',
          reason: 'Internal exception during notification'
        }
      }).catch(() => {});
    }

    
    // Send FCM notification (non-blocking)
    const variantInfo = await prisma.variant.findUnique({ where: { id: data.variantId }, include: { model: true } });
    const vehicleName = variantInfo ? `${variantInfo.model.name} ${variantInfo.name}` : 'Vehicle';
    
    sendCustomerCarePushNotification({
      orderId: order.id,
      name: orderData.name,
      vehicleName: vehicleName,
      amount: orderData.finalAmount,
    }).catch(e => console.error("Non-blocking notification error", e));

    return NextResponse.json({ success: true, order })

  } catch (error) {
    console.error('Customer care request error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
