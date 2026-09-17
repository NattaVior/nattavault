import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

export default async function FileDetailPage({ params }: { params: { id: string } }) {
  const file = await db.file.findFirst({
    where: {
      id: params.id,
      visibility: { in: ['PUBLIC', 'UNLISTED'] },
      deletedAt: null,
    },
    include: {
      tags: { include: { tag: true } },
      collections: { include: { collection: true } },
    },
  });

  if (!file) notFound();

  await db.event.create({ data: { type: 'FILE_VIEW', fileId: file.id } });

  return (
    <main className="shell" style={{ paddingTop: 30, paddingBottom: 90 }}>
      <Link href="/works" className="muted">← Back to works</Link>

      <div style={{ maxWidth: 980, margin: '48px auto 0' }}>
        <div className="glass preview" style={{ aspectRatio: '16 / 10' }}>
          {file.mimeType.startsWith('image/') ? (
            <img src={`/api/files/${file.id}/preview`} alt={file.title || file.originalName} />
          ) : file.mimeType.startsWith('video/') ? (
            <video controls src={`/api/files/${file.id}/preview`} />
          ) : file.mimeType.startsWith('audio/') ? (
            <audio controls src={`/api/files/${file.id}/preview`} />
          ) : (
            <span className="accent" style={{ fontSize: 36, letterSpacing: '0.12em' }}>
              {file.extension?.toUpperCase() || 'FILE'}
            </span>
          )}
        </div>

        <div style={{ marginTop: 32 }}>
          <p className="accent" style={{ fontSize: 12, letterSpacing: '0.14em' }}>
            {file.extension?.toUpperCase() || 'FILE'} · {(Number(file.size) / 1024 / 1024).toFixed(2)} MB
          </p>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', margin: '12px 0' }}>{file.title || file.originalName}</h1>
          <p className="muted" style={{ maxWidth: 700, fontSize: 18, lineHeight: 1.65 }}>
            {file.description || 'A work from the NattaVault archive.'}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            {file.tags.map((item) => (
              <span key={item.tagId} className="glass" style={{ padding: '7px 12px', fontSize: 13 }}>
                #{item.tag.name}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
            {file.allowDownload ? (
              <a href={`/api/files/${file.id}/download`} className="btn btn-primary">Download file</a>
            ) : null}
            <Link href="/works" className="btn">Browse more</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
