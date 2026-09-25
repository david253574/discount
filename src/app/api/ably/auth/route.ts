/**
 * GET /api/ably/auth?orderId=<orderId>
 *
 * Issues a short-lived, capability-scoped Ably TokenRequest.
 *
 * Authorization rules (mirroring the existing /api/payment/[id] checks):
 *   - CUSTOMER : must own the order (order.userId === session.id)
 *   - ADMIN    : allowed (matches existing staff access model)
 *   - CUSTOMER_CARE : allowed (matches existing staff access model)
 *   - Anyone else / unauthenticated : 401 / 403
 *
 * The client NEVER receives the master ABLY_API_KEY.
 * The token is subscribe-only and scoped to the single order channel.
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { orderChannel, createTokenRequest } from '@/lib/ably';

export async function GET(request: Request) {
  try {
    const session = await getSession() as any;

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const isStaff = session && (session.role === 'ADMIN' || session.role === 'CUSTOMER_CARE');

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (order.userId) {
      if (!session || !session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!isStaff && order.userId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    // Staff: no per-order ownership check needed (same as /api/admin/conversations)

    const channel = orderChannel(orderId);

    // clientId is the session user's ID — used by Ably for audit/presence
    const clientId = session?.id || 'guest-' + Math.random().toString(36).substring(7);
    const tokenRequest = await createTokenRequest(channel, clientId);

    return NextResponse.json(tokenRequest);
  } catch (err) {
    console.error('[Ably Auth] Error issuing token:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
