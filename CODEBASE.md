# Codebase Guide

This document explains how the logbyte codebase is put together: what each
piece does, how data flows through the system, and where to make changes for
common tasks. It assumes no prior knowledge of the project.

## 1. What this project is

logbyte is a small hosted logging service, in two parts:

1. **`apps/web`** — a Next.js app that is both the marketing site and the
   dashboard. It exposes a public HTTP endpoint (`POST /api/logs`) that
   accepts log entries, stores them in MongoDB, and renders a dashboard where
   a signed-in user can view/search/filter the logs sent under their tokens.
2. **`packages/sdk`** — a tiny published npm package (`@logbyte/logger`) that
   applications install so they can call `logger.info(...)` /
   `.warning(...)` / `.error(...)` and have those calls POSTed to the web
   app's ingest endpoint.

In other words: a user signs up on the dashboard, generates a **token** for
an environment (e.g. "staging"), drops that token into their own app via the
SDK, and log lines their app emits show up live on the dashboard.

```
Your app                         logbyte web app                    Browser
──────────                       ────────────────                   ───────
Logbyte SDK  ── POST /api/logs ─▶ apps/web/src/app/api/logs/route.ts
(packages/sdk)   {token, key,       │
 level, message,                    ▼
 meta}                          MongoDB (Log, Token, User)
                                     ▲
                                     │ GET /api/logs?tokenId=...
                                     │
                            apps/web/src/components/dashboard/logs-view.tsx ◀── user views dashboard
```

## 2. Repository layout

This is an npm **workspaces monorepo** (see root [package.json](package.json)):

```
logbyte/
├── package.json              # workspace root: dev/build/test scripts fan out to both packages
├── apps/
│   └── web/                  # Next.js 16 app — marketing site + dashboard + API
│       ├── src/app/          # routes (App Router): pages and API route handlers
│       ├── src/components/   # React components, grouped by area
│       ├── src/lib/          # server-only helpers: db, auth/session, server actions, validation
│       ├── src/models/       # Mongoose schemas (User, Token, Log)
│       └── src/proxy.ts      # Next.js middleware — route protection
└── packages/
    └── sdk/                  # @logbyte/logger — the published client library
        ├── src/               # Logbyte class + types
        └── test/              # vitest unit tests
```

Root-level scripts (run from the repo root):

- `npm run dev` — starts the web app's dev server (`next dev`, workspace `apps/web`).
- `npm run build` — builds the SDK first, then the web app (the web app doesn't
  actually import the SDK at build time today, but this keeps build order
  correct if that changes).
- `npm run test` — runs the SDK's vitest suite. There are currently no tests
  for `apps/web`.

## 3. `packages/sdk` — the `@logbyte/logger` client

This is what end users of logbyte install in *their own* applications. It's
intentionally minimal — no dependencies, works in Node and in browsers
because it's built on `fetch`.

Files:

- [src/types.ts](packages/sdk/src/types.ts) — `LogLevel`, `LogMeta`,
  `LogbyteOptions`, `LogPayload`. `LogMeta` is deliberately loose (object,
  array, string, number, boolean, or null) since callers attach arbitrary
  context to a log.
- [src/client.ts](packages/sdk/src/client.ts) — the `Logbyte` class:
  - Constructor takes `{ token, baseUrl?, onError? }`. `token` is required
    and throws synchronously if missing. `baseUrl` defaults to the hosted
    dashboard (`DEFAULT_BASE_URL`); pass your own if you self-host `apps/web`.
  - `.info(key, message, meta?)`, `.warning(...)`, `.error(...)`, and
    `.log(...)` (an alias for `.info`) — all **fire-and-forget**: they never
    throw into the caller's app. Delivery failures go to `onError`, which
    defaults to `console.warn`.
  - Internally, each call builds a `LogPayload` (adds a `timestamp`) and
    POSTs it as JSON to `${baseUrl}/api/logs`. Any non-2xx response or
    network failure is caught and routed to `onError`.
- [src/index.ts](packages/sdk/src/index.ts) — the public entry point,
  re-exports `Logbyte`, `DEFAULT_BASE_URL`, and the types.
