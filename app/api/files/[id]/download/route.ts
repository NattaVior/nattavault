import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const file = await db.file.findFirst({
    where: { id: params.id, deletedAt: null, visibility: { in: ['PUBLIC', 'UNLISTED'] } },
  });

  if (!file) return new NextResponse('Not found', { status: 404 });

  const signed = await storage.createSignedUrl(file.storageKey, false);
  return NextResponse.redirect(signed);
}
