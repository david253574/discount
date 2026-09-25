import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET() {
  const a = await prisma.attachment.findFirst({ include: { message: { include: { conversation: { include: { order: true } } } } } });
  if (!a) return NextResponse.json({ error: 'No attachments found' });

  const userId = a.message.conversation.order.userId;
  const token = jwt.sign({ id: userId, email: 'test@example.com', role: 'USER' }, process.env.JWT_SECRET!);

  const response = await fetch(`http://localhost:3000/api/attachments/${a.id}`, {
    headers: {
      Cookie: `session=${token}`
    }
  });

  return NextResponse.json({ status: response.status, ok: response.ok, userId, attachmentId: a.id });
}
