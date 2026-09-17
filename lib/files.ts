import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function canAccessFile(file: { visibility: string }) {
  if (file.visibility === 'PUBLIC' || file.visibility === 'UNLISTED') return true;
  return Boolean((await getSession())?.userId);
}

export function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { 'content-type': 'application/json' } });
}

export { db };
