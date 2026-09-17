import { z } from 'zod';

export const loginSchema = z.object({ email: z.string().email().transform((value) => value.toLowerCase()), password: z.string().min(8).max(200) });
export const metadataSchema = z.object({ title: z.string().max(160).optional(), description: z.string().max(5000).optional(), visibility: z.enum(['PRIVATE', 'PUBLIC', 'UNLISTED']).optional(), allowDownload: z.boolean().optional(), featured: z.boolean().optional(), folderId: z.string().cuid().nullable().optional(), tagNames: z.array(z.string().max(80)).max(50).optional() });
export const folderSchema = z.object({ id: z.string().cuid().optional(), name: z.string().trim().min(1).max(120), parentId: z.string().cuid().nullable().optional() });
export const tagSchema = z.object({ id: z.string().cuid().optional(), name: z.string().trim().min(1).max(80) });
export const collectionSchema = z.object({ id: z.string().cuid().optional(), name: z.string().trim().min(1).max(160), slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().max(5000).nullable().optional(), visibility: z.enum(['PRIVATE', 'PUBLIC', 'UNLISTED']).optional() });
export const collectionAssignmentSchema = z.object({ fileId: z.string().cuid(), collectionId: z.string().cuid() });
export const shareLinkSchema = z.object({ fileId: z.string().cuid(), expiresAt: z.string().datetime().nullable().optional(), downloadAllowed: z.boolean().default(true) });

const ALLOWED_EXTENSIONS = new Set(['png','jpg','jpeg','webp','gif','svg','mp4','webm','mov','mp3','wav','ogg','m4a','pdf','txt','json','js','ts','jsx','tsx','html','css','lua','py','md','yaml','yml','xml']);
const ALLOWED_MIME_PREFIXES = ['image/','video/','audio/','application/pdf','text/','application/json','application/javascript','application/x-javascript'];
const DANGEROUS_EXTENSIONS = new Set(['exe','bat','cmd','scr','jar','vbs','ps1','sh','dll']);

export function safeName(name: string) { return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180); }
export function extension(name: string) { const idx = name.lastIndexOf('.'); return idx > 0 ? name.slice(idx + 1).toLowerCase() : ''; }
export function normalizeTagName(input: string) { return input.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase().slice(0, 80); }
export function slugify(input: string) { return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120); }
export function isPreviewableMime(mime: string) { const value = mime.toLowerCase(); return ALLOWED_MIME_PREFIXES.some((prefix) => value.startsWith(prefix)); }
export function isAllowedExtension(ext: string) { return ALLOWED_EXTENSIONS.has(ext.toLowerCase()); }

export function validateUpload(file: File, maxUploadBytes: number) {
  const ext = extension(file.name); const mime = (file.type || '').toLowerCase(); const name = safeName(file.name);
  if (file.size <= 0 || file.size > maxUploadBytes) throw new Error('File is too large or empty.');
  if (!isAllowedExtension(ext) || DANGEROUS_EXTENSIONS.has(ext)) throw new Error('Unsupported file type.');
  if (mime && !isPreviewableMime(mime)) throw new Error('Unsupported MIME type.');
  if (!name || name.length < 2) throw new Error('Invalid file name.');
  return { ext, mime, safeName: name };
}

export function validateMagicBytes(buffer: Buffer, mime: string) {
  const signature = buffer.subarray(0, 16).toString('hex'); const value = mime.toLowerCase();
  if (value === 'image/png' && !signature.startsWith('89504e470d0a1a0a')) throw new Error('Invalid PNG signature.');
  if (value === 'image/jpeg' && !signature.startsWith('ffd8ff')) throw new Error('Invalid JPEG signature.');
  if (value === 'image/webp' && !(signature.startsWith('52494646') && buffer.subarray(8, 12).toString() === 'WEBP')) throw new Error('Invalid WebP signature.');
  if (value === 'application/pdf' && !signature.startsWith('25504446')) throw new Error('Invalid PDF signature.');
  if (value === 'audio/mpeg' && !(signature.startsWith('494433') || signature.startsWith('fffb') || signature.startsWith('fff3') || signature.startsWith('fff2'))) throw new Error('Invalid MP3 signature.');
  if (value === 'video/mp4' && !buffer.subarray(4, 8).toString() === 'ftyp') throw new Error('Invalid MP4 signature.');
}
