import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  
  try {
    const doc = await prisma.document.findUnique({
      where: { id: unwrappedParams.id },
      select: {
        id: true,
        type: true,
        status: true,
        orderId: true,
        createdAt: true
      }
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Verify doc error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
