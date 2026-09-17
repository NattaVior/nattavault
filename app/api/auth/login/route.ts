import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { loginSchema } from '@/lib/security';
import { rateLimit, requireSameOrigin } from '@/lib/request-security';

export async function POST(req: Request) {
  const originError = requireSameOrigin(req); if (originError) return originError;
  const limited = rateLimit(req, 'login'); if (limited) return limited;
  try {
    const body = loginSchema.parse(await req.json()); const user = await db.user.findUnique({ where: { email: body.email } });
    if (!user || !user.active || user.role !== 'ADMIN' || !(await bcrypt.compare(body.password, user.passwordHash))) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    cookies().set('nv_session', await createSession(user.id), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800, path: '/' });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
}
