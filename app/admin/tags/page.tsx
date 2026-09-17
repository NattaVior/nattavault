import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function CollectionsPage() {
  try {
    await requireUser();
  } catch {
    redirect('/login');
  }

  const collections = await db.collection.findMany({
    include: { _count: { select: { files: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <main className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/admin" className="muted">← Dashboard</Link>
      <p className="accent" style={{ marginTop: 56 }}>PRESENTATION</p>
      <h1>Collections</h1>

      <div className="glass" style={{ padding: 22, marginTop: 18 }}>
        <form action="/api/collections" method="post" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input name="name" placeholder="Collection name" style={{ flex: 1, minWidth: 220, padding: 12, borderRadius: 10, background: '#0d0b12', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
          <input name="slug" placeholder="slug" style={{ minWidth: 180, padding: 12, borderRadius: 10, background: '#0d0b12', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
          <button className="btn btn-primary" type="submit">Create collection</button>
        </form>
      </div>

      <div className="grid-auto" style={{ marginTop: 32 }}>
        {collections.map((collection) => (
          <div className="glass" key={collection.id} style={{ padding: 24 }}>
            <p className="accent">{collection.visibility}</p>
            <h3>{collection.name}</h3>
            <p className="muted">/{collection.slug} · {collection._count.files} files</p>
            <p className="muted" style={{ marginTop: 12 }}>{collection.description || 'No description provided.'}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
