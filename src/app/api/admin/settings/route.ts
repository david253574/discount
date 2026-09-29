import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.setting.findMany()
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
    return NextResponse.json({ settings: map })
  } catch (error) {
    console.error('Settings GET error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || typeof value !== 'string') {
      return NextResponse.json({ error: 'key and value are required' }, { status: 400 })
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: {
        id: `setting_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        key,
        value,
      },
    })

    return NextResponse.json({ success: true, setting })
  } catch (error) {
    console.error('Settings PATCH error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
