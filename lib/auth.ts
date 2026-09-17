import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'development-only-secret-change-me');

export async function createSession(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('nv_session')?.value;
  if (!token) return null;

  try {
    const payload = await jwtVerify(token, secret);
    return payload.payload as { userId: string };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');
  return session.userId;
}
