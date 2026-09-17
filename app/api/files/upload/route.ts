import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { extension, safeName } from '@/lib/security';
import { storage } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    await requireUser();
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 524288000);
    if (file.size > maxUploadBytes) {
      return NextResponse.json({ error: 'File exceeds the configured file size limit.' }, { status: 413 });
    }

    const key = `uploads/${crypto.randomUUID()}-${safeName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await storage.upload(key, buffer, file.type || 'application/octet-stream');

    const record = await db.file.create({
      data: {
        originalName: file.name,
        storedName: file.name,
        storageKey: key,
        mimeType: file.type || 'application/octet-stream',
        extension: extension(file.name),
        size: BigInt(file.size),
        visibility: 'PRIVATE',
      },
    });

    return NextResponse.json({ ok: true, id: record.id, name: record.originalName });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Something went wrong while uploading this file.' }, { status: 500 });
  }
}
