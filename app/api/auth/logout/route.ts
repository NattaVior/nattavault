import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireSameOrigin } from '@/lib/request-security';
export async function POST(req: Request) { const originError = requireSameOrigin(req); if (originError) return originError; cookies().delete('nv_session'); return NextResponse.redirect(new URL('/login', process.env.PUBLIC_SITE_URL || 'http://localhost:3000')); }
