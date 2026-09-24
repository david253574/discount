import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { name, pin } = await request.json()
    
    if (!name || !pin) {
      return NextResponse.json({ error: 'Name and PIN required' }, { status: 400 })
    }

    // Rate limiting: In production you'd use upstash/redis or similar here. 
    // We enforce name matching to reduce bcrypt overhead.
    
    // Find active credentials for this name (case-insensitive in JS)
    const allPasses = await prisma.discountCredential.findMany({
      where: { status: 'ACTIVE' }
    })
    
    const candidatePasses = allPasses.filter(p => p.recipientName.toLowerCase() === name.trim().toLowerCase())

    for (const pass of candidatePasses) {
      const isValid = await bcrypt.compare(pin, pass.pinHash)
      if (isValid) {
        // Fetch pricing
        const allEligible = await prisma.discountEligibility.findMany()
        const person = allEligible.find(e => e.name.toLowerCase() === pass.recipientName.toLowerCase())

        let pricing = null;
        if (person && person.amountToPay !== null) {
          pricing = {
            finalAmount: person.amountToPay
          }
        }

        return NextResponse.json({ 
          eligible: true, 
          reference: pass.reference,
          name: pass.recipientName,
          pricing
        })
      }
    }

    return NextResponse.json({ eligible: false })
  } catch (error) {
    console.error('Check error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
