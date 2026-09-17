import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function AdminPage() {
  try {
    await requireUser();
  } catch {
    redirect('/login');
  }

  const [files, publicCount, privateCount, collections, events] = await Promise.all([
    db.file.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 20 }),
    db.file.count({ where: { visibility: 'PUBLIC', deletedAt: null } }),
    db.file.count({ where: { visibility: 'PRIVATE', deletedAt: null } }),
    db.collection.count(),
    db.event.count(),
  ]);

  const storageTotal = files.reduce((sum, file) => sum + Number(file.size), 0);

  return (
    <main className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/" className="accent">NATTAVAULT / ADMIN</Link>
        <form action="/api/auth/logout" method="post">
          <button className="btn" type="submit">Sign out</button>
        </form>
      </header>

      <section style={{ paddingTop: 64, paddingBottom: 24 }}>
        <p className="accent">CONTROL ROOM</p>
        <h1 style={{ margin: '0 0 12px' }}>Archive overview</h1>
      </section>

      <div className="grid-auto">
        <div className="glass" style={{ padding: 24 }}><p className="muted">Total files</p><strong style={{ fontSize: 30 }}>{files.length}</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Public</p><strong style={{ fontSize: 30 }}>{publicCount}</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Private</p><strong style={{ fontSize: 30 }}>{privateCount}</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Collections</p><strong style={{ fontSize: 30 }}>{collections}</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Views</p><strong style={{ fontSize: 30 }}>{events}</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Storage</p><strong style={{ fontSize: 30 }}>{(storageTotal / 1024 / 1024).toFixed(1)} MB</strong></div>
      </div>

      <section style={{ marginTop: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2>Recent files</h2>
          <Link className="btn btn-primary" href="/admin/upload">Upload files</Link>
        </div>

        <div className="glass" style={{ marginTop: 18, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: 18 }}>
                    <strong>{file.title || file.originalName}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{file.mimeType}</div>
                  </td>
                  <td style={{ padding: 18 }} className="muted">{file.visibility}</td>
                  <td style={{ padding: 18 }} className="muted">{(Number(file.size) / 1024).toFixed(0)} KB</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!files.length ? <p className="muted" style={{ padding: 18 }}>No files yet. Upload your first file to start building your archive.</p> : null}
        </div>
      </section>
    </main>
  );
}
