# gov-portal

A public portal for one open-source project: its open GitHub issues, the approved
member directory, and the profile/moderation flows around it.

One Next.js app serves both the server-rendered UI (`/en`, `/ne`) and the
versioned JSON REST API (`/v1/members`, `/v1/project`, …). The frontend and
backend are separate code boundaries, not separate deployments.

## Stack

| Concern | Choice |
|---|---|
| Runtime | Node 24 LTS (Bun for package management and scripts) |
| Framework | Next.js 16 App Router — pages + route handlers in one app |
| UI | React 19, Tailwind CSS 4, shadcn/ui on Base UI, SWR, react-markdown |
| Database | PostgreSQL 17 |
| ORM | Drizzle ORM + drizzle-kit (plain-SQL migrations) |
| Auth | Auth.js v5 (`next-auth@5` beta) — GitHub OAuth, JWT sessions, no adapter |
| API contract | OpenAPI 3.1 in `packages/api-contract`, generated TypeScript client |
| Runtime validation | Zod 4 in `packages/shared` |
| Tests | Vitest against a real PostgreSQL database |
| Lint/format | Biome |

## Layout

```
apps/api/
  src/app/(site)/[locale]/   UI pages (en/ne): home, project, issues, members, profile, welcome, admin, about
  src/app/v1/                versioned REST route handlers
  src/app/<legacy routes>    temporary compatibility aliases to `/v1`
  src/components/            site chrome and UI primitives
  src/lib/                   i18n dictionaries, client auth helpers
  src/server/                services, repositories, authorization seam, storage, errors
  src/db/                    Drizzle schema + client
  drizzle/                   generated SQL migrations (committed)
  src/scripts/               project init, GitHub sync, dev-session tools
  tests/                     unit + integration tests, test DB bootstrap
packages/api-contract/       canonical OpenAPI description
packages/api-client/         generated API types + browser HTTP client
packages/shared/src/         runtime Zod validation + internal service DTOs
docs/frontend.md             frontend onboarding and verification matrix
scripts/setup.ts             one-command local bootstrap
compose.yaml                 PostgreSQL for development, plus api and migrate services
.github/workflows/ci.yml     Lint, typecheck, tests, build on every PR
```
- **Project conventions.** Branch names, review policy, contribution guidance,
  and documentation standards are in [docs/CONVENTIONS.md](./docs/CONVENTIONS.md).

## Working together (frontend + backend)

One application, one API contract, two code territories.

- **OpenAPI is the HTTP contract.** `packages/api-contract/openapi.yaml` defines
  the public `/v1` surface. `packages/api-client/src/schema.gen.ts` is generated;
  hand-editing it is forbidden. CI lints the description, regenerates the file,
  and rejects drift.
- **Ownership.** Frontend work lives in `apps/api/src/app/(site)/**`,
  `apps/api/src/components/**`, and `apps/api/src/lib/**` (i18n, client helpers).
  Backend work lives in `apps/api/src/app/v1/**`, `apps/api/src/server/**`, and
  `apps/api/src/db/**`. API changes start in `packages/api-contract`. See
  `.github/CODEOWNERS`.
- **Same origin.** UI and API run in one app on one port; no CORS juggling, and
  the session cookie is first-party. `WEB_ORIGIN` remains only as the allowlist
  for future external clients (e.g. mobile).
- **No loopback HTTP from the server.** Server Components and Server Actions
  call `src/server` services in-process. Browser components call `/v1` through
  `@gov-portal/api-client`. Both paths converge on the same service layer.
- **The UI cannot bypass the backend.** Biome rejects presentation imports of
  `src/db`, repositories, authentication, and environment configuration.
- **Real project data.** `bun run setup` initializes `SDOC-Team/devnepal` from
  GitHub and syncs its issues. Member profiles are created only through GitHub
  sign-in; the setup path does not insert fabricated accounts or activity.
- **Contract discipline.** Change OpenAPI first, regenerate the client, then
  implement and test the handler. Additive changes are the default. A breaking
  change needs both teams, a migration note, and a new API version.
