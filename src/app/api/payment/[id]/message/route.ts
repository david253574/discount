import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  try {
    const { body, sender, attachments } = await request.json()
    // Either body or attachments are required
    if (!body && (!attachments || attachments.length === 0)) {
        return NextResponse.json({ error: 'Message or attachment required' }, { status: 400 })
    }

    const session = await getSession() as any;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const isStaff = session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE';
    
    const conversation = await prisma.conversation.findUnique({ 
      where: { orderId: unwrappedParams.id },
      include: { order: true }
    })
    
    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!isStaff && conversation.order.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let actualSender = 'CUSTOMER';
    if (session.role === 'ADMIN') actualSender = 'ADMIN';
    else if (session.role === 'CUSTOMER_CARE') actualSender = 'CUSTOMER_CARE';

    const msg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        body: body || '',
        sender: actualSender,
        senderUserId: session.id,
        attachments: attachments ? {
            create: attachments.map((a: any) => ({
                filename: a.filename,
                mimeType: a.mimeType,
                size: a.size,
                url: a.url
            }))
        } : undefined
      },
      include: { attachments: true }
    })

    if (!isStaff) {
      const { sendNewMessagePushNotification } = await import('@/lib/notifications');
      await sendNewMessagePushNotification(unwrappedParams.id, actualSender, body || 'Attachment');
    }

    // Publish a minimal routing-hint event to Ably AFTER the DB commit.
    // Payload contains only navigation identifiers — no message body, no
    // attachment URLs, no Blob tokens, no session data.
    // Clients must call GET /api/payment/[orderId] for authoritative data.
    // Ably failure is non-fatal: the message is already in Turso.
    {
      const { publishMessageCreated } = await import('@/lib/ably');
      await publishMessageCreated(unwrappedParams.id, msg.id);
    }

    return NextResponse.json({ 
      success: true, 
      message: {
        ...msg,
        attachments: msg.attachments.map((a: any) => ({
          ...a,
          url: `/api/attachments/${a.id}`
        }))
      } 
    })
  } catch (error) {
    console.error('Send message error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