- [test/client.test.ts](packages/sdk/test/client.test.ts) — mocks
  `global.fetch` and asserts on the request that gets built (URL, method,
  body shape) for each log level, plus the missing-`token`/missing-`key`
  error paths.

Build tooling: `tsup` builds both ESM (`dist/index.js`) and CJS
(`dist/index.cjs`) bundles plus type declarations, per
[tsup.config.ts](packages/sdk/tsup.config.ts) and the `exports` map in
[package.json](packages/sdk/package.json). Tests run with `vitest`.

**If you need to change the SDK's public API** (add a method, change
`LogbyteOptions`, etc.), the ingest endpoint at
[apps/web/src/app/api/logs/route.ts](apps/web/src/app/api/logs/route.ts) is
the other half of that contract — its `ingestSchema` (zod) must accept
whatever shape the SDK now sends, and vice versa. There's no shared types
package between them today, so payload shape has to be kept in sync by hand
between `packages/sdk/src/types.ts` and the `ingestSchema`/route.

## 4. `apps/web` — the Next.js app

Built with the Next.js **App Router**, React 19, Tailwind v4, and
shadcn-style UI primitives (Base UI under the hood). Data lives in MongoDB
via Mongoose.

### 4.1 Routing (`src/app/`)

Route groups and pages:

