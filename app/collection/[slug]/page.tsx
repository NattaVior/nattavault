import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

export default async function CollectionDetailPage({ params }: { params: { slug: string } }) {
  const collection = await db.collection.findFirst({ where: { slug: params.slug, visibility: 'PUBLIC' }, include: { files: { where: { file: { visibility: 'PUBLIC', deletedAt: null } }, include: { file: { include: { tags: { include: { tag: true } } } } }, orderBy: { order: 'asc' } } } });
  if (!collection) notFound();
  await db.event.create({ data: { type: 'COLLECTION_VIEW', collectionId: collection.id } });
  return <main className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
    <Link href="/" className="muted">← Back to archive</Link>
    <section style={{ paddingTop: 56, paddingBottom: 30 }}><p className="accent">COLLECTION</p><h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)', margin: 0 }}>{collection.name}</h1><p className="muted" style={{ maxWidth: 680, lineHeight: 1.8, marginTop: 16 }}>{collection.description || 'A collection from the archive.'}</p></section>
    <div className="grid-auto">{collection.files.length ? collection.files.map(({ file }) => <Link key={file.id} href={`/file/${file.id}`} className="glass file-card" style={{ padding: 10 }}><div className="preview">{file.mimeType.startsWith('image/') ? <img src={`/api/files/${file.id}/preview`} alt={file.title || file.originalName} /> : <span className="accent" style={{ fontSize: 24 }}>{file.extension?.toUpperCase() || 'FILE'}</span>}</div><div style={{ padding: '14px 4px 6px' }}><strong>{file.title || file.originalName}</strong><p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>{file.tags.map((t) => `#${t.tag.name}`).join(' ')}</p></div></Link>) : <p className="muted">This collection is empty.</p>}</div>
  </main>;
}
