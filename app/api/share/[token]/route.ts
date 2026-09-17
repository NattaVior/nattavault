import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { rateLimit } from '@/lib/request-security';
import { ACTIVE_CONTENT_MIMES } from '@/lib/security';
export async function GET(req: Request, { params }: { params: { token: string } }) { const limited = rateLimit(req, 'share'); if (limited) return limited; const link = await db.shareLink.findUnique({ where: { token: params.token }, include: { file: true } }); if (!link || link.file.deletedAt || (link.expiresAt && link.expiresAt <= new Date())) return new NextResponse('This share link has expired or is unavailable.', { status: 404 }); await db.event.create({ data: { type: 'SHARE_USED', fileId: link.fileId } }); const active = ACTIVE_CONTENT_MIMES.has(link.file.mimeType.toLowerCase()); return NextResponse.redirect(await storage.createSignedUrl(link.file.storageKey, active, active ? 'application/octet-stream' : link.file.mimeType)); }
