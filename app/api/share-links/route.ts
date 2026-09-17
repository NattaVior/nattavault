import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { requireSameOrigin } from '@/lib/request-security';
import { shareLinkSchema } from '@/lib/security';
import crypto from 'node:crypto';

export async function POST(req: Request) { const originError = requireSameOrigin(req); if (originError) return originError; try { const userId = await requireUser(); const body = shareLinkSchema.parse(await req.json()); const file = await db.file.findFirst({ where: { id: body.fileId, deletedAt: null } }); if (!file) return NextResponse.json({ error: 'File not found.' }, { status: 404 }); const link = await db.shareLink.create({ data: { fileId: body.fileId, token: crypto.randomBytes(32).toString('base64url'), expiresAt: body.expiresAt ? new Date(body.expiresAt) : null, downloadAllowed: body.downloadAllowed } }); await db.auditLog.create({ data: { action: 'share_create', entityId: link.id, userId } }); return NextResponse.json(link, { status: 201 }); } catch { return NextResponse.json({ error: 'Unable to create share link.' }, { status: 400 }); } }
export async function DELETE(req: Request) { const originError = requireSameOrigin(req); if (originError) return originError; try { const userId = await requireUser(); const id = new URL(req.url).searchParams.get('id'); if (!id) return NextResponse.json({ error: 'Missing link id.' }, { status: 400 }); await db.shareLink.delete({ where: { id } }); await db.auditLog.create({ data: { action: 'share_revoke', entityId: id, userId } }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: 'Unable to revoke link.' }, { status: 400 }); } }
