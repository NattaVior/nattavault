import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { rateLimit, requireSameOrigin } from '@/lib/request-security';
import { validateMagicBytes, validateUpload } from '@/lib/security';
import { storage } from '@/lib/storage';
import crypto from 'node:crypto';

export async function POST(req: Request) {
  const originError = requireSameOrigin(req); if (originError) return originError; const limited = rateLimit(req, 'upload'); if (limited) return limited;
  try { const userId = await requireUser(); const form = await req.formData(); const file = form.get('file'); if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided.' }, { status: 400 }); const max = Number(process.env.MAX_UPLOAD_BYTES || 524288000); const { safeName, ext, mime } = validateUpload(file, max); const buffer = Buffer.from(await file.arrayBuffer()); validateMagicBytes(buffer, mime); const key = `uploads/${crypto.randomUUID()}-${safeName}`; await storage.upload(key, buffer, mime || 'application/octet-stream'); try { const record = await db.file.create({ data: { originalName: file.name, storedName: safeName, storageKey: key, mimeType: mime || 'application/octet-stream', extension: ext, size: BigInt(file.size), checksum: crypto.createHash('sha256').update(buffer).digest('hex'), title: file.name, visibility: 'PRIVATE' } }); await db.auditLog.create({ data: { action: 'upload', entityId: record.id, userId } }); return NextResponse.json({ ok: true, id: record.id, name: record.originalName }); } catch (error) { await storage.delete(key).catch(() => undefined); throw error; } } catch { return NextResponse.json({ error: 'Upload could not be completed.' }, { status: 400 }); }
}
