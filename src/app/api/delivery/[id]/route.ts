import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CORE_DOCS = [
  'PURCHASE_AGREEMENT',
  'FINAL_INVOICE',
  'PAYMENT_RECEIPT',
  'VEHICLE_ORDER_SUMMARY',
  'DELIVERY_HANDOVER',
  'REGISTRATION_DOCUMENT',
  'INSURANCE'
];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  try {
    const order = await prisma.order.findUnique({
      where: { id: unwrappedParams.id },
      include: {
        payment: true,
        model: true,
        variant: true,
        documents: true
      }
    })

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Only allow delivery logic if payment is confirmed
    if (order.payment?.status !== 'CONFIRMED') {
       return NextResponse.json({ error: 'Payment not confirmed' }, { status: 403 })
    }

    // Auto-initialize required documents if they don't exist yet
    const existingTypes = order.documents.map((d: any) => d.type);
    const missingDocs = CORE_DOCS.filter(t => !existingTypes.includes(t));
    
    if (missingDocs.length > 0) {
      for (const docType of missingDocs) {
        let status = 'READY'; // Most generated ones are ready immediately
        if (docType === 'REGISTRATION_DOCUMENT' || docType === 'INSURANCE') status = 'REQUIRED';
        
        await prisma.document.create({
          data: {
            orderId: order.id,
            type: docType,
            status: status
          }
        });
      }
      
      // Refetch with new documents
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { payment: true, model: true, variant: true, documents: true }
      })
      return NextResponse.json(updatedOrder)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Delivery fetch error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  try {
    const data = await request.json()
    const { action, payload } = data

    const order = await prisma.order.findUnique({ where: { id: unwrappedParams.id }, include: { payment: true, documents: true } })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (action === 'BUYER_INFO') {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          phone: payload.phone,
          country: payload.country,
          address: payload.address,
          city: payload.city,
          zip: payload.zip
        }
      })
      // calculate readiness
      await updateReadiness(order.id);
      return NextResponse.json({ success: true, order: updated })
    } 
    else if (action === 'DELIVERY_INFO') {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          deliveryAddress: payload.deliveryAddress,
          deliveryPhone: payload.deliveryPhone,
          deliveryDatePref: payload.deliveryDatePref,
          deliveryInstructions: payload.deliveryInstructions
        }
      })
      await updateReadiness(order.id);
      return NextResponse.json({ success: true, order: updated })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Delivery patch error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateReadiness(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true, documents: true } })
  if (!order) return;
  
  const buyerComplete = order.name && order.address && order.city && order.zip && order.phone && order.country;
  const deliveryComplete = order.deliveryAddress && order.deliveryPhone;
  const docsComplete = order.documents.every((d: any) => d.status === 'READY' || d.status === 'APPROVED' || d.status === 'UPLOADED' || d.status === 'NOT_APPLICABLE');
  
  let newStatus = 'PREPARING';
  if (buyerComplete && deliveryComplete && docsComplete) {
    newStatus = 'READY';
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { deliveryStatus: newStatus }
  })
}
