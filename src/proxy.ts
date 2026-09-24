import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  const isAdminRoute = path.startsWith('/admin') && !path.startsWith('/admin/login')
  const isAdminApiRoute = path.startsWith('/api/admin')

  if (isAdminRoute || isAdminApiRoute) {
    const session = await getUserFromRequest(request)

    if (!session || session.role !== 'ADMIN') {
      if (isAdminApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
