import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [paymentsToReview, openConversations, pendingOrders, confirmedToday] = await Promise.all([
      prisma.payment.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.conversation.count({ where: { status: 'OPEN' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ 
        where: { 
          status: 'CONFIRMED',
          confirmedAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
        }
      })
    ])
    
    return NextResponse.json({
      paymentsToReview,
      openConversations,
      pendingOrders,
      confirmedToday
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
