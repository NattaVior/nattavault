import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const metadataSchema = z.object({
  title: z.string().max(160).optional(),
  description: z.string().max(5000).optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'UNLISTED']).optional(),
  allowDownload: z.boolean().optional(),
  featured: z.boolean().optional(),
  folderId: z.string().optional(),
  tagNames: z.array(z.string()).optional(),
});

const ALLOWED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a', 'pdf',
  'txt', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'lua', 'py', 'md', 'yaml', 'yml', 'xml'
]);

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'application/pdf', 'text/', 'application/json', 'application/javascript', 'application/x-javascript'];

export function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}

export function extension(name: string) {
  const idx = name.lastIndexOf('.');
  return idx > 0 ? name.slice(idx + 1).toLowerCase() : '';
}

export function normalizeTagName(input: string) {
  return input.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase().slice(0, 80);
}

export function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

export function isPreviewableMime(mime: string) {
  const value = mime.toLowerCase();
  return ALLOWED_MIME_PREFIXES.some((prefix) => value.startsWith(prefix) || value === prefix);
}

export function isAllowedExtension(ext: string) {
  return ALLOWED_EXTENSIONS.has(ext.toLowerCase());
}

export function validateUpload(file: File, maxUploadBytes: number) {
  const ext = extension(file.name);
  const mime = (file.type || '').toLowerCase();

  if (file.size <= 0 || file.size > maxUploadBytes) {
    throw new Error('File is too large or empty.');
  }

  if (!isAllowedExtension(ext) && !isPreviewableMime(mime)) {
    throw new Error('Unsupported file type.');
  }

  const dangerousExts = new Set(['exe', 'bat', 'cmd', 'scr', 'js', 'jar', 'vbs', 'ps1', 'sh', 'dll']);
  if (dangerousExts.has(ext)) {
    throw new Error('Executable file types are not allowed.');
  }

  const name = safeName(file.name);
  if (!name || name.length < 2) {
    throw new Error('Invalid file name.');
  }

  return { ext, mime, safeName: name };
}

export function validateMagicBytes(buffer: Buffer, mime: string) {
  if (!buffer || buffer.length < 4) return;
  const signature = buffer.subarray(0, 8).toString('hex');

  if (mime.startsWith('image/png') && signature.slice(0, 8) !== '89504e470d0a1a0a') {
    throw new Error('The uploaded PNG file is invalid.');
  }

  if (mime.startsWith('image/jpeg') && !['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3'].includes(signature.slice(0, 8))) {
    throw new Error('The uploaded JPEG file is invalid.');
  }

  if (mime.startsWith('image/webp') && signature.slice(0, 12) !== '52494646') {
    throw new Error('The uploaded WebP file is invalid.');
  }

  if (mime.startsWith('video/mp4') && !signature.startsWith('0000002066747970')) {
    throw new Error('The uploaded MP4 file is invalid.');
  }

  if (mime.startsWith('audio/mpeg') && !signature.startsWith('fffb') && !signature.startsWith('494433')) {
    throw new Error('The uploaded MP3 file is invalid.');
  }

  if (mime.startsWith('application/pdf') && !signature.startsWith('25504446')) {
    throw new Error('The uploaded PDF file is invalid.');
  }
}
