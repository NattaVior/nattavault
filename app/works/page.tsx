import Link from 'next/link';
import { db } from '@/lib/db';

export default async function WorksPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const query = searchParams?.q?.trim() || '';

  const files = await db.file.findMany({
    where: {
      visibility: 'PUBLIC',
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { originalName: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { tags: { some: { tag: { name: { contains: query, mode: 'insensitive' } } } } },
            ],
          }
        : {}),
    },
    orderBy: { publishedAt: 'desc' },
    include: { tags: { include: { tag: true } } },
    take: 60,
  });

  return (
    <main className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/" className="muted">← Back to archive</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 20, flexWrap: 'wrap', marginTop: 72, marginBottom: 36 }}>
        <div>
          <p className="accent">THE ARCHIVE</p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', margin: 0 }}>Works</h1>
        </div>

        <form>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search archive…"
            style={{
              minWidth: 220,
              background: '#17131f',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999,
              padding: '12px 16px',
            }}
          />
        </form>
      </div>

      <div className="grid-auto">
        {files.length ? (
          files.map((file) => (
            <Link key={file.id} href={`/file/${file.id}`} className="glass file-card" style={{ padding: 10 }}>
              <div className="preview">
                {file.mimeType.startsWith('image/') ? (
                  <img src={`/api/files/${file.id}/preview`} alt={file.title || file.originalName} />
                ) : (
                  <span className="accent" style={{ fontSize: 26, letterSpacing: '0.12em' }}>
                    {file.extension?.toUpperCase() || 'FILE'}
                  </span>
                )}
              </div>
              <div style={{ padding: '14px 4px 6px' }}>
                <strong>{file.title || file.originalName}</strong>
                <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
                  {file.tags.map((t) => `#${t.tag.name}`).join(' ')}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="muted">No works found. Try another keyword.</p>
        )}
      </div>
    </main>
  );
}
