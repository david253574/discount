import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { prisma } from './prisma';

// Initialize Firebase Admin if not already initialized and if config exists
if (getApps().length === 0) {
  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      console.warn('Firebase Admin is not configured. Push notifications will be mocked.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export async function sendCustomerCarePushNotification(requestData: {
  orderId: string;
  name: string;
  vehicleName: string;
  amount: number;
}) {
  try {
    // Get all admin users (Customer Care staff)
    const staffMembers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      include: { deviceTokens: true }
    });

    const tokens: string[] = [];
    staffMembers.forEach(staff => {
      staff.deviceTokens.forEach(dt => tokens.push(dt.token));
    });

    if (tokens.length === 0) {
      console.log('No registered Customer Care devices to notify.');
      return;
    }

    const payload = {
      notification: {
        title: 'New Customer Care Request',
        body: `${requestData.name} needs payment assistance.\n${requestData.vehicleName} • $${requestData.amount.toLocaleString()}`,
      },
      data: {
        type: 'CUSTOMER_CARE_REQUEST',
        orderId: requestData.orderId,
      },
      tokens: tokens,
    };

    if (getApps().length > 0) {
      const response = await getMessaging().sendEachForMulticast(payload);
      console.log(`FCM Notifications sent: ${response.successCount} successful, ${response.failureCount} failed.`);
      
      // Optionally remove invalid tokens
      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success && (resp.error?.code === 'messaging/invalid-registration-token' || resp.error?.code === 'messaging/registration-token-not-registered')) {
            prisma.deviceToken.delete({ where: { token: tokens[idx] } }).catch(e => console.error(e));
          }
        });
      }
    } else {
      console.log('[MOCK FCM] Would have sent notification:', payload);
    }
  } catch (error) {
    console.error('Failed to send Customer Care push notification:', error);
  }
}

export async function sendNewMessagePushNotification(orderId: string, sender: string, text: string) {
  try {
    const staffMembers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'CUSTOMER_CARE'] } },
      include: { deviceTokens: true }
    });

    const tokens: string[] = [];
    staffMembers.forEach(staff => {
      staff.deviceTokens.forEach(dt => tokens.push(dt.token));
    });

    if (tokens.length === 0) return;

    const payload = {
      notification: {
        title: 'New Message',
        body: `You have a new message from a customer.`,
      },
      data: {
        type: 'NEW_MESSAGE',
        orderId,
      },
      tokens: tokens,
    };

    if (getApps().length > 0) {
      await getMessaging().sendEachForMulticast(payload);
    } else {
      console.log('[MOCK FCM] Would have sent new message notification:', payload);
    }
  } catch (error) {
    console.error('Failed to send new message push notification:', error);
  }
}
