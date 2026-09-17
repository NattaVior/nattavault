import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const file = await db.file.findUnique({ where: { id: params.id }, include: { tags: { include: { tag: true } }, folder: true, collections: { include: { collection: true } } } });
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    return NextResponse.json({ ...file, size: file.size.toString() });
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUser();
    const body = await req.json();
    const file = await db.file.findUnique({ where: { id: params.id } });
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    if (body.visibility && !['PRIVATE', 'PUBLIC', 'UNLISTED'].includes(body.visibility)) return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
    const folderId = body.folderId === '' ? null : body.folderId ?? file.folderId;
    if (folderId && !(await db.folder.findUnique({ where: { id: folderId } }))) return NextResponse.json({ error: 'Folder not found' }, { status: 400 });

    const updated = await db.$transaction(async (tx) => {
      if (Array.isArray(body.tagNames)) {
        await tx.fileTag.deleteMany({ where: { fileId: file.id } });
        const names = new Set<string>();
        for (const raw of body.tagNames) {
          const name = String(raw).trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase().slice(0, 80);
          if (!name || names.has(name)) continue;
          names.add(name);
          const tag = await tx.tag.upsert({ where: { name }, update: {}, create: { name } });
          await tx.fileTag.create({ data: { fileId: file.id, tagId: tag.id } });
        }
      }
      const visibility = body.visibility || file.visibility;
      const next = await tx.file.update({ where: { id: file.id }, data: {
        title: body.title !== undefined ? (body.title ? String(body.title).slice(0, 160) : null) : undefined,
        description: body.description !== undefined ? (body.description ? String(body.description).slice(0, 5000) : null) : undefined,
        folderId, visibility, publishedAt: visibility === 'PUBLIC' ? file.publishedAt || new Date() : null,
        allowDownload: body.allowDownload !== undefined ? Boolean(body.allowDownload) : undefined,
        featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
      }});
      await tx.auditLog.create({ data: { action: 'metadata_change', entityId: file.id, userId, details: 'file metadata updated' } });
      return next;
    });
    return NextResponse.json({ ok: true, file: { ...updated, size: updated.size.toString() } });
  } catch { return NextResponse.json({ error: 'Unable to update file metadata.' }, { status: 400 }); }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUser();
    const file = await db.file.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
    await db.auditLog.create({ data: { action: 'delete', entityId: file.id, userId, details: 'soft deleted; object retained for restore' } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Unable to delete file.' }, { status: 400 }); }
}
