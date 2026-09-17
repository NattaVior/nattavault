# NattaVault

NattaVault is a personal digital archive with a curated public portfolio and a protected asset manager.

## What is implemented
- Next.js 14 App Router, TypeScript, Prisma/PostgreSQL, and S3-compatible private storage.
- Public archive, server-side search, public collections, visibility-aware file pages, signed previews/downloads, sitemap and robots rules.
- Protected admin dashboard, paginated file manager, metadata editor, upload flow, folder/tag/collection APIs and admin views, analytics, storage overview, activity logs, and cryptographically random share links.
- Relational file organization with folders, tags, collections, events, audit records, and expiring shares.

## Local setup
```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Required services are PostgreSQL and a private S3-compatible bucket (AWS S3, Cloudflare R2, MinIO, or equivalent). Configure `DATABASE_URL`, `AUTH_SECRET`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, and optionally `STORAGE_ENDPOINT`; also set `PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `MAX_UPLOAD_BYTES`.

## Security notes
Files are private by default, object URLs are never stored in public pages, and preview/download routes authorize private access before issuing five-minute signed URLs. Uploads use generated storage keys and sanitized names, with configurable size limits. Keep the bucket private, use TLS, rotate credentials, and add malware scanning/image processing in production for untrusted uploads.

## Admin routes
- `/admin` dashboard
- `/admin/files` paginated manager and `/admin/files/[id]` metadata editor
- `/admin/upload`, `/admin/folders`, `/admin/tags`, `/admin/collections`
- `/admin/analytics`, `/admin/activity`, `/admin/storage`

## Limitations requiring infrastructure
The upload endpoint buffers each request in the Next.js process. For very large assets, add a multipart direct-to-S3 flow using the same storage boundary. Thumbnail generation is intentionally graceful: browser-compatible previews use signed originals; production deployments should add an image/video/PDF worker (Sharp/FFmpeg/Poppler) and persist thumbnail keys.
