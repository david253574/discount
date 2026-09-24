import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    await prisma.discountEligibility.delete({
      where: { id: resolvedParams.id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { name, amountToPay } = await request.json();
    
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const parsedAmountToPay = parseFloat(amountToPay);

    if (isNaN(parsedAmountToPay) || parsedAmountToPay < 0) {
      return NextResponse.json({ error: 'Amount to pay must be a positive number' }, { status: 400 });
    }

    const updated = await prisma.discountEligibility.update({
      where: { id: resolvedParams.id },
      data: {
        name: name.trim().toLowerCase(),
        amountToPay: parsedAmountToPay
      }
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
