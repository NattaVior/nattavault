# NattaVault security

Protected requests verify a signed session and reload the current user from PostgreSQL; the user must exist, be active, and have the ADMIN role. `AUTH_SECRET` is required in production and administrator credentials are supplied only through environment variables.

Login, uploads, signed previews/downloads, and share-token routes use a process-local rate limiter. It is only a baseline for a single instance; production horizontal deployments must replace it with Redis/KV or equivalent shared storage.

Uploads are size-limited, extension/MIME allowlisted, sanitized, UUID-keyed, checksummed, and signature-checked. No malware scanner exists. HTML, JavaScript, XML, and SVG are not trusted as application-origin inline content.

Normal deletion is soft deletion. Admin-only permanent deletion removes the storage object first and then the database row; if storage deletion fails, the database row is retained. Orphan discovery/cleanup is admin-only.

Runtime validation is still pending and must be completed before production deployment.
