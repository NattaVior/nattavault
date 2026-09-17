'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminFilesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(pageNo = page) {
    setLoading(true);
    const url = `/api/files?q=${encodeURIComponent(query)}&page=${pageNo}&pageSize=12`;
    const response = await fetch(url);
    const result = await response.json();
    setItems(result.items || []);
    setPages(result.pages || 1);
    setLoading(false);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      load(1);
      setPage(1);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    load(page);
  }, [page]);

  function toggleSelected(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function bulkAction(action: 'delete' | 'restore' | 'visibility' | 'move') {
    if (!selected.length) return;
    const payload: any = { ids: selected, action };
    if (action === 'visibility') {
      payload.visibility = 'PUBLIC';
    }
    if (action === 'move') {
      payload.folderId = '';
    }

    const confirmed = confirm(action === 'delete' ? 'Move selected files to trash?' : 'Apply selected bulk action?');
    if (!confirmed) return;

    const response = await fetch('/api/files', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      setSelected([]);
      load();
    } else {
      setError('Bulk action failed.');
    }
  }

  const isAllSelected = items.length > 0 && items.every((item) => selected.includes(item.id));

  return (
    <main className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/admin" className="muted">← Dashboard</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap', marginTop: 56, marginBottom: 26 }}>
        <div>
          <p className="accent">FILE MANAGER</p>
          <h1>Archive files</h1>
        </div>
        <Link href="/admin/upload" className="btn btn-primary">Upload</Link>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <input
          aria-label="Search files"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search filename, title, tags, folder..."
          style={{ minWidth: 280, flex: 1, padding: 14, borderRadius: 12, background: '#17131f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
        />
        <button className="btn" onClick={() => setView('grid')} type="button">Grid</button>
        <button className="btn" onClick={() => setView('list')} type="button">List</button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <button className="btn" onClick={() => setSelected(items.map((item) => item.id))} type="button">Select all</button>
        <button className="btn" onClick={() => bulkAction('delete')} type="button">Delete</button>
        <button className="btn" onClick={() => bulkAction('restore')} type="button">Restore</button>
        <button className="btn" onClick={() => bulkAction('visibility')} type="button">Publish</button>
      </div>

      {error ? <p style={{ color: '#f2a8a8' }}>{error}</p> : null}

      {loading ? (
        <p className="muted">Loading files…</p>
      ) : items.length === 0 ? (
        <div className="glass" style={{ padding: 24 }}>
          <p className="muted">No files yet.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid-auto">
          {items.map((item) => (
            <article key={item.id} className="glass" style={{ padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelected(item.id)} />
                <span className="muted">{item.visibility}</span>
              </div>
              <div className="preview">
                {item.mimeType.startsWith('image/') ? (
                  <img src={`/api/files/${item.id}/preview`} alt={item.title || item.originalName} />
                ) : (
                  <span className="accent" style={{ fontSize: 24, letterSpacing: '0.12em' }}>{item.extension?.toUpperCase() || 'FILE'}</span>
                )}
              </div>
              <div style={{ padding: '14px 4px 10px' }}>
                <strong>{item.title || item.originalName}</strong>
                <p className="muted" style={{ margin: '6px 0 0', fontSize: 12 }}>{item.mimeType}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <Link href={`/admin/files/${item.id}`} className="btn">Edit</Link>
                  <a href={`/api/files/${item.id}/download`} className="btn">Download</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: 14, textAlign: 'left' }}>Select</th>
                <th style={{ padding: 14, textAlign: 'left' }}>File</th>
                <th style={{ padding: 14, textAlign: 'left' }}>Type</th>
                <th style={{ padding: 14, textAlign: 'left' }}>Visibility</th>
                <th style={{ padding: 14, textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: 14 }}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelected(item.id)} /></td>
                  <td style={{ padding: 14 }}><strong>{item.title || item.originalName}</strong></td>
                  <td style={{ padding: 14 }} className="muted">{item.mimeType}</td>
                  <td style={{ padding: 14 }} className="muted">{item.visibility}</td>
                  <td style={{ padding: 14 }}><Link href={`/admin/files/${item.id}`} className="btn">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 26 }}>
        {Array.from({ length: pages }, (_, index) => index + 1).map((pageNo) => (
          <button key={pageNo} className="btn" disabled={pageNo === page} onClick={() => setPage(pageNo)} type="button">{pageNo}</button>
        ))}
      </div>
    </main>
  );
}
