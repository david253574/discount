import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession() as any;
    if (!session || !session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { fcmToken, platform } = await request.json();
    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token required' }, { status: 400 });
    }

    await prisma.deviceToken.upsert({
      where: { token: fcmToken },
      update: { userId: session.id, platform: platform || 'android' },
      create: {
        userId: session.id,
        token: fcmToken,
        platform: platform || 'android'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('FCM Token Registration Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
