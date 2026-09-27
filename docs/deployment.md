# Deployment

Everything needed to put this app on a server, the problems you will hit, and
the decisions already baked into the repository.

## What ships

One Node process serves the UI and the REST API on port 3000. The production
image is the Next.js standalone server (`apps/api/Dockerfile`) running as the
non-root `node` user with a health check on `/health`.

The image is built by `bun run build` in the container, which has **no `.env`
files** — verified to build without environment variables. All configuration is
read at runtime from the process environment.

## Before you deploy — checklist

1. **Postgres 17** reachable from the app. Set `DATABASE_URL`.
2. **Migrations run before the app starts.** With Compose, the `api` service
   waits for the one-shot `migrate` service to finish successfully. Outside
   Compose, run `bun run db:migrate` against the target database first. The app
   process itself never migrates, so a crash-looping app cannot half-migrate a
   database.
3. **`AUTH_SECRET`** ≥ 32 characters, generated fresh per environment
   (`openssl rand -base64 48`). Changing it signs everyone out.
4. **GitHub OAuth**: add the production callback URL to the OAuth App /
   GitHub App (`https://<host>/api/auth/callback/github`) — the localhost
   one does not carry over. Set `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`, and set
   `AUTH_URL` to the public origin (`https://<host>`). The app refuses to start
   in production without it.
5. **`ADMIN_GITHUB_IDS`** — comma-separated numeric IDs; empty means nobody can
   moderate.
6. **`STORAGE_DIR`** must point at a **persistent volume** (avatars). In the
   compose file it is the `gov-portal-avatars` volume mounted at `/app/storage`.
7. **Persistent HTTPS + proxy headers.** The CSRF origin guard accepts the
   request's own origin resolved from `x-forwarded-host` + `x-forwarded-proto`,
   and rate limiting prefers `cf-connecting-ip` then `x-forwarded-for`. Caddy
   sets these by default; Cloudflare sets `CF-Connecting-IP`. Do not strip them.
8. `WEB_ORIGIN` is only needed for **external** clients (mobile). The bundled UI
   is same-origin. Set it to the public origin anyway if nothing else uses it.
9. `GITHUB_WEBHOOK_SECRET` is optional and the endpoint is inert without it.
   If you enable webhooks, point the repo webhook at
   `https://<host>/webhooks/github` and use a stable hostname (not a quick
   tunnel).
10. `GITHUB_TOKEN` (optional) raises the API rate limit for `sync:github`;
    without it the sync uses the anonymous 60/hour budget.

## Known problems and their fixes

| Problem | Why it happens | Fix (already in repo unless noted) |
|---|---|---|
| UI unstyled, no emblem/fonts in the image | Next standalone does not copy `public/` or `.next/static` | Dockerfile copies both explicitly |
| Migrations unavailable in the runtime image | `drizzle-kit` is a dev dependency and drizzle-orm is bundled into the build | `migrate` build target + `docker compose run --rm migrate` |
| App listens only on localhost | Standalone defaults bind `HOSTNAME` | `HOSTNAME=0.0.0.0` in the image |
| Browser PATCH rejected with 403 after deployment | Origin guard must trust the proxy-resolved own origin | Request-origin + `x-forwarded-*` support in `assertSameOrigin` |
| Everyone shares one rate-limit bucket behind a tunnel | Proxy IPs hide the client | `cf-connecting-ip` → `x-forwarded-for` → `x-real-ip` order in `clientIp` |
| Timestamps show UTC on the server | Server renders dates | All display formatting pinned to `Asia/Kathmandu` (`src/lib/format.ts`) |
| GitHub sign-in fails with a callback URL mismatch | Without `AUTH_URL` the standalone server builds the callback from its own bind address (`0.0.0.0:3000`), and forwarded host headers do not change it | Set `AUTH_URL`; the app refuses to start in production without it |
| Sessions break on HTTP | Auth.js marks cookies secure on HTTPS; `trustHost` is enabled | Terminate TLS at the proxy; do not serve the app over plain HTTP |
| `/health` reports 503 in a healthy container | It checks the database | Correct: the check is a real dependency probe; investigate the DB |
| Rate limits reset on restart | In-memory counters, single instance | Accept for one replica; move to a shared store before scaling out |
| Webhook deliveries fail silently | Ephemeral hostnames (quick tunnels) change | Use the stable production hostname; `sync:github` reconciles gaps |

## Backups

- **Database**: `docker compose exec db pg_dump -U refined refined > backup.sql`
  on a schedule; restore with `psql`.
- **Avatars**: back up the `gov-portal-avatars` volume (or `STORAGE_DIR`).
- Both are needed together; profiles reference avatar keys.

## After deploying

1. `curl https://<host>/health` → `{"status":"ok"}`.
2. Sign in with the admin account, approve one member, confirm the public
   profile appears and a non-public profile returns 404.
3. `bun run sync:github` against production (or wire webhooks) and confirm the
   issues list matches the repository.
4. `docker compose logs api` — startup should log no environment validation
   errors (the app fails fast on bad configuration).
