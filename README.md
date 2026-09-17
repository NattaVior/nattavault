# NattaVault

NattaVault is a personal digital archive with a curated public portfolio and a protected private asset manager.

## First-time setup (development)

1. Install Node.js 20 LTS or newer.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and replace the placeholder values with real values.
4. Provision PostgreSQL and assign a working connection string to `DATABASE_URL`.
5. Generate Prisma Client and apply the schema: `npm run db:generate` and `npm run db:push`.
6. Seed the initial admin user and required base records: `npm run db:seed`.
7. Configure a private S3-compatible storage bucket and populate the storage variables in `.env`.
8. Start the development server: `npm run dev`.
9. For a production bundle: `npm run build`, then run the app with `npm start`.

Development and production are intentionally separate. Use a unique `AUTH_SECRET`, a real `PUBLIC_SITE_URL`, and real admin credentials in production; never reuse local defaults.

## Required environment variables

The repository documents the required variables in `.env.example`:

- `DATABASE_URL`
- `AUTH_SECRET`
- `STORAGE_ENDPOINT` (optional for direct AWS S3; required for many S3-compatible endpoints)
- `STORAGE_REGION`
- `STORAGE_BUCKET`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `PUBLIC_SITE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `MAX_UPLOAD_BYTES`

No `NEXT_PUBLIC_` secrets are used, so credentials are not exposed to the browser.

## Production checklist

- [ ] PostgreSQL is provisioned and backed up.
- [ ] An S3-compatible private bucket is configured with least-privilege credentials.
- [ ] `AUTH_SECRET` is set to a long random value managed by a secret store.
- [ ] `ADMIN_EMAIL` and `ADMIN_PASSWORD` are unique and not left at development defaults.
- [ ] `PUBLIC_SITE_URL` is the correct HTTPS site origin.
- [ ] HTTPS is enforced at the edge or reverse proxy.
- [ ] The application is behind monitoring and alerting.
- [ ] Shared rate limiting is configured for multi-instance deployments.
- [ ] Malware scanning is added if required by the operational risk model.

## Runtime status

Runtime validation is still pending. This repository audit did not run `npm`, Prisma commands, TypeScript, ESLint, or a production build because the execution environment is unavailable.