- `src/app/page.tsx` — the public marketing landing page.
- `src/app/(auth)/` — a route group (doesn't affect the URL) sharing
  [layout.tsx](apps/web/src/app/(auth)/layout.tsx) (centered card layout,
  logo, theme toggle):
  - `login/page.tsx` renders [`LoginForm`](apps/web/src/components/auth/login-form.tsx)
  - `signup/page.tsx` renders `SignupForm`
- `src/app/dashboard/` — the authenticated area, guarded by
  [layout.tsx](apps/web/src/app/dashboard/layout.tsx), which calls
  `verifySession()` (redirects to `/login` if not authenticated) and renders
  everything inside [`DashboardShell`](apps/web/src/components/dashboard/shell.tsx):
  - `page.tsx` — bare redirect to `/dashboard/logs` (there's no real
    "overview" page; logs is the default view).
  - `logs/page.tsx` — renders [`LogsView`](apps/web/src/components/dashboard/logs-view.tsx).
  - `tokens/page.tsx` — renders `TokensView`.
- `src/app/api/` — Route Handlers (see §4.4 below).
- `src/proxy.ts` — Next.js middleware (see §4.3).

### 4.2 Data layer (`src/models/`, `src/lib/mongodb.ts`)

Three Mongoose models, one collection each:

- [`User`](apps/web/src/models/User.ts) — `email` (unique, lowercased),
  `passwordHash` (bcrypt). Plus Mongoose's automatic `timestamps`.
- [`Token`](apps/web/src/models/Token.ts) — `userId` (owner), `token` (the
  unique secret string, format `lb_<48 hex chars>`, see
  `generateToken()` in [api/tokens/route.ts](apps/web/src/app/api/tokens/route.ts)),
  `alias` (user-facing label like "staging").
- [`Log`](apps/web/src/models/Log.ts) — `tokenId`, `userId` (denormalized
  from the token at write time, so log queries don't need a join to check
  ownership), `key` (a free-text source/feature label), `level`
  (`info` | `warning` | `error`, exported as `LOG_LEVELS`), `message`,
  `meta` (`Schema.Types.Mixed` — anything JSON-serializable). Indexed on
  `{ tokenId: 1, createdAt: -1 }` for the dashboard's default "most recent
  first" query.

All three follow the same pattern: `models.X ?? model("X", schema)`. This
guards against Next.js's hot-reload re-registering the same Mongoose model
twice in dev, which would otherwise throw.

[`connectToDatabase()`](apps/web/src/lib/mongodb.ts) caches the Mongoose
connection on `global` (again, to survive hot-reload without opening a new
connection per file change) and requires `MONGODB_URI` to be set. Every
DB-touching route/action calls this first.

### 4.3 Auth (`src/lib/session.ts`, `src/lib/dal.ts`, `src/lib/actions/auth.ts`, `src/proxy.ts`)

Auth is cookie-based sessions using signed JWTs — there's no separate
sessions table in the DB; the JWT itself *is* the session.

- [`session.ts`](apps/web/src/lib/session.ts): `createSession(payload)`
  signs a JWT (HS256, via `jose`) containing `{ userId, email }`, valid for 7
  days, and sets it as an `httpOnly`, `sameSite=lax` cookie named
  `logbyte_session`. `getSession()` reads and verifies it back;
  `decryptSession()` returns `null` on any verification failure rather than
  throwing. Requires `SESSION_SECRET` to be set.
- [`dal.ts`](apps/web/src/lib/dal.ts) ("data access layer") wraps that for
  two call sites:
  - `verifySession()` — for **Server Components/layouts**: redirects to
    `/login` if there's no valid session, otherwise returns `{ userId, email }`.
    Wrapped in React's `cache()` so it's only evaluated once per request even
    if called from multiple components.
  - `getOptionalSession()` — for **Route Handlers**: returns `null` instead
    of redirecting (a redirect doesn't make sense inside a JSON API), so
    callers can return a 401 themselves.
- [`proxy.ts`](apps/web/src/proxy.ts) is Next.js middleware (the file is
  named `proxy.ts`/exports a `proxy` function per this Next.js version's
  convention, not `middleware.ts`): it decrypts the session cookie on every
  request matching `/dashboard/:path*`, `/login`, `/signup` and redirects
  unauthenticated users away from `/dashboard/*` and authenticated users away
  from `/login`/`/signup`. This is a fast, no-DB-hit first line of defense;
  route handlers/layouts still re-check via `dal.ts`.
- [`actions/auth.ts`](apps/web/src/lib/actions/auth.ts) — React Server
  Actions (`"use server"`) backing the login/signup forms: `signup()`
  validates with `SignupFormSchema` (zod, in
  [definitions.ts](apps/web/src/lib/definitions.ts)), checks for an existing
  user, hashes the password with `bcrypt`, creates the user, creates a
  session, redirects to `/dashboard/tokens`. `login()` does the equivalent
  password-compare flow and redirects to `/dashboard/logs`. `logout()`
  deletes the cookie and redirects to `/login`. Both forms
  ([`login-form.tsx`](apps/web/src/components/auth/login-form.tsx),
  `signup-form.tsx`) call these via `useActionState`, so field/top-level
  errors round-trip back into the form as plain React state — no client-side
  fetch involved.

**Required environment variables** (put them in `apps/web/.env.local`,
which is gitignored):

| Variable | Used in | Purpose |
|---|---|---|
| `MONGODB_URI` | `lib/mongodb.ts` | Mongo connection string |
| `SESSION_SECRET` | `lib/session.ts` | HMAC secret for signing session JWTs |

### 4.4 API routes (`src/app/api/`)

Three Route Handlers, all under `src/app/api/`:

- **`POST /api/logs`** ([route.ts](apps/web/src/app/api/logs/route.ts)) — the
  SDK's ingest endpoint. Validates the body with a zod `ingestSchema`
  (`token`, `key`, `level`, `message`, optional `meta`/`timestamp`), looks up
  the `Token` by its secret string (not by session — this endpoint is called
  by arbitrary third-party apps, not the logged-in browser), and inserts a
  `Log`. Explicitly sets permissive CORS headers (`Access-Control-Allow-Origin: *`)
  because it must accept requests from any origin the SDK is embedded in;
  also handles `OPTIONS` for the CORS preflight. An unrecognized token
  returns 401; a schema failure returns 400 with the first zod issue's
  message.
- **`GET /api/logs`** (same file) — the dashboard's log-listing endpoint.
  Requires a valid session (`getOptionalSession()`), requires `tokenId` and
  verifies that token belongs to the calling user (401/404 otherwise), then
  supports:
  - `levels` — comma-separated subset of `info,warning,error`.
  - `search` — matched against `key` (regex-escaped **exact**, case-insensitive
    match — deliberately not substring, so searching `test-12` doesn't also
    match `test-123`) OR `message` (regex-escaped substring match).
  - `page` / `pageSize` — pagination, `pageSize` capped at 100
    (`MAX_PAGE_SIZE`).
  Returns `{ logs, total, page, pageSize }`.
- **`GET /api/tokens`** / **`POST /api/tokens`**
  ([route.ts](apps/web/src/app/api/tokens/route.ts)) — list the current
  user's tokens, or create a new one (`{ alias }` validated by zod, token
  string generated as `lb_` + 24 random bytes hex via
  `node:crypto.randomBytes`).
- **`DELETE /api/tokens/[id]`**
  ([route.ts](apps/web/src/app/api/tokens/[id]/route.ts)) — deletes a token
  the user owns, and cascades: also deletes every `Log` with that `tokenId`
  (otherwise they'd be orphaned and unreachable, since all log queries go
  through a token the user owns).

All of these authenticated routes follow the same shape: `getOptionalSession()`
→ 401 if missing → `connectToDatabase()` → do the DB work, scoped by
`userId` → return JSON. If you add a new authenticated API route, follow
this same pattern.

### 4.5 Dashboard UI (`src/components/dashboard/`)

- [`shell.tsx`](apps/web/src/components/dashboard/shell.tsx) —
  `DashboardShell`: the persistent sidebar (logo, nav links, logged-in
  email, theme toggle, logout button) + mobile header, wraps children in
  `TokenProvider`.
- [`token-context.tsx`](apps/web/src/components/dashboard/token-context.tsx)
  — a React Context (`TokenProvider`/`useTokens()`) that owns the list of
  the user's tokens client-side: fetches `/api/tokens` on mount, and exposes
  `createToken`/`deleteToken`/`refresh`. Every dashboard page that needs
  tokens (the tokens page, and the token selector on the logs page) reads
  from this single context instead of each fetching independently — so
  creating/deleting a token in one place updates the other page/component
  immediately without a refetch. All mutations show a `sonner` toast on
  success/failure.
- [`sidebar-nav.tsx`](apps/web/src/components/dashboard/sidebar-nav.tsx) —
  Logs / Tokens nav links, highlights the active one via `usePathname()`.
- [`tokens-view.tsx`](apps/web/src/components/dashboard/tokens-view.tsx) +
  [`token-card.tsx`](apps/web/src/components/dashboard/token-card.tsx) +
  [`create-token-dialog.tsx`](apps/web/src/components/dashboard/create-token-dialog.tsx)
  — the Tokens page: empty state, a card per token (shows/copies the secret,
  deletes), and a dialog form to create a new one (alias input →
  `createToken()` from the context).
- [`logs-view.tsx`](apps/web/src/components/dashboard/logs-view.tsx) — the
  Logs page, all client-side state:
  - Selected token comes from the `?token=` query param (falls back to the
    first token), so the selection is shareable/bookmarkable via URL.
  - Filters: level checkboxes, a search input, pagination (25/page), and an
    "Auto-refresh" switch that polls `GET /api/logs` every 5s
    (`AUTO_REFRESH_MS`) via `setInterval` while enabled.
  - Any filter change resets to page 1.
  - Renders a list of [`LogRow`](apps/web/src/components/dashboard/log-row.tsx)
    (level badge + key + timestamp + message; expandable to show pretty-printed
    `meta` JSON if present).
- [`level-badge.tsx`](apps/web/src/components/dashboard/level-badge.tsx) —
  colored badge for `info`/`warning`/`error`.

### 4.6 Shared UI/lib

- `src/components/ui/` — generic, app-agnostic primitives (button, dialog,
  select, table, tabs, tooltip, etc.), shadcn-style wrappers around
  `@base-ui/react`. These aren't logbyte-specific; treat them as a design
  system layer. `components.json` configures the shadcn CLI if you want to
  add more (`npx shadcn add ...`).
- `src/components/marketing/` — landing-page-only pieces (`site-header`,
  syntax-highlighted `code-block` using `shiki`).
- `src/components/theme-provider.tsx` / `theme-toggle.tsx` — light/dark mode
  via `next-themes`.
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge), the standard
  className-combining helper used everywhere.
