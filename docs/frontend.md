# Frontend development

The UI and backend live in one Next.js application and one deployment, with
separate code boundaries. Pages are under `apps/api/src/app/(site)/`; the
canonical HTTP API is under `apps/api/src/app/v1/` and described by
`packages/api-contract/openapi.yaml`.

Server Components and Server Actions call `apps/api/src/server` services
directly. Client Components that need HTTP use `@gov-portal/api-client` with
`baseUrl: "/v1"`. Presentation code must not import the database, repositories,
Auth.js internals, or environment configuration; the linter enforces this.

## Design

Styling is Tailwind CSS with the design tokens in `apps/api/src/app/tailwind.css`.
UI primitives are in `apps/api/src/components/ui`; reuse them before adding new
ones.

## Run it

Setup, environment variables and GitHub sign-in are described in the
[README](../README.md). The GitHub OAuth App credentials are required: the app
does not start without them.

The setup creates no member accounts, so sign in with GitHub once to create
yours. After that, `bun run dev:session <your-github-username>` prints a session
cookie for that member, so you can test the profile editor and admin screens
without going through GitHub sign-in each time. It does not replace the OAuth
credentials.

## Routes

| URL | Page |
|---|---|
| `/en`, `/ne` | home |
| `/en/project` | the single project (repo header, tabs, sidebar) |
| `/en/issues` | open issues with label + search filters and pagination |
| `/en/issues/{number}` | issue detail with sanitized Markdown |
| `/en/members` | approved member directory with search + skill filter |
| `/en/members/{username}` | public member profile (owner sees non-public states) |
| `/en/profile` | own profile editor (requires session) |
| `/en/welcome` | post-sign-in onboarding: admins land on the admin dashboard, approved members on the home page, and pending/rejected/hidden members see their status |
| `/en/admin` | member moderation (requires `ADMIN_GITHUB_IDS`) |
| `/en/about` | how to contribute |

Default language is English; `/` redirects to `/en`. If the UI needs a new HTTP
shape, change OpenAPI first, run `bun run api:generate`, implement the `/v1`
handler, and request frontend and backend review. Runtime validation remains in
`packages/shared` and must agree with the OpenAPI constraint.

## Verification matrix

| Behaviour | How to verify |
|---|---|
| Directory lists approved members only | a newly signed-in (pending) member is absent from `/en/members` |
| Non-public profile hidden | `/en/members/<pending-username>` → "Profile not available"; with that member's session cookie → visible with a status banner |
| Username + GitHub id parity | `curl /v1/members/<username>` and `curl /v1/members/id/<githubId>` return the same member |
| Issue filters | `/en/issues` → filter by a label (only matching rows), search a word from an issue title or body |
| Issue detail | `/en/issues/<number>` renders labels, author, sanitized Markdown, GitHub link |
| Profile validation | `/en/profile`: empty display name, 6 links, `http://` link, unknown skill → inline errors; save persists |
| Moderation | `/en/admin`: approve a pending member → they appear in `/en/members`; reject → 404 publicly; priority reorders |
| Non-admin denial | sign in without the id in `ADMIN_GITHUB_IDS` → `/en/admin` shows "Not authorized" |
| Bilingual | switch between English and नेपाली in the language menu; paths keep the locale and copy changes |
| Sign in / out | header button completes the GitHub flow; sign-out returns to the page |

## Known gaps (intentional)

- Live webhook delivery is deferred; issues come from `bun run sync:github`
  (a signed webhook endpoint exists and is tested, but nothing is wired to it).
- Contribution indexing and recognition are a later phase.
