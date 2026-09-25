/* eslint-disable @typescript-eslint/no-explicit-any */
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const secretKey = process.env.JWT_SECRET || 'super-secret-key-for-development'
const key = new TextEncoder().encode(secretKey)

export async function sign(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function verify(input: string) {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
      clockTolerance: 120,
    })
    return payload
  } catch (_error) {
    console.error("JWT verify error:", _error);
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  return await verify(session)
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function getUserFromRequest(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  if (!session) return null
  return await verify(session)
}
