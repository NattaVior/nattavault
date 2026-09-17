import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { rateLimit } from '@/lib/request-security';
import { ACTIVE_CONTENT_MIMES } from '@/lib/security';
import { storage } from '@/lib/storage';
import { getSession } from '@/lib/auth';
export async function GET(req: Request, { params }: { params: { id: string } }) { const limited = rateLimit(req, 'signed'); if (limited) return limited; const file = await db.file.findFirst({ where: { id: params.id, deletedAt: null } }); if (!file) return new NextResponse('Not found', { status: 404 }); if (file.visibility === 'PRIVATE' && !(await getSession())?.userId) return new NextResponse('Not found', { status: 404 }); return NextResponse.redirect(await storage.createSignedUrl(file.storageKey, ACTIVE_CONTENT_MIMES.has(file.mimeType.toLowerCase()), ACTIVE_CONTENT_MIMES.has(file.mimeType.toLowerCase()) ? 'application/octet-stream' : file.mimeType)); }
