import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function AnalyticsPage() {
  try {
    await requireUser();
  } catch {
    redirect('/login');
  }

  const [totalFiles, totalStorage, publicFiles, privateFiles, unlistedFiles, totalViews, totalDownloads, collectionViews, topFiles] = await Promise.all([
    db.file.count({ where: { deletedAt: null } }),
    db.file.aggregate({ _sum: { size: true }, where: { deletedAt: null } }),
    db.file.count({ where: { visibility: 'PUBLIC', deletedAt: null } }),
    db.file.count({ where: { visibility: 'PRIVATE', deletedAt: null } }),
    db.file.count({ where: { visibility: 'UNLISTED', deletedAt: null } }),
    db.event.count({ where: { type: 'FILE_VIEW' } }),
    db.event.count({ where: { type: 'FILE_DOWNLOAD' } }),
    db.event.count({ where: { type: 'COLLECTION_VIEW' } }),
    db.file.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, originalName: true, createdAt: true },
    }),
  ]);

  return (
    <main className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/admin" className="muted">← Dashboard</Link>
      <p className="accent" style={{ marginTop: 56 }}>ANALYTICS</p>
      <h1>Archive signals</h1>

      <div className="grid-auto" style={{ marginTop: 24 }}>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Files</p><strong style={{ fontSize: 32 }}>{totalFiles}</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Storage</p><strong style={{ fontSize: 32 }}>{((Number(totalStorage._sum.size || 0) / 1024 / 1024 / 1024)).toFixed(2)} GB</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Public</p><strong style={{ fontSize: 32 }}>{publicFiles}</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Private</p><strong style={{ fontSize: 32 }}>{privateFiles}</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Unlisted</p><strong style={{ fontSize: 32 }}>{unlistedFiles}</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Views</p><strong style={{ fontSize: 32 }}>{totalViews}</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Downloads</p><strong style={{ fontSize: 32 }}>{totalDownloads}</strong></div>
        <div className="glass" style={{ padding: 24 }}><p className="muted">Collection views</p><strong style={{ fontSize: 32 }}>{collectionViews}</strong></div>
      </div>

      <div className="glass" style={{ padding: 24, marginTop: 32 }}>
        <h3>Recent uploads</h3>
        {topFiles.map((file) => (
          <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span>{file.originalName}</span>
            <span className="muted">{new Date(file.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
