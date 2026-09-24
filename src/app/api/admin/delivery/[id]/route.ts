import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const staff = await prisma.user.findUnique({ where: { id: session.id as string } });
  if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'CUSTOMER_CARE')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const order = await prisma.order.findUnique({
    where: { id: unwrappedParams.id },
    include: { payment: true, model: true, variant: true, documents: true }
  })
  
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(order);
}
