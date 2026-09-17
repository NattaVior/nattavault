import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { getSession } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: { id: string } }) { const file = await db.file.findFirst({ where: { id: params.id, deletedAt: null } }); if (!file) return new NextResponse('Not found', { status: 404 }); if (file.visibility === 'PRIVATE' && !(await getSession())?.userId) return new NextResponse('Not found', { status: 404 }); if (!file.allowDownload) return new NextResponse('Downloads disabled', { status: 403 }); await db.event.create({ data: { type: 'FILE_DOWNLOAD', fileId: file.id } }); return NextResponse.redirect(await storage.createSignedUrl(file.storageKey, true)); }
