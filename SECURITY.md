# NattaVault security

Protected requests verify a signed session and reload the current user from PostgreSQL; the user must exist, be active, and have the ADMIN role. State-changing browser requests use strict Origin validation with a Referer fallback; cookie-authenticated requests without either header are rejected. SameSite=Lax and httpOnly cookies remain enabled.

Login, uploads, signed previews/downloads, and share-token routes use a process-local rate limiter. It is only a baseline for a single instance; production horizontal deployments must replace it with shared Redis/KV enforcement.

Uploads are size-limited, extension/MIME allowlisted, sanitized, UUID-keyed, checksummed, and signature-checked for PNG, JPEG, WebP, PDF, MP3, and MP4. No malware scanner exists. HTML, JavaScript, SVG, XML, and similar active content are forced to attachment disposition with an octet-stream response type rather than inline execution.

Normal deletion is soft deletion. Admin-only permanent deletion removes the storage object first and then the database row; if storage deletion fails, the database row is retained. Orphan discovery still depends on a provider-specific object listing job and is not exposed publicly.

Public routes only expose PUBLIC, non-deleted files. PRIVATE files require an active admin session; UNLISTED files are excluded from discovery and sitemap. Signed URLs expire after five minutes and are only generated after visibility and permission checks.

Runtime npm, Prisma, TypeScript, ESLint, build, PostgreSQL, and S3 validation are intentionally pending.
