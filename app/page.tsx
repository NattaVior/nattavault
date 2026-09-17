import Link from 'next/link';
import { db } from '@/lib/db';

export default async function HomePage() {
  const [featured, collections, totalFiles] = await Promise.all([
    db.file.findMany({
      where: { visibility: 'PUBLIC', deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      take: 6,
      include: { tags: { include: { tag: true } } },
    }),
    db.collection.findMany({
      where: { visibility: 'PUBLIC' },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    db.file.count({ where: { visibility: 'PUBLIC', deletedAt: null } }),
  ]);

  const archiveSize = await db.file.aggregate({
    _sum: { size: true },
    where: { visibility: 'PUBLIC', deletedAt: null },
  });

  return (
    <main>
      <header className="shell" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 28 }}>
        <strong style={{ letterSpacing: '0.18em' }}>NATTAVAULT</strong>
        <Link href="/login" className="muted">Archive access →</Link>
      </header>

      <section className="shell" style={{ paddingTop: '10vh', paddingBottom: '10vh' }}>
        <p className="accent" style={{ letterSpacing: '0.18em', marginBottom: 18 }}>PERSONAL DIGITAL ARCHIVE</p>
        <h1 className="hero-title">Things I’ve made.</h1>
        <p className="muted" style={{ maxWidth: 620, fontSize: 20, lineHeight: 1.6, marginTop: 24 }}>
          A curated collection of digital work, experiments, prototypes, and process.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
          <Link href="/works" className="btn btn-primary">Explore works</Link>
          <Link href="#about" className="btn">About this archive</Link>
        </div>
      </section>

      <section className="shell" style={{ paddingBottom: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p className="accent">01 / FEATURED</p>
            <h2>Featured works</h2>
          </div>
          <Link href="/works" className="muted">View all →</Link>
        </div>

        <div className="grid-auto">
          {featured.length ? (
            featured.map((file) => (
              <Link key={file.id} href={`/file/${file.id}`} className="glass file-card" style={{ padding: 10 }}>
                <div className="preview">
                  {file.mimeType.startsWith('image/') ? (
                    <img src={`/api/files/${file.id}/preview`} alt={file.title || file.originalName} />
                  ) : (
                    <span className="accent" style={{ fontSize: 24, letterSpacing: '0.12em' }}>
                      {file.extension?.toUpperCase() || 'FILE'}
                    </span>
                  )}
                </div>
                <div style={{ padding: '14px 4px 6px' }}>
                  <strong>{file.title || file.originalName}</strong>
                  <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
                    {file.mimeType} · {Math.max(1, Math.round(Number(file.size) / 1024))} KB
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="muted">The archive is quiet for now.</p>
          )}
        </div>
      </section>

      <section id="about" className="shell" style={{ paddingBottom: 80 }}>
        <p className="accent">02 / COLLECTIONS</p>
        <h2>Organized by curiosity.</h2>
        <div className="grid-auto" style={{ marginTop: 20 }}>
          {collections.map((collection) => (
            <Link key={collection.id} href={`/collection/${collection.slug}`} className="glass" style={{ padding: 24, minHeight: 160 }}>
              <p className="muted">Collection</p>
              <h3>{collection.name}</h3>
              <p className="muted" style={{ marginTop: 12 }}>{collection.description || 'A public set of works.'}</p>
              <span className="accent">Open collection →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="shell" style={{ paddingBottom: 90 }}>
        <div className="grid-auto">
          <div className="glass" style={{ padding: 28 }}>
            <p className="muted">Archive size</p>
            <strong style={{ fontSize: 32 }}>{((Number(archiveSize._sum.size || 0) / 1024 / 1024 / 1024)).toFixed(1)} GB</strong>
          </div>
          <div className="glass" style={{ padding: 28 }}>
            <p className="muted">Public works</p>
            <strong style={{ fontSize: 32 }}>{totalFiles}</strong>
          </div>
          <div className="glass" style={{ padding: 28 }}>
            <p className="muted">Collections</p>
            <strong style={{ fontSize: 32 }}>{collections.length}</strong>
          </div>
        </div>
      </section>

      <footer className="shell muted" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.09)', flexWrap: 'wrap' }}>
        <span>NattaVault</span>
        <span>© 2026</span>
        <span>Public archive</span>
      </footer>
    </main>
  );
}
