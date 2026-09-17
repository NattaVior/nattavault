import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const file = await db.file.findFirst({
      where: { id: params.id },
      include: { tags: { include: { tag: true } }, folder: true },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({ ...file, size: file.size.toString() });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUser();
    const body = await req.json();
    const file = await db.file.findUnique({ where: { id: params.id } });
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    const folderId = body.folderId === '' ? null : body.folderId || file.folderId;
    if (body.folderId && body.folderId !== '') {
      const folderExists = await db.folder.findUnique({ where: { id: body.folderId } });
      if (!folderExists) return NextResponse.json({ error: 'Folder not found' }, { status: 400 });
    }

    const normalizedTags = Array.isArray(body.tagNames) ? body.tagNames : [];
    const updateData: any = {
      title: body.title !== undefined ? String(body.title || '') : undefined,
      description: body.description !== undefined ? String(body.description || '') : undefined,
      visibility: body.visibility || undefined,
      folderId,
      allowDownload: body.allowDownload !== undefined ? Boolean(body.allowDownload) : undefined,
      featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
    };

    if (body.title === '') updateData.title = null;
    if (body.description === '') updateData.description = null;

    const updated = await db.$transaction(async (tx) => {
      if (Array.isArray(body.tagNames)) {
        await tx.fileTag.deleteMany({ where: { fileId: file.id } });
        for (const tagName of normalizedTags) {
          const name = tagName.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase();
          if (!name) continue;
          const tag = await tx.tag.upsert({
            where: { name },
            update: {},
            create: { name },
          });
          await tx.fileTag.create({ data: { fileId: file.id, tagId: tag.id } });
        }
      }

      const next = await tx.file.update({
        where: { id: file.id },
        data: updateData,
      });

      await tx.auditLog.create({
        data: { action: 'metadata_change', entityId: file.id, userId, details: 'metadata edited' },
      });
      return next;
    });

    return NextResponse.json({ ok: true, file: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to update file metadata.' }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUser();
    const file = await db.file.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    await db.auditLog.create({ data: { action: 'delete', entityId: file.id, userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete file.' }, { status: 400 });
  }
}
