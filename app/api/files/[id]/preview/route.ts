import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { storage } from '@/lib/storage';

const ACTIVE_CONTENT = new Set(['text/html', 'application/xhtml+xml', 'image/svg+xml', 'application/javascript', 'text/javascript']);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const file = await db.file.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!file) return new NextResponse('Not found', { status: 404 });
  if (file.visibility === 'PRIVATE' && !(await getSession())?.userId) return new NextResponse('Not found', { status: 404 });

  // Active uploads are forced to download so they cannot execute in the app origin.
  const forceDownload = ACTIVE_CONTENT.has(file.mimeType.toLowerCase());
  return NextResponse.redirect(await storage.createSignedUrl(file.storageKey, forceDownload, file.mimeType));
}
