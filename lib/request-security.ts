import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const buckets = new Map<string, { count: number; resetAt: number }>();
const LIMITS: Record<string, { limit: number; windowMs: number }> = {
  login: { limit: 10, windowMs: 15 * 60_000 }, upload: { limit: 30, windowMs: 60 * 60_000 }, share: { limit: 60, windowMs: 5 * 60_000 }, signed: { limit: 120, windowMs: 5 * 60_000 },
};

export function requestIp(req: Request | NextRequest) { return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'; }
export function rateLimit(req: Request | NextRequest, category: keyof typeof LIMITS) {
  const config = LIMITS[category]; const key = `${category}:${requestIp(req)}`; const now = Date.now(); const current = buckets.get(key);
  if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + config.windowMs }); return null; }
  current.count += 1;
  if (current.count > config.limit) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  return null;
}

export function requireSameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  const site = process.env.PUBLIC_SITE_URL;
  if (!origin || !site) return null;
  try { if (new URL(origin).origin !== new URL(site).origin) return NextResponse.json({ error: 'Cross-origin request blocked.' }, { status: 403 }); } catch { return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 }); }
  return null;
}
