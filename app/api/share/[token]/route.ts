import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';

export async function GET(_req: Request, { params }: { params: { token: string } }) { const link = await db.shareLink.findUnique({ where: { token: params.token }, include: { file: true } }); if (!link || link.file.deletedAt || (link.expiresAt && link.expiresAt < new Date())) return new NextResponse('This share link has expired or is unavailable.', { status: 404 }); const url = await storage.createSignedUrl(link.file.storageKey, false); await db.event.create({ data: { type: 'SHARE_USED', fileId: link.fileId } }); return NextResponse.redirect(url); }
