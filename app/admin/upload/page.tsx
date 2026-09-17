'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function UploadPage() {
  const [status, setStatus] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('file') as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (!files.length) {
      setStatus('Please select at least one file.');
      return;
    }

    setStatus('Uploading…');
    let uploaded = 0;

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/files/upload', { method: 'POST', body: formData });
      if (response.ok) uploaded += 1;
    }

    setStatus(`${uploaded} file${uploaded === 1 ? '' : 's'} uploaded.`);
  }

  return (
    <main className="shell" style={{ maxWidth: 760, paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/admin" className="muted">← Back to admin</Link>

      <div className="glass" style={{ marginTop: 42, padding: 30 }}>
        <p className="accent">UPLOAD</p>
        <h1 style={{ marginTop: 8 }}>Add to archive</h1>
        <p className="muted">Multiple files are accepted; the server validates each one before storing it.</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18, marginTop: 22 }}>
          <input type="file" name="file" multiple required style={{ width: '100%', padding: 28, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 18, background: '#111117' }} />
          <button className="btn btn-primary" type="submit">Upload files</button>
          {status ? <p className="muted">{status}</p> : null}
        </form>
      </div>
    </main>
  );
}