- `src/lib/definitions.ts` — zod schemas + the `FormState` type shared by the
  login/signup Server Actions.

## 5. Common tasks — where to make changes

- **Add a field to a log entry** (e.g. a new attribute logs should carry):
  update `LogModel` schema in
  [models/Log.ts](apps/web/src/models/Log.ts), the `ingestSchema` in
  [api/logs/route.ts](apps/web/src/app/api/logs/route.ts) (both the write
  side and the `logs.map(...)` shape returned by `GET`), the `LogEntry` type
  in [log-row.tsx](apps/web/src/components/dashboard/log-row.tsx), and (if
  the SDK should send it) `LogPayload` in
  [packages/sdk/src/types.ts](packages/sdk/src/types.ts) plus
  [client.ts](packages/sdk/src/client.ts)'s `send()`/`dispatch()`.
- **Add a new log level**: extend `LOG_LEVELS` in
  [models/Log.ts](apps/web/src/models/Log.ts) — that constant drives the
  Mongoose enum, the ingest validation, and (via `ALL_LEVELS` in
  [logs-view.tsx](apps/web/src/components/dashboard/logs-view.tsx), which
  should be kept in sync) the filter checkboxes and
  [level-badge.tsx](apps/web/src/components/dashboard/level-badge.tsx)
  color mapping. Also add the corresponding method to the SDK's
  [client.ts](packages/sdk/src/client.ts)/`types.ts`.
