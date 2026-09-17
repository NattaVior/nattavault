import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function ActivityPage() {
  try {
    await requireUser();
  } catch {
    redirect('/login');
  }

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { email: true } } },
  });

  return (
    <main className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
      <Link href="/admin" className="muted">← Dashboard</Link>
      <p className="accent" style={{ marginTop: 56 }}>AUDIT TRAIL</p>
      <h1>Recent activity</h1>

      <div className="glass" style={{ overflow: 'hidden', marginTop: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: 14, textAlign: 'left' }}>Action</th>
              <th style={{ padding: 14, textAlign: 'left' }}>User</th>
              <th style={{ padding: 14, textAlign: 'left' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <td style={{ padding: 14 }}><strong>{log.action}</strong><div className="muted">{log.entityId || '—'}</div></td>
                <td style={{ padding: 14 }} className="muted">{log.user.email}</td>
                <td style={{ padding: 14 }} className="muted">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
