import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { requireSameOrigin } from '@/lib/request-security';

export async function POST(req: Request) { const originError = requireSameOrigin(req); if (originError) return originError; try { const userId = await requireUser(); const body = await req.json(); const name = String(body.name || '').trim(); const slug = String(body.slug || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); if (!name || !slug || name.length > 160 || slug.length > 120) return NextResponse.json({ error: 'Invalid collection.' }, { status: 400 }); const collection = await db.collection.create({ data: { name, slug, description: body.description ? String(body.description).slice(0, 5000) : null, visibility: ['PRIVATE', 'PUBLIC', 'UNLISTED'].includes(body.visibility) ? body.visibility : 'PRIVATE' } }); await db.auditLog.create({ data: { action: 'collection_create', entityId: collection.id, userId } }); return NextResponse.json(collection, { status: 201 }); } catch { return NextResponse.json({ error: 'Collection could not be created.' }, { status: 400 }); } }
