import { db } from '@/lib/db';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

function authSecret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (value) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is required in production.');
  return new TextEncoder().encode('development-only-secret-change-me');
}

export async function createSession(userId: string) {
  return new SignJWT({ userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(authSecret());
}

export async function getSession() {
  const token = cookies().get('nv_session')?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, authSecret())).payload as { userId?: string }; } catch { return null; }
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { id: true, role: true, active: true } });
  if (!user || !user.active || user.role !== 'ADMIN') throw new Error('Unauthorized');
  return user.id;
}
