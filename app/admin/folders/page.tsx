'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FileEditorPage({ params }: { params: { id: string } }) {
  const [file, setFile] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [tagsText, setTagsText] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/files/${params.id}`).then((response) => response.json()),
      fetch('/api/folders').then((response) => response.json()),
    ]).then(([fileResult, folderResult]) => {
      setFile(fileResult);
      setFolders(folderResult || []);
      setTagsText((fileResult.tags || []).map((tag: any) => tag.tag.name).join(', '));
    });
  }, [params.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get('title') || '',
      description: form.get('description') || '',
      visibility: form.get('visibility'),
      folderId: form.get('folderId') || '',
      allowDownload: form.get('allowDownload') === 'on',
      featured: form.get('featured') === 'on',
      tagNames: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
    };

    setStatus('Saving…');
    const response = await fetch(`/api/files/${params.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setStatus(response.ok ? 'Saved.' : 'Unable to save metadata.');
  }

  if (!file) {
    return <main className="shell" style={{ paddingTop: 80 }}><p className="muted">Loading file metadata…</p></main>;
  }

  return (
    <main className="shell" style={{ maxWidth: 760, paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/admin/files" className="muted">← File manager</Link>

      <div className="glass" style={{ padding: 30, marginTop: 36 }}>
        <p className="accent">FILE METADATA</p>
        <h1>{file.originalName}</h1>
        <p className="muted">{file.mimeType} · {(Number(file.size) / 1024 / 1024).toFixed(2)} MB</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          <input name="title" defaultValue={file.title || ''} placeholder="Title" style={fieldStyle} />
          <textarea name="description" defaultValue={file.description || ''} placeholder="Description" rows={6} style={fieldStyle} />

          <select name="visibility" defaultValue={file.visibility} style={fieldStyle}>
            <option value="PRIVATE">PRIVATE</option>
            <option value="PUBLIC">PUBLIC</option>
            <option value="UNLISTED">UNLISTED</option>
          </select>

          <select name="folderId" defaultValue={file.folderId || ''} style={fieldStyle}>
            <option value="">Unfiled</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>

          <input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="Tags, comma separated" style={fieldStyle} />

          <label className="muted"><input type="checkbox" name="allowDownload" defaultChecked={file.allowDownload} /> Allow downloads</label>
          <label className="muted"><input type="checkbox" name="featured" defaultChecked={file.featured} /> Feature this file</label>

          <button className="btn btn-primary" type="submit">Save metadata</button>
          <p className="muted">{status}</p>
        </form>
      </div>
    </main>
  );
}

const fieldStyle = {
  background: '#0d0b12',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  borderRadius: 10,
  padding: 14,
};
