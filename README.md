# NattaVault

NattaVault is a personal digital archive with a curated public portfolio and a protected private asset manager.

## First-time setup (development)

1. Install Node.js 20 LTS or newer.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env` and replace the development placeholders.
4. Install and configure PostgreSQL, then set `DATABASE_URL` to the database connection string.
5. Generate Prisma Client and apply the development schema: `npm run db:generate` followed by `npm run db:push`.
6. Seed the development admin and baseline records: `npm run db:seed`.
7. Configure an S3-compatible private bucket and its credentials in `.env`.
8. Start the development server: `npm run dev`.
9. When preparing a deployment, create the production bundle with `npm run build`, then run it with `npm start`.

The seed command requires `ADMIN_EMAIL` and `ADMIN_PASSWORD`; it does not provide insecure fallback credentials. Never use development credentials in production.

## Environment variables

Required variables are documented in `.env.example`: `DATABASE_URL`, `AUTH_SECRET`, `STORAGE_ENDPOINT` (optional for AWS S3, required for non-AWS endpoints), `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `MAX_UPLOAD_BYTES`. None use `NEXT_PUBLIC_`, so server secrets are not bundled for the client.

## Production deployment checklist

- [ ] PostgreSQL is provisioned, reachable, backed up, and migrations/schema changes are managed deliberately.
- [ ] S3-compatible storage is configured with a private bucket and least-privilege credentials.
- [ ] A long random `AUTH_SECRET` is configured through the secret manager.
- [ ] Unique administrator credentials are configured; development defaults are not used.
- [ ] `PUBLIC_SITE_URL` is the canonical HTTPS origin.
- [ ] HTTPS is enforced at the proxy/load balancer.
- [ ] Rate limiting uses shared Redis/KV or equivalent storage for multi-instance deployments.
- [ ] Malware scanning is added if required by the deployment threat model; it is not built in.
- [ ] Database, storage, application logs, error monitoring, and alerting are configured.

## Runtime status

Runtime validation is pending. This repository audit did not run npm, Prisma, TypeScript, ESLint, or the production build.
