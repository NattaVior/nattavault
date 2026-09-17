import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { requireSameOrigin } from '@/lib/request-security';
import { idSchema } from '@/lib/security';
export async function DELETE(req: Request) { const blocked = requireSameOrigin(req); if (blocked) return blocked; try { const userId = await requireUser(); const body = idSchema.parse((await req.json()).id); const file = await db.file.findFirst({ where: { id: body, deletedAt: { not: null } } }); if (!file) return NextResponse.json({ error: 'Deleted file not found.' }, { status: 404 }); await storage.delete(file.storageKey); await db.file.delete({ where: { id: file.id } }); await db.auditLog.create({ data: { action: 'permanent_delete', entityId: file.id, userId } }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: 'Permanent deletion failed.' }, { status: 400 }); } }
