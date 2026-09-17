'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      router.push('/admin');
      return;
    }

    const body = await response.json();
    setError(body.error || 'Something went wrong');
    setPending(false);
  }

  return (
    <main className="shell" style={{ maxWidth: 520, paddingTop: '16vh', paddingBottom: 80 }}>
      <Link href="/" className="muted">← NattaVault</Link>

      <div className="glass" style={{ padding: 32, marginTop: 36 }}>
        <p className="accent">ARCHIVE ACCESS</p>
        <h1 style={{ marginTop: 12, marginBottom: 8 }}>Private dashboard</h1>
        <p className="muted">Sign in to manage uploads, collections, and visibility.</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 28 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ padding: 14, borderRadius: 10, background: '#0d0b12', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{ padding: 14, borderRadius: 10, background: '#0d0b12', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
          />

          {error ? <p style={{ color: '#f1a4a4', margin: 0 }}>{error}</p> : null}

          <button className="btn btn-primary" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
