import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    if (!decoded || !decoded.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { fcmToken, platform } = await request.json();
    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token required' }, { status: 400 });
    }

    // Upsert token
    await prisma.deviceToken.upsert({
      where: { token: fcmToken },
      update: { userId: decoded.userId, platform: platform || 'android' },
      create: {
        userId: decoded.userId,
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
