# NattaVault

NattaVault is a production-oriented personal digital archive: a premium public showcase backed by authenticated private file management.

## Features
- PostgreSQL/Prisma relational catalog for files, folders, tags, collections, share links, events, and audit logs.
- Secure signed-session admin authentication, protected by middleware and server-side authorization.
- S3-compatible private object storage abstraction with short-lived signed preview/download URLs.
- Real multipart uploads with size limits, safe storage keys, MIME metadata, and audit logging.
- Public archive, search, file detail pages, responsive gallery, collection-ready data model, and event tracking.
- Security headers, no public storage URLs, private-by-default files, and no execution of uploaded content.

## Local development
Requirements: Node.js 20+, PostgreSQL, and an S3-compatible bucket (AWS S3, Cloudflare R2, MinIO, etc.).

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```
Open http://localhost:3000. Seed credentials use `ADMIN_EMAIL` and `ADMIN_PASSWORD`; replace them before production.

## Environment variables
`DATABASE_URL`, `AUTH_SECRET`, `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optional `MAX_UPLOAD_BYTES`. Leave `STORAGE_ENDPOINT` empty for AWS; set it for R2/MinIO.

## Architecture
Pages and route handlers call application services (`lib/auth`, `lib/storage`, `lib/security`) and Prisma. The storage provider implements upload/delete/existence/signed URLs independently from the database and UI, so another provider can replace it without changing pages. Original files never live in PostgreSQL or the public folder.

## Production checklist
Use a managed PostgreSQL database and private bucket, a long random `AUTH_SECRET`, TLS, restrictive bucket CORS, malware scanning and image/video processing workers appropriate to your threat model, and a reverse proxy rate limit for login/upload endpoints. Run `npm run build` and `npm start` for deployment.

## Current limitations
Uploads are buffered in the route handler and do not yet include resumable multipart transfer, background thumbnail generation, or a full metadata editor UI. The schema and storage boundary are ready for those workers; image previews use the protected signed endpoint and non-image files use type-aware fallback previews.
