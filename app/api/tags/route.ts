import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

async function input(req: Request) { if ((req.headers.get('content-type') || '').includes('application/json')) return req.json() as Promise<Record<string, unknown>>; return Object.fromEntries((await req.formData()).entries()); }
export async function GET() { try { await requireUser(); return NextResponse.json(await db.tag.findMany({ include: { _count: { select: { files: true } } }, orderBy: { name: 'asc' } })); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); } }
export async function POST(req: Request) { try { const userId = await requireUser(); const body = await input(req); const name = String(body.name || '').trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase(); if (!name || name.length > 80) return NextResponse.json({ error: 'Invalid tag.' }, { status: 400 }); const tag = await db.tag.create({ data: { name } }); await db.auditLog.create({ data: { action: 'tag_create', entityId: tag.id, userId } }); return NextResponse.json(tag, { status: 201 }); } catch { return NextResponse.json({ error: 'Tag already exists.' }, { status: 409 }); } }
