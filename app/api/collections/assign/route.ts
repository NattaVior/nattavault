import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { collectionAssignmentSchema } from '@/lib/security';
import { requireSameOrigin } from '@/lib/request-security';

export async function POST(req: Request) {
  const originError = requireSameOrigin(req); if (originError) return originError;
  try { const userId = await requireUser(); const body = collectionAssignmentSchema.parse(await req.json()); const [file, collection] = await Promise.all([db.file.findFirst({ where: { id: body.fileId, deletedAt: null } }), db.collection.findUnique({ where: { id: body.collectionId } })]); if (!file || !collection) return NextResponse.json({ error: 'File or collection not found.' }, { status: 404 }); await db.collectionFile.upsert({ where: { collectionId_fileId: { collectionId: body.collectionId, fileId: body.fileId } }, update: {}, create: { collectionId: body.collectionId, fileId: body.fileId } }); await db.auditLog.create({ data: { action: 'collection_change', entityId: body.fileId, details: body.collectionId, userId } }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: 'Unable to assign collection.' }, { status: 400 }); }
}
