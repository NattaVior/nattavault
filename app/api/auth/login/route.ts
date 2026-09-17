import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { loginSchema } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());
    const user = await db.user.findUnique({ where: { email: body.email.toLowerCase() } });

    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const cookieStore = cookies();
    cookieStore.set('nv_session', await createSession(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
