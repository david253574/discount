import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const model = await prisma.vehicleModel.findUnique({
      where: { slug: resolvedParams.slug },
      include: {
        variants: {
          where: { status: 'ACTIVE' }
        }
      }
    })
    
    if (!model) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ model })
  } catch (error) {
    console.error('Fetch model error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
