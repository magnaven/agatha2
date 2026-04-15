---
phase: 01-auth
plan: "00"
subsystem: testing
tags: [playwright, e2e, smoke-tests, chromium, auth-tests]

# Dependency graph
requires: []
provides:
  - Playwright test scaffold with 3 smoke tests covering AUTH-01, AUTH-02, AUTH-03
  - playwright.config.ts targeting localhost:3000 with Chromium project
  - tests/auth.spec.ts with @smoke @auth-signup @auth-session @auth-signout tags
  - .env.test.local placeholder for Supabase test credentials
affects: [01-01, 01-02, verification]

# Tech tracking
tech-stack:
  added: ["@playwright/test ^1.59.1", "Chromium browser binary via playwright install"]
  patterns: ["TDD RED phase — tests written before app exists", "grep-based test isolation with @smoke tags", "e2e auth testing against live Supabase"]

key-files:
  created:
    - playwright.config.ts
    - tests/auth.spec.ts
    - .env.test.local
    - package.json
  modified: []

key-decisions:
  - "Playwright e2e tests chosen over unit tests for auth flows — cookies/redirects/network make auth hard to unit test in isolation"
  - "Tests written RED intentionally — app does not exist yet, connection refused is the correct state"
  - "Chromium only for Wave 0 scaffold — cross-browser can be added after auth works"

patterns-established:
  - "Pattern 1: smoke test tagging — @smoke @auth-{feature} enables `npx playwright test --grep @auth-signup` isolation"
  - "Pattern 2: test-first — Wave 0 defines verification criteria before Wave 1 builds implementation"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 1min
completed: 2026-04-15
---

# Phase 1 Plan 00: Auth Test Scaffold Summary

**Playwright e2e smoke tests for email/password signup, session persistence, and signout written RED before Next.js app exists**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-15T05:59:13Z
- **Completed:** 2026-04-15T06:00:59Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Playwright installed with Chromium browser binary and baseURL config targeting localhost:3000
- Three smoke tests created covering all Phase 1 requirements (AUTH-01, AUTH-02, AUTH-03) with grep-isolatable tags
- Tests are intentionally RED — will fail with "connection refused" until plans 01 and 02 complete
- .env.test.local placeholder created and covered by .gitignore pattern `.env*.local`

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Playwright and create config** - `ebcbddb` (chore)
2. **Task 2: Write auth smoke tests** - `b497702` (test)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `playwright.config.ts` - Playwright config with baseURL `http://localhost:3000`, Chromium project, webServer block for `npm run dev`
- `tests/auth.spec.ts` - Three smoke tests: @auth-signup (AUTH-01), @auth-session (AUTH-02), @auth-signout (AUTH-03)
- `.env.test.local` - Placeholder for Supabase test project credentials (gitignored via `.env*.local`)
- `package.json` - npm init output with @playwright/test as devDependency

## Decisions Made
- Playwright e2e tests chosen over unit tests: auth flows involve cookies, redirects, and network calls that are difficult to unit test in isolation. Integration testing against a real Supabase test project is the pragmatic choice.
- Tests intentionally RED for Wave 0: test-first approach (Nyquist compliance) establishes verification criteria before implementation begins.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Before running tests (after plans 01 and 02 complete), fill in `.env.test.local` with Supabase test project credentials:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase Dashboard → Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from same location

## Next Phase Readiness
- Playwright scaffold ready; test commands: `npx playwright test --grep @smoke`
- Tests will turn GREEN after plan 01 (Next.js scaffold) and plan 02 (auth UI + Supabase wiring) complete
- Supabase test project credentials must be added to `.env.test.local` before running tests

## Self-Check: PASSED

- playwright.config.ts: FOUND
- tests/auth.spec.ts: FOUND
- .env.test.local: FOUND
- 01-00-SUMMARY.md: FOUND
- Commit ebcbddb (Task 1): FOUND
- Commit b497702 (Task 2): FOUND

---
*Phase: 01-auth*
*Completed: 2026-04-15*