- **Review flow.** Short-lived branches, PR into `main`, CI green + 1 review
  required. Backend changes come with tests in `apps/api/tests` that name the
  invariant they protect.

### Branch workflow

`main` is protected: no direct pushes (the owner can bypass for emergencies
only), the `verify` CI check must pass, and one review is required to merge.

```sh
git switch main && git pull --ff-only
git switch -c feat/<topic>
# ... work, then run the local gates before pushing
bun run lint && bun run typecheck && bun run test && bun run build
git push -u origin HEAD
gh pr create --fill
```

Keep branches short-lived and rebase on `main` when it moves. A PR that touches
`packages/api-contract` needs a reviewer from each side. Branches are deleted
automatically after merge.

## Scaffolding the project

From an empty machine to a running portal. Prerequisites:
[Bun](https://bun.sh) ≥ 1.4, Docker (colima works), Git, and the disk space for
the Postgres image (~2 GB the first time).

### 1. Clone and bootstrap

```sh
git clone git@github.com:SDOC-Team/devnepal.git
cd devnepal
bun run setup
```

`bun run setup` is idempotent and does the whole bootstrap:

1. writes `apps/api/.env.local` from `.env.example` with a freshly generated
   `AUTH_SECRET` (never overwrites an existing file)
2. starts PostgreSQL with Docker Compose and waits until it is healthy
3. installs the workspace dependencies with Bun
4. applies the Drizzle migrations
5. verifies `SDOC-Team/devnepal` through the GitHub API, initializes the project
   row, and syncs its real issues

Translations and design assets ship with the repository.

### 2. Create a GitHub OAuth App

The app checks its configuration at startup and refuses to start without
GitHub OAuth credentials, so this step is required even for the public pages.

1. Create an OAuth App at <https://github.com/settings/developers> → **New OAuth App**
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
2. Put the credentials in `apps/api/.env.local`:
   - `AUTH_GITHUB_ID` — the client ID
   - `AUTH_GITHUB_SECRET` — generate a client secret and paste it
3. To get the admin queue, add your numeric GitHub ID to `ADMIN_GITHUB_IDS`
   (`https://api.github.com/users/<login>` → `id`); comma-separate several admins.

Never commit these values; share team development credentials out-of-band. The
provider requests **`read:user` only** — email is never requested or stored.

### 3. Run

```sh
bun run dev          # UI + API on one port → http://localhost:3000/en
```

### 4. Verify the scaffold

| Check | Expected |
|---|---|
| `curl localhost:3000/health` | `{"status":"ok"}` |
| http://localhost:3000/en | home page with the state strip, hero, and project card |
| http://localhost:3000/ne | the same page in Nepali |
| http://localhost:3000/en/issues | the repository's open issues; label filter and search work |
| http://localhost:3000/en/members | approved members only (empty until someone signs in and is approved) |
| `curl 'localhost:3000/v1/project/issues?perPage=2'` | JSON whose `total` matches the repository's open issues |
| `bun run test` | the full Vitest suite passes against `refined_test` |

### 5. Optional: test signed-in screens without repeating OAuth

`bun run dev:session <githubUsername>` mints a real session cookie for an
existing member (sign in once with GitHub to create one), so the profile editor
and admin screens can be tested without repeating the OAuth flow:

```sh
bun run dev:session <your-github-username>
```

The command prints the `authjs.session-token` value and the member's GitHub ID.
Add the cookie in DevTools → Application → Cookies → `http://localhost:3000`,
and put the printed ID in `ADMIN_GITHUB_IDS` (then restart) for admin access.
See [`docs/frontend.md`](docs/frontend.md) for the verification matrix.

### 6. Refresh GitHub issues

Issues are reconciled from the project's public repository over the REST API
(no webhook infrastructure needed yet):

```sh
bun run sync:github      # reconciles issues for the configured active project
```

Set `GITHUB_TOKEN` to lift the anonymous rate limit. GitHub remains the source
of truth; the portal does not insert placeholder issues when the repository has
none.

A signature-verified webhook endpoint (`POST /webhooks/github`) is implemented
and tested — deliveries are deduplicated in an event ledger and applied to the
stored issues. Wiring live delivery (repo webhook or `gh webhook forward`) is
optional and deferred; reconciliation with `sync:github` is the reliable path
until then. Contribution indexing is a later phase.

### Ports

| Service | URL |
|---|---|
| UI + API | http://localhost:3000 (`/en`, `/ne`) |
| PostgreSQL | localhost:5432 — user `refined`, password `refined`, databases `refined` / `refined_test` |

### Troubleshooting

- `docker compose` fails → Docker isn't running: `colima start` (or start Docker Desktop).
- Port 3000 already in use → `lsof -ti :3000 | xargs kill`
- Port 5432 already in use → stop the other Postgres, or change the `db` port
  mapping in `compose.yaml` and `DATABASE_URL` in `apps/api/.env.local` together.
- Reset all local data → `docker compose down -v && bun run setup`

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Auth.js session encryption, ≥ 32 chars |
| `AUTH_GITHUB_ID` | yes | GitHub OAuth App client ID; the app does not start without it |
| `AUTH_GITHUB_SECRET` | yes | GitHub OAuth App client secret; the app does not start without it |
| `ADMIN_GITHUB_IDS` | for admin | Comma-separated admin GitHub numeric IDs (may be empty) |
| `GITHUB_PROJECT_REPOSITORY` | optional | Public GitHub repository that `db:init` indexes; defaults to `SDOC-Team/devnepal` |
| `STORAGE_DIR` | yes | Directory for stored avatars (persistent volume) |
| `WEB_ORIGIN` | external clients | CORS allowlist for non-browser clients (mobile); the UI is same-origin |
| `GITHUB_TOKEN` | optional | Raises the GitHub API rate limit for `sync:github` |
| `GITHUB_WEBHOOK_SECRET` | optional | HMAC secret for `POST /webhooks/github` deliveries (endpoint is inert without it) |
| `TEST_DATABASE_URL` | tests | Separate database used by the test suite |

`.env*` files are gitignored; `.env.example` is the only committed reference.

## Commands

```sh
bun run setup          # one-command local bootstrap (safe to rerun)
bun run dev            # UI + API at http://localhost:3000
bun run build          # production build (standalone output)
bun run start          # production server
bun run test           # Vitest (+ creates and migrates the test database)
bun run typecheck      # tsc --noEmit
bun run lint           # Biome check
bun run format         # Biome format --write
bun run api:lint       # lint packages/api-contract/openapi.yaml
bun run api:generate   # regenerate and format the typed client
bun run api:check      # lint + generate + fail if generated types drift
bun run db:generate    # generate a migration from the Drizzle schema
bun run db:migrate     # apply migrations to DATABASE_URL
bun run db:init        # initialize SDOC-Team/devnepal and sync its GitHub issues
bun run sync:github    # reconcile issues from the project's GitHub repository
bun run dev:session    # mint a dev session cookie for an existing member
```

## REST API

Canonical paths are versioned and have **no trailing slash** (`/v1/members`,
not `/v1/members/`). The old unversioned product routes are compatibility
aliases during migration; new code must not use them.
Success bodies are `{ "member": ... }` / `{ "members": [...] }` /
`{ "project": ... }`; errors are `{ "error": { "code", "message", "details"? } }`.
UI pages live under `/en` and `/ne` and do not collide with these paths.

| Method | Path | Access | Notes |
|---|---|---|---|
| `GET` | `/health` | public | 200 when the database answers |
| `GET` | `/v1/project` | public | The single project + open issue / member counts |
| `GET` | `/v1/project/issues?label=&q=&page=&perPage=` | public | Open issues, newest first |
| `GET` | `/v1/project/issues/labels` | public | Open-issue label counts |
| `GET` | `/v1/project/issues/{number}` | public | Single issue |
| `GET` | `/v1/members` | public | Approved members only, `priority DESC`, `approvedAt DESC` |
| `GET` | `/v1/members/{githubUsername}` | public / owner | Case-insensitive username lookup |
| `GET` | `/v1/members/id/{githubId}` | public / owner | Same member, numeric GitHub ID |
| `GET` | `/avatars/{key}` | public | Stored avatar bytes, immutable cache headers |
| `GET` | `/v1/profile` | authenticated | Own member incl. `id`, `status`, `approvedAt`, plus `isAdmin` |
| `PATCH` | `/v1/profile` | authenticated | Updates the session member only |
| `GET` | `/v1/admin/members?status=` | admin | Moderation queue, optional status filter |
| `PATCH` | `/v1/admin/members/{id}` | admin | `{ status?, priority? }` |
| `GET/POST` | `/api/auth/*` | public | Auth.js endpoints (sign-in, callback, session, sign-out) |

### Visibility rules

- `approved` → public on both member routes.
- `pending`, `rejected`, `hidden` → `404` to everyone except the member
  themselves (who sees their own profile while signed in).
- Public payloads never include the internal UUID, moderation status, priority,
  or approval fields.

### Profile updates

`PATCH /v1/profile` accepts only: `displayName`, `headline`, `affiliation`,
`location`, `bio`, `links`, `skills`. The payload is strict — any other key
(`id`, `githubId`, `githubUsername`, `status`, `priority`, `avatarPath`, …) is
rejected with `400`. The update target is always the authenticated member.

Validation highlights: display name required ≤ 80 chars, no URLs, no control
characters; bio ≤ 400 chars; links ≤ 5, HTTPS only, unique; skills from the
fixed taxonomy in `packages/shared/src/skills.ts`.

## UI

Server-rendered pages under `/en` and `/ne` (English default; `/` redirects to
`/en`): home, project, issues list with label/search filters, issue detail with
sanitized Markdown, member directory, member profiles, own profile editor,
admin moderation, and a how-to-contribute page.

Primary navigation is: How to contribute · Projects · Members · About. Open
issues are reached from the project page and the home page. When a member is
signed in, the header's account menu offers **My profile**, plus **Admin** for
accounts listed in `ADMIN_GITHUB_IDS`.

Styling is Tailwind CSS with the design tokens defined in
`apps/api/src/app/tailwind.css`; UI primitives live in
`apps/api/src/components/ui`. Translations live in `apps/api/src/lib/i18n.ts`.

## Security invariants (tested)

- **Self-write only** — profile writes resolve the target exclusively from the
  session; there is no route or payload that can target another member.
- **Immutables** — UUID, GitHub ID, GitHub username, avatar path, moderation
  fields, and priority are not writable through `/v1/profile`.
- **Admin is env-only** — `ADMIN_GITHUB_IDS`, re-checked per request and in the
  server-rendered admin page.
- **No email** — not requested (OAuth scope `read:user`), no column, never returned.
- **Avatars** — downloaded to `STORAGE_DIR`, capped at 2 MB, magic-byte checked
  (png/jpeg/webp only), stored under a generated UUID key; GitHub URLs are never
  stored or served. If the download fails the member is still created and the
  avatar self-heals on the next login.
- **Issue content** — bodies are stored as-is and rendered through
  `react-markdown` + `rehype-sanitize`; raw HTML is never injected.
- **CSRF** — Auth.js protects its own routes; cookie-authenticated mutations
  additionally reject any request whose `Origin` is neither the app's own origin
  (same-origin UI, proxied or not) nor `WEB_ORIGIN`.
- **Rate limits** — auth routes, the webhook endpoint, and write endpoints are
  limited per client IP (`429` with `Retry-After`). The counters are in-memory,
  which is correct for the single-instance deployment; a shared store would be
  needed before scaling out.
- **Secrets** — only placeholders are committed; `.env*` is gitignored.

## Tests

```sh
bun run test
```

The suite creates `refined_test` if needed, applies migrations, and runs tests
covering: member write isolation and injection attempts, all visibility
states on both member routes, admin approve/reject/hide/priority and non-admin
denials, directory ordering, profile validation, avatar handling, the absence of
an email column, project/issue endpoints and filters, GitHub sync reconciliation
with mocked HTTP, and Auth.js CORS handling. Override the database with
`TEST_DATABASE_URL`.

## Deployment

See [`docs/deployment.md`](docs/deployment.md) for the checklist, known
problems and their fixes, and backups.
