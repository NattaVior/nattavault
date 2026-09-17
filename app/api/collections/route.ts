import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

async function input(req: Request) { if ((req.headers.get('content-type') || '').includes('application/json')) return req.json() as Promise<Record<string, unknown>>; return Object.fromEntries((await req.formData()).entries()); }
export async function GET() { try { await requireUser(); return NextResponse.json(await db.collection.findMany({ include: { _count: { select: { files: true } } }, orderBy: { name: 'asc' } })); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); } }
export async function POST(req: Request) { try { const userId = await requireUser(); const body = await input(req); const name = String(body.name || '').trim(); const slug = String(body.slug || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required.' }, { status: 400 }); const collection = await db.collection.create({ data: { name, slug, visibility: 'PRIVATE' } }); await db.auditLog.create({ data: { action: 'collection_create', entityId: collection.id, userId } }); return NextResponse.json(collection, { status: 201 }); } catch { return NextResponse.json({ error: 'Collection could not be created.' }, { status: 400 }); } }
