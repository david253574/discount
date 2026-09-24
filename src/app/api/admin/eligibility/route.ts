import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const list = await prisma.discountEligibility.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ list })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, amountToPay } = await request.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const parsedAmountToPay = parseFloat(amountToPay)

    if (isNaN(parsedAmountToPay) || parsedAmountToPay < 0) {
      return NextResponse.json({ error: 'Amount to pay must be a positive number' }, { status: 400 })
    }

    const normalizedName = name.trim().toLowerCase()
    
    const existing = await prisma.discountEligibility.findUnique({
      where: { name: normalizedName }
    })
    if (existing) {
      return NextResponse.json({ error: 'Name already exists' }, { status: 400 })
    }

    const added = await prisma.discountEligibility.create({
      data: { 
        name: normalizedName,
        amountToPay: parsedAmountToPay
      }
    })
    
    return NextResponse.json({ success: true, added })
  } catch (error) {
    console.error("Eligibility POST Error:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
