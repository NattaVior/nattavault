# NattaVault

NattaVault is a personal digital archive with a curated public portfolio and a protected private asset manager.

## What is implemented
- Next.js 14 App Router, TypeScript, Prisma/PostgreSQL, and private S3-compatible storage.
- Public archive pages, search, file previews, public collections, visibility-aware file pages, and signed access for protected content.
- Protected admin dashboard, file manager, metadata editor, upload flow, folder and tag management, collection management, analytics, storage overview, activity logs, and share links.
- Relational organization for files, folders, tags, collections, audit events, and share tokens.

## Local setup
```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

You need PostgreSQL and a private S3-compatible bucket (AWS S3, DigitalOcean Spaces, Cloudflare R2, MinIO, or similar). Set the required environment variables in `.env`.

## Required environment variables
- `DATABASE_URL`
- `AUTH_SECRET`
- `STORAGE_ENDPOINT`
- `STORAGE_REGION`
- `STORAGE_BUCKET`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `PUBLIC_SITE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `MAX_UPLOAD_BYTES`

## Security notes
Files are private by default, object URLs are never exposed in the public UI, and private preview/download routes authorize access before issuing signed URLs. Uploads validate size, content type, and a basic file signature check. Keep the storage bucket private, rotate credentials, and add malware scanning or media processing workers in production for untrusted uploads.

## Admin routes
- `/admin`
- `/admin/files`
- `/admin/files/[id]`
- `/admin/upload`
- `/admin/folders`
- `/admin/tags`
- `/admin/collections`
- `/admin/analytics`
- `/admin/activity`
- `/admin/storage`

## Production caveat
The upload route buffers files in the Next.js process. For very large assets, add a direct-to-object-storage multipart flow for better scaling. Thumbnail generation should be handled by a dedicated worker (Sharp/FFmpeg/Poppler) if you need optimized gallery images and document previews in production.
