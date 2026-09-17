import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

const SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'originalName', 'size']);
const VISIBILITIES = new Set(['PRIVATE', 'PUBLIC', 'UNLISTED']);

export async function GET(req: Request) {
  try {
    await requireUser();
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() || '';
    const visibility = url.searchParams.get('visibility') || '';
    const folderId = url.searchParams.get('folderId');
    const tag = url.searchParams.get('tag')?.trim().toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || 24)));
    const sortField = SORT_FIELDS.has(url.searchParams.get('sort') || '') ? url.searchParams.get('sort')! : 'createdAt';
    const sortDirection = url.searchParams.get('direction') === 'asc' ? 'asc' : 'desc';
    const where: any = { deletedAt: null };

    if (VISIBILITIES.has(visibility)) where.visibility = visibility;
    if (folderId) where.folderId = folderId;
    if (tag) where.tags = { some: { tag: { name: tag } } };
    if (q) where.OR = [
      { originalName: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { folder: { name: { contains: q, mode: 'insensitive' } } },
      { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' } } } } },
    ];

    const [items, total] = await Promise.all([
      db.file.findMany({ where, include: { tags: { include: { tag: true } }, folder: true }, orderBy: { [sortField]: sortDirection }, skip: (page - 1) * pageSize, take: pageSize }),
      db.file.count({ where }),
    ]);
    return NextResponse.json({ items: items.map((file) => ({ ...file, size: file.size.toString() })), total, page, pageSize, pages: Math.ceil(total / pageSize) });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await requireUser();
    const body = await req.json();
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === 'string') : [];
    if (!ids.length) return NextResponse.json({ error: 'No files selected.' }, { status: 400 });

    if (body.action === 'delete' || body.action === 'restore') {
      await db.file.updateMany({ where: { id: { in: ids } }, data: { deletedAt: body.action === 'delete' ? new Date() : null } });
      await db.auditLog.create({ data: { action: body.action, entityId: ids.join(','), userId } });
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'visibility' && VISIBILITIES.has(body.visibility)) {
      await db.file.updateMany({ where: { id: { in: ids } }, data: { visibility: body.visibility } });
      await db.auditLog.create({ data: { action: 'visibility_change', entityId: ids.join(','), details: body.visibility, userId } });
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'move') {
      const folderId = body.folderId || null;
      if (folderId && !(await db.folder.findUnique({ where: { id: folderId } }))) return NextResponse.json({ error: 'Folder not found.' }, { status: 400 });
      await db.file.updateMany({ where: { id: { in: ids } }, data: { folderId } });
      await db.auditLog.create({ data: { action: 'move', entityId: ids.join(','), details: folderId || 'root', userId } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unsupported bulk action.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Bulk action failed.' }, { status: 400 });
  }
}