- **Add a new authenticated API route**: follow the pattern in §4.4 —
  `getOptionalSession()` first, 401 if null, `connectToDatabase()`, scope
  every query by `session.userId` (directly, or via a token you've already
  verified belongs to that user).
- **Add a new dashboard page**: add a folder under
  `src/app/dashboard/`, add its nav entry to `links` in
  [sidebar-nav.tsx](apps/web/src/components/dashboard/sidebar-nav.tsx). It
  automatically inherits auth protection from
  [dashboard/layout.tsx](apps/web/src/app/dashboard/layout.tsx) and the
  proxy's `/dashboard/:path*` matcher.
- **Change session behavior** (e.g. duration, cookie name): edit
  [lib/session.ts](apps/web/src/lib/session.ts); `SESSION_DURATION_MS` and
  `SESSION_COOKIE` are both defined at the top of that file.
- **Change the SDK's public API**: update
  [packages/sdk/src/client.ts](packages/sdk/src/client.ts) /
  [types.ts](packages/sdk/src/types.ts), add/adjust tests in
  [test/client.test.ts](packages/sdk/test/client.test.ts), and update
  [packages/sdk/README.md](packages/sdk/README.md) — that README is what
  ships to npm and is what users read. Bump the `version` in
  [packages/sdk/package.json](packages/sdk/package.json) before publishing.

## 6. Running things locally

```bash
# from repo root
npm install
```

Create `apps/web/.env.local` with:

```
MONGODB_URI=mongodb://localhost:27017/logbyte   # or an Atlas URI
SESSION_SECRET=some-long-random-string
```

```bash
npm run dev          # starts apps/web on http://localhost:3000
npm run test         # runs packages/sdk's vitest suite
```

To work on the SDK in isolation: `cd packages/sdk && npm run dev` (tsup
watch build) or `npm run test`.

## 7. Notable conventions worth knowing

- **`models.X ?? model("X", schema)`** in every Mongoose model file exists
  specifically to survive Next.js dev hot-reload; don't "simplify" it to a
  plain `model(...)` call.
- **Ownership checks go through the token, not just the user.** Reads/deletes
  of logs/tokens always filter by `{ _id, userId: session.userId }` (or by a
  `tokenId` whose owning token was already verified) — never trust an ID from
  the client without also scoping by the session's `userId`.
- **The ingest endpoint (`POST /api/logs`) is deliberately open (CORS `*`,
  no session check)** — it's authenticated by the token in the request body,
  since it's called from arbitrary third-party apps using the SDK, not from
  this app's own browser session. Don't add a session check there.
- **The SDK never throws into the caller's app.** Any change to
  `Logbyte.info/warning/error/log` must preserve "errors go to `onError`,
  not to the caller's call stack" — that's the whole point of a logging
  client.
- File is `src/proxy.ts`, not the more common `middleware.ts` — this is a
  convention of the Next.js version pinned here (see the note injected into
  [AGENTS.md](apps/web/AGENTS.md): breaking changes vs. older Next.js are
  expected, and `node_modules/next/dist/docs/` is the source of truth over
  prior training data).
