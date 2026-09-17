import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { extension, safeName, validateMagicBytes, validateUpload } from '@/lib/security';
import { storage } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    await requireUser();
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 524288000);
    const uploadInfo = validateUpload(file, maxUploadBytes);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    validateMagicBytes(fileBuffer, file.type || uploadInfo.mime || 'application/octet-stream');

    const key = `uploads/${crypto.randomUUID()}-${uploadInfo.safeName}`;
    await storage.upload(key, fileBuffer, file.type || 'application/octet-stream');

    const record = await db.file.create({
      data: {
        originalName: file.name,
        storedName: uploadInfo.safeName,
        storageKey: key,
        mimeType: file.type || 'application/octet-stream',
        extension: extension(file.name),
        size: BigInt(file.size),
        visibility: 'PRIVATE',
        title: file.name,
      },
    });

    await db.auditLog.create({ data: { action: 'upload', entityId: record.id, userId: (await requireUser()) } });

    return NextResponse.json({ ok: true, id: record.id, name: record.originalName });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Something went wrong while uploading this file.' }, { status: 500 });
  }
}
