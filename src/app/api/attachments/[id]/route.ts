import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession() as any;

  const { id } = await context.params;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: {
      message: {
        include: {
          conversation: {
            include: {
              order: true
            }
          }
        }
      }
    }
  });

  if (!attachment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isStaff = session && (session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE');
  const orderUserId = attachment.message.conversation.order.userId;

  let authorized = false;
  if (!orderUserId) {
    authorized = true; // Guest order
  } else if (isStaff) {
    authorized = true;
  } else if (session && session.id === orderUserId) {
    authorized = true;
  }

  if (!authorized) {
    if (!session || !session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rawUrl = attachment.url;

  // Local filesystem fallback
  if (process.env.NODE_ENV === 'development' && rawUrl.startsWith('/uploads/')) {
    const filename = rawUrl.replace('/uploads/', '');
    const filepath = path.join(process.cwd(), 'public', 'uploads', filename);
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }
    const buffer = fs.readFileSync(filepath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Length': attachment.size.toString(),
        'Content-Disposition': `inline; filename="${attachment.filename}"`,
        'Cache-Control': 'private, max-age=3600'
      }
    });
  }

  // Vercel Blob Fetch
  try {
    const response = await fetch(rawUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch blob from Vercel' }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Length': attachment.size.toString(),
        'Content-Disposition': `inline; filename="${attachment.filename}"`,
        'Cache-Control': 'private, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Attachment Proxy Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
