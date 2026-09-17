import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

async function input(req: Request) {
  const type = req.headers.get('content-type') || '';
  if (type.includes('application/json')) return req.json() as Promise<Record<string, unknown>>;
  const form = await req.formData();
  return Object.fromEntries(form.entries());
}

export async function GET() {
  try { await requireUser(); return NextResponse.json(await db.folder.findMany({ include: { _count: { select: { files: true, children: true } } }, orderBy: { name: 'asc' } })); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUser(); const body = await input(req); const name = String(body.name || '').trim(); const parentId = body.parentId ? String(body.parentId) : null;
    if (!name || name.length > 120) return NextResponse.json({ error: 'Invalid folder name.' }, { status: 400 });
    if (parentId && !(await db.folder.findUnique({ where: { id: parentId } }))) return NextResponse.json({ error: 'Invalid parent.' }, { status: 400 });
    const folder = await db.folder.create({ data: { name, parentId } }); await db.auditLog.create({ data: { action: 'folder_create', entityId: folder.id, userId } }); return NextResponse.json(folder, { status: 201 });
  } catch { return NextResponse.json({ error: 'Folder already exists or could not be created.' }, { status: 400 }); }
}
