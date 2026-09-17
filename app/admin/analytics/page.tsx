import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function TagsPage() {
  try {
    await requireUser();
  } catch {
    redirect('/login');
  }

  const tags = await db.tag.findMany({
    include: { _count: { select: { files: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <main className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/admin" className="muted">← Dashboard</Link>
      <p className="accent" style={{ marginTop: 56 }}>TAXONOMY</p>
      <h1>Tags</h1>

      <div className="glass" style={{ padding: 22, marginTop: 18 }}>
        <form action="/api/tags" method="post" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input name="name" placeholder="New tag name" style={{ flex: 1, minWidth: 220, padding: 12, borderRadius: 10, background: '#0d0b12', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
          <button className="btn btn-primary" type="submit">Create tag</button>
        </form>
      </div>

      <div className="grid-auto" style={{ marginTop: 30 }}>
        {tags.map((tag) => (
          <div key={tag.id} className="glass" style={{ padding: 22 }}>
            <h3>#{tag.name}</h3>
            <p className="muted">{tag._count.files} files</p>
          </div>
        ))}
      </div>
    </main>
  );
}
