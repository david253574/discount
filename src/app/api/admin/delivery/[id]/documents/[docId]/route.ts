import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string, docId: string }> }) {
  const unwrappedParams = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const staff = await prisma.user.findUnique({ where: { id: session.id as string } });
  if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'CUSTOMER_CARE')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { status } = await request.json();
  
  const doc = await prisma.document.update({
    where: { id: unwrappedParams.docId },
    data: { status }
  });

  // Check if we need to update readiness
  const order = await prisma.order.findUnique({ where: { id: unwrappedParams.id }, include: { payment: true, documents: true } });
  if (order) {
    const buyerComplete = order.name && order.address && order.city && order.zip && order.phone && order.country;
    const deliveryComplete = order.deliveryAddress && order.deliveryPhone;
    const docsComplete = order.documents.every((d: any) => d.status === 'READY' || d.status === 'APPROVED' || d.status === 'UPLOADED' || d.status === 'NOT_APPLICABLE');
    
    let newStatus = 'PREPARING';
    if (buyerComplete && deliveryComplete && docsComplete) {
      newStatus = 'READY';
    }
    await prisma.order.update({
      where: { id: unwrappedParams.id },
      data: { deliveryStatus: newStatus }
    });
  }

  return NextResponse.json({ success: true, doc });
}
