import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { extension, safeName, validateMagicBytes, validateUpload } from '@/lib/security';
import { storage } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 524288000);
    const info = validateUpload(file, maxUploadBytes);
    const buffer = Buffer.from(await file.arrayBuffer());
    validateMagicBytes(buffer, file.type || info.mime || 'application/octet-stream');

    const storageKey = `uploads/${crypto.randomUUID()}-${info.safeName}`;
    await storage.upload(storageKey, buffer, file.type || 'application/octet-stream');

    try {
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
      const record = await db.file.create({
        data: {
          originalName: file.name,
          storedName: info.safeName,
          storageKey,
          mimeType: file.type || 'application/octet-stream',
          extension: extension(file.name),
          size: BigInt(file.size),
          checksum,
          visibility: 'PRIVATE',
          title: file.name,
        },
      });
      await db.auditLog.create({ data: { action: 'upload', entityId: record.id, userId } });
      return NextResponse.json({ ok: true, id: record.id, name: record.originalName });
    } catch (databaseError) {
      await storage.delete(storageKey).catch(() => undefined);
      throw databaseError;
    }
  } catch (error) {
    console.error('Upload failed:', error);
    const message = error instanceof Error ? error.message : 'Something went wrong while uploading this file.';
    return NextResponse.json({ error: message }, { status: message.includes('large') ? 413 : 400 });
  }
}
