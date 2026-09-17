import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { metadataSchema, normalizeTagName } from '@/lib/security';

export async function GET(req: Request) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() || '';
    const visibility = url.searchParams.get('visibility') as 'PRIVATE' | 'PUBLIC' | 'UNLISTED' | null;
    const folderId = url.searchParams.get('folderId');
    const tag = url.searchParams.get('tag')?.trim().toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 24)));
    const sort = url.searchParams.get('sort') === 'name' ? { originalName: 'asc' as const } : { createdAt: 'desc' as const };
    const where = { deletedAt: null, ...(visibility ? { visibility } : {}), ...(folderId ? { folderId } : {}), ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}), ...(q ? { OR: [{ originalName: { contains: q, mode: 'insensitive' as const } }, { title: { contains: q, mode: 'insensitive' as const } }, { description: { contains: q, mode: 'insensitive' as const } }, { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' as const } } } } }, { folder: { name: { contains: q, mode: 'insensitive' as const } } }] } : {}) };
    const [items, total] = await Promise.all([db.file.findMany({ where, include: { tags: { include: { tag: true } }, folder: true, collections: { include: { collection: true } } }, orderBy: sort, skip: (page - 1) * pageSize, take: pageSize }), db.file.count({ where })]);
    return NextResponse.json({ items: items.map((f) => ({ ...f, size: f.size.toString() })), total, page, pageSize, pages: Math.ceil(total / pageSize) });
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUser();
    const body = metadataSchema.extend({ folderId: zString(), tagNames: zTags() }).parse(await req.json());
    const file = await db.file.findUnique({ where: { id: params.id } });
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    if (body.folderId) { const folder = await db.folder.findUnique({ where: { id: body.folderId } }); if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 400 }); }
    const tags = (body.tagNames || []).map(normalizeTagName).filter(Boolean);
    const updated = await db.$transaction(async (tx) => {
      if (body.tagNames) { await tx.fileTag.deleteMany({ where: { fileId: file.id } }); for (const name of tags) { const t = await tx.tag.upsert({ where: { name }, update: {}, create: { name } }); await tx.fileTag.create({ data: { fileId: file.id, tagId: t.id } }); } }
      const next = await tx.file.update({ where: { id: file.id }, data: { title: body.title, description: body.description, visibility: body.visibility, allowDownload: body.allowDownload, featured: body.featured, folderId: body.folderId || null, publishedAt: body.visibility === 'PUBLIC' ? (file.publishedAt || new Date()) : null } });
      await tx.auditLog.create({ data: { action: 'metadata_change', entityId: file.id, userId } }); return next;
    });
    return NextResponse.json({ ...updated, size: updated.size.toString() });
  } catch { return NextResponse.json({ error: 'Invalid metadata or unauthorized request' }, { status: 400 }); }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try { const userId = await requireUser(); const file = await db.file.update({ where: { id: params.id }, data: { deletedAt: new Date() } }); await db.auditLog.create({ data: { action: 'delete', entityId: file.id, userId } }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: 'Unable to delete file' }, { status: 400 }); }
}

const zString = () => ({ optional: () => undefined });
const zTags = () => ({ optional: () => undefined });
