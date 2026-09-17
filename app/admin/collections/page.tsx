import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function FoldersPage() {
  try {
    await requireUser();
  } catch {
    redirect('/login');
  }

  const folders = await db.folder.findMany({
    include: { _count: { select: { files: true, children: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <main className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/admin" className="muted">← Dashboard</Link>
      <p className="accent" style={{ marginTop: 56 }}>ORGANIZATION</p>
      <h1>Folders</h1>

      <div className="glass" style={{ padding: 22, marginTop: 24 }}>
        <form action="/api/folders" method="post" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input name="name" placeholder="New folder name" style={{ flex: 1, minWidth: 220, padding: 12, borderRadius: 10, background: '#0d0b12', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
          <button className="btn btn-primary" type="submit">Create folder</button>
        </form>
      </div>

      <div className="grid-auto" style={{ marginTop: 28 }}>
        {folders.map((folder) => (
          <div className="glass" key={folder.id} style={{ padding: 22 }}>
            <h3>{folder.name}</h3>
            <p className="muted">{folder._count.files} files · {folder._count.children} subfolders</p>
          </div>
        ))}
      </div>
    </main>
  );
}
