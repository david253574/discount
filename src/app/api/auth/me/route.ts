import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id as string },
    select: { id: true, email: true, role: true }
  })

  if (!user) {
    return NextResponse.json({ user: null })
  }

  // Fetch counts and dynamic state
  const pendingOrders = await prisma.order.count({
    where: { userId: user.id, status: 'PENDING' }
  })
  
  const unreadMessages = await prisma.message.count({
    where: { 
      conversation: { order: { userId: user.id } }, 
      sender: 'CUSTOMER_CARE', 
      readAt: null 
    }
  })

  return NextResponse.json({ 
    user, 
    stats: {
      pendingOrders,
      unreadMessages
    }
  })
}
