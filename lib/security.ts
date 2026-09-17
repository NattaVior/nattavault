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
});

export function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}

export function extension(name: string) {
  const idx = name.lastIndexOf('.');
  return idx > 0 ? name.slice(idx + 1).toLowerCase() : '';
}

export function normalizeTagName(input: string) {
  return input.trim().replace(/^#+/, '').replace(/\s+/g, '-').toLowerCase();
}

export function isPreviewableMime(mime: string) {
  return ['image/', 'video/', 'audio/', 'application/pdf', 'text/', 'application/json', 'application/javascript', 'application/ld+json']
    .some((prefix) => mime.startsWith(prefix) || mime === prefix);
}
