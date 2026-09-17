import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    const body = await req.json();
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === 'string') : [];
    const fileId = typeof body.fileId === 'string' ? body.fileId : '';
    const collectionId = typeof body.collectionId === 'string' ? body.collectionId : '';
    if (!fileId || !collectionId || !ids.includes(fileId)) return NextResponse.json({ error: 'Invalid collection assignment.' }, { status: 400 });
    await db.collectionFile.upsert({ where: { collectionId_fileId: { collectionId, fileId } }, update: {}, create: { collectionId, fileId } });
    await db.auditLog.create({ data: { action: 'collection_change', entityId: fileId, details: collectionId, userId } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Unable to assign collection.' }, { status: 400 }); }
}
