# NattaVault Security Notes

## Authentication and authorization
Sessions are signed JWTs stored in an httpOnly, Secure-in-production, SameSite=Lax cookie. Every protected request verifies the token and then reloads the user from PostgreSQL, requiring an existing active ADMIN account. JWT role claims are not trusted.

## CSRF
State-changing routes validate the browser `Origin` against `PUBLIC_SITE_URL`; requests without an Origin remain usable for non-browser API clients. SameSite=Lax limits ambient cookie transmission. Deployments should set `PUBLIC_SITE_URL` to the exact canonical origin.

## Rate limiting
Login, uploads, share-link creation, and other signed-access paths use a lightweight process-local limiter. This is a best-effort fallback only; horizontally scaled deployments should replace it with a shared Redis/KV implementation before production.

## Upload and active content security
Uploads use a size limit, allowlisted extensions, MIME checks, sanitized UUID-prefixed keys, SHA-256 checksums, and signatures for PNG, JPEG, WebP, PDF, MP3, and MP4. SVG, HTML, JavaScript, XML, archives, and unsupported binaries are not malware-scanned. Active content is forced to attachment disposition when previewed.

## Storage and deletion
Objects are stored in a private S3-compatible bucket and exposed only through five-minute signed URLs. Normal deletion is a database soft delete so records can be restored. A permanent cleanup job is still required for old soft-deleted records and orphaned objects; it must run with admin credentials and never be public.

## Visibility
PRIVATE files require an active admin session. PUBLIC files are discoverable only when published. UNLISTED files are excluded from public search, collections, and sitemap and should be shared through direct links or share tokens.

Runtime npm, Prisma, TypeScript, ESLint, build, PostgreSQL, and S3 validation were not performed in the static-only audit environment.
