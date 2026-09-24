import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const credentials = await prisma.discountCredential.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ passes: credentials })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name } = await request.json()
    if (!name) return NextResponse.json({ error: 'Missing recipient name' }, { status: 400 })

    // Verify eligibility
    const normalizedName = name.trim().toLowerCase();
    
    // Fallback case-insensitive check if SQLite doesn't do it perfectly
    const allEligible = await prisma.discountEligibility.findMany()
    const eligiblePerson = allEligible.find(e => e.name.toLowerCase() === normalizedName)

    if (!eligiblePerson) {
      return NextResponse.json({ error: 'Recipient is not eligible' }, { status: 400 })
    }

    if (eligiblePerson.amountToPay === null) {
      return NextResponse.json({ error: 'Recipient requires pricing configuration before a PIN can be generated' }, { status: 400 })
    }

    const matchedName = eligiblePerson.name

    // Generate PIN (cryptographically random 6 digits)
    const rawPin = Math.floor(100000 + Math.random() * 900000).toString()
    const pinHash = await bcrypt.hash(rawPin, 10)
    
    const reference = 'PASS-' + Math.random().toString(36).substring(2, 10).toUpperCase()

    const credential = await prisma.discountCredential.create({
      data: {
        recipientName: matchedName,
        pinHash,
        reference
      }
    })

    return NextResponse.json({ pass: credential, rawPin })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
