---
phase: 01-auth
plan: "01"
subsystem: auth
tags: [next.js, supabase, typescript, tailwind, middleware, css]

# Dependency graph
requires: []
provides:
  - Next.js 14 App Router project scaffolded with TypeScript and Tailwind
  - Agatha design system loaded globally via src/app/globals.css
  - Supabase server client (next/headers, async cookies)
  - Supabase browser client (no next/headers)
  - Session-refreshing middleware via getUser() on every request
affects: [02-auth-pages, 03-dashboard, all-subsequent-phases]

# Tech tracking
tech-stack:
  added: [next@14, react@18, react-dom@18, "@supabase/supabase-js", "@supabase/ssr", typescript@5, tailwindcss@4, postcss, autoprefixer]
  patterns:
    - "Two Supabase clients: server.ts (next/headers) and client.ts (browser) — never mix"
    - "Middleware calls getUser() not getSession() for validated token refresh"
    - "app-shell class on body for 430px max-width centered mobile layout"

key-files:
  created:
    - src/app/globals.css
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/lib/supabase/server.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/middleware.ts
    - src/middleware.ts
    - next.config.ts
    - tsconfig.json
    - tailwind.config.ts
    - postcss.config.mjs
    - .gitignore
    - .env.local
  modified:
    - package.json

key-decisions:
  - "Manually scaffolded Next.js (create-next-app conflicted with existing repo files) — installed packages individually"
  - "Removed 'type: commonjs' from package.json — Next.js App Router requires ESM module resolution"
  - "Downgraded TypeScript from 6.x to 5.x — Next.js 14 compatibility"
  - "Used @supabase/ssr createServerClient with async cookies() for Next.js 14 App Router compatibility"

patterns-established:
  - "server.ts: import from next/headers, use await cookies(), export async createClient()"
  - "client.ts: import createBrowserClient only, synchronous createClient(), never import next/headers"
  - "middleware.ts (lib): call getUser() not getSession() — validates token server-side, triggers refresh"
  - "src/middleware.ts: matcher excludes static assets and images"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 8min
completed: 2026-04-15
---

# Phase 1 Plan 01: Next.js Foundation and Supabase Utilities Summary

**Next.js 14 App Router with Agatha design system, dual Supabase clients (server/browser), and session-refreshing getUser() middleware**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-15T05:59:17Z
- **Completed:** 2026-04-15T06:01:21Z
- **Tasks:** 2 of 2
- **Files modified:** 14

## Accomplishments
- Next.js 14 App Router project scaffolded with TypeScript, Tailwind, and PostCSS
- Agatha design system CSS (index.css) copied verbatim to src/app/globals.css — all design tokens, component classes, and Google Fonts import intact
- Two Supabase client utilities created: server.ts (async cookies via next/headers) and client.ts (browser, no next/headers)
- Session middleware wired: every request calls getUser() via updateSession() for validated token refresh
- TypeScript compiles cleanly with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project and install Supabase packages** - `a1b2297` (feat)
2. **Task 2: Create Supabase client utilities and middleware** - `694c37c` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `package.json` - Updated scripts (dev/build/start), removed type:commonjs, added all dependencies
- `next.config.ts` - Minimal Next.js configuration
- `tsconfig.json` - TypeScript config with @/* path alias pointing to src/
- `tailwind.config.ts` - Tailwind for src/app/** content paths
- `postcss.config.mjs` - PostCSS with Tailwind and autoprefixer
- `.gitignore` - Standard Next.js ignores including .env*.local
- `.env.local` - Supabase URL/key placeholders (user must fill in)
- `src/app/globals.css` - Full Agatha design system (1107 lines, verbatim copy of index.css)
- `src/app/layout.tsx` - RootLayout with app-shell body class and Agatha metadata
- `src/app/page.tsx` - Minimal placeholder home page
- `src/lib/supabase/server.ts` - createServerClient with async cookies(), for Server Components and Actions
- `src/lib/supabase/client.ts` - createBrowserClient, for Client Components
- `src/lib/supabase/middleware.ts` - updateSession() calling getUser() for token refresh
- `src/middleware.ts` - Next.js middleware entry point with static asset matcher

## Decisions Made
- Manually scaffolded Next.js because `create-next-app` refused to run in a directory with existing files (.planning/, index.css, README.md). Installed all packages individually — equivalent outcome.
- Removed `"type": "commonjs"` from package.json — Next.js App Router assumes ESM-compatible module resolution; leaving it caused config file issues.
- Downgraded TypeScript from 6.x (latest) to 5.x — Next.js 14 supports TypeScript ^5, and TypeScript 6 introduced breaking changes.
- Used `@supabase/ssr` pattern with `createServerClient`/`createBrowserClient` split — the recommended approach for Next.js App Router session management.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] create-next-app refused to scaffold into existing directory**
- **Found during:** Task 1 (scaffold command)
- **Issue:** `create-next-app` exits with error when target directory has existing files (.planning/, index.css, README.md)
- **Fix:** Installed Next.js, React, Supabase, TypeScript, and Tailwind packages individually. Created all config files (next.config.ts, tsconfig.json, tailwind.config.ts, postcss.config.mjs, .gitignore) manually. Result is equivalent to create-next-app output.
- **Files modified:** package.json, + 5 new config files
- **Verification:** `npx tsc --noEmit` passes. All plan artifact checks pass.
- **Committed in:** a1b2297 (Task 1 commit)

**2. [Rule 3 - Blocking] package.json "type: commonjs" conflicts with Next.js ESM config files**
- **Found during:** Task 1 (config file creation)
- **Issue:** postcss.config.mjs and next.config.ts use ESM syntax; "type": "commonjs" causes module resolution conflicts
- **Fix:** Removed `"type": "commonjs"` from package.json
- **Files modified:** package.json
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** a1b2297 (Task 1 commit)

**3. [Rule 3 - Blocking] TypeScript 6.x incompatible with Next.js 14**
- **Found during:** Task 1 (npm install resolution)
- **Issue:** `npm install typescript` resolved to TypeScript 6.x which has breaking changes vs 5.x
- **Fix:** Ran `npm install --save-dev typescript@5` to pin to 5.x
- **Files modified:** package.json
- **Verification:** `npx tsc --noEmit` passes cleanly
- **Committed in:** a1b2297 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking issues)
**Impact on plan:** All auto-fixes were required for the project to exist and compile. No scope creep — the delivered artifacts exactly match plan requirements.

## Issues Encountered
- create-next-app scaffolding conflict with existing repo files — resolved by manual package installation. All plan success criteria met identically.

## User Setup Required

**External services require manual configuration before running the app.**

The following steps must be completed before `npm run dev` works:

1. Create a Supabase project at https://supabase.com
2. Go to Supabase Dashboard → Settings → API
3. Copy "Project URL" → set as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
4. Copy "anon/public" key → set as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
5. Go to Authentication → Settings → disable "Enable email confirmations" for v1

## Next Phase Readiness
- Next.js 14 App Router project is fully scaffolded and TypeScript-clean
- Agatha design system available globally — all auth pages can use .onboard, .btn--primary, .input-field--dark, etc.
- Both Supabase clients ready for use in auth pages (plan 01-02)
- Middleware intercepts all requests and refreshes sessions automatically
- User must fill in real Supabase credentials in .env.local before testing

---
*Phase: 01-auth*
*Completed: 2026-04-15*
