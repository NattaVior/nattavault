import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import crypto from 'node:crypto';

export async function GET() { try { const userId = await requireUser(); const links = await db.shareLink.findMany({ where: { file: { deletedAt: null } }, include: { file: { select: { id: true, originalName: true } } }, orderBy: { createdAt: 'desc' } }); return NextResponse.json({ userId, links }); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); } }
export async function POST(req: Request) { try { const userId = await requireUser(); const { fileId, expiresAt, downloadAllowed = true } = await req.json(); const link = await db.shareLink.create({ data: { fileId, token: crypto.randomBytes(32).toString('base64url'), expiresAt: expiresAt ? new Date(expiresAt) : null, downloadAllowed } }); await db.auditLog.create({ data: { action: 'share_create', entityId: link.id, userId } }); return NextResponse.json(link, { status: 201 }); } catch { return NextResponse.json({ error: 'Unable to create share link' }, { status: 400 }); } }
export async function DELETE(req: Request) { try { const userId = await requireUser(); const id = new URL(req.url).searchParams.get('id'); if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 }); await db.shareLink.delete({ where: { id } }); await db.auditLog.create({ data: { action: 'share_revoke', entityId: id, userId } }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: 'Unable to revoke link' }, { status: 400 }); } }
