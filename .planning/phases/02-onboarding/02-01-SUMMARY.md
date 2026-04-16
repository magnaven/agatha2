---
phase: 02-onboarding
plan: 01
subsystem: ui
tags: [react, nextjs, supabase, playwright, jest, state-machine, onboarding]

# Dependency graph
requires:
  - phase: 01-auth
    provides: Supabase server client, middleware session handling, login/logout actions
provides:
  - Branching health screener at /onboarding (all pre-synthesis steps)
  - Profile guard in (app)/layout.tsx redirecting unboarded users
  - Step logic library (detectBranch, buildStepQueue, toggleCondition)
  - Playwright smoke tests ONBD-01 through ONBD-05
affects: [02-02-synthesis, 03-timeline]

# Tech tracking
tech-stack:
  added: [jest, ts-jest, @types/jest]
  patterns:
    - React useState state machine for multi-step screener
    - Step queue rebuilt on branch detection (brings-you-here advance)
    - onboarding_complete field (not row existence) for profile guard

key-files:
  created:
    - src/lib/onboarding/types.ts
    - src/lib/onboarding/steps.ts
    - src/lib/onboarding/steps.test.ts
    - src/app/(onboarding)/onboarding/page.tsx
    - src/app/(onboarding)/onboarding/layout.tsx
    - jest.config.ts
    - tests/onboarding.spec.ts
  modified:
    - src/app/(app)/layout.tsx
    - src/app/(app)/page.tsx

key-decisions:
  - "Onboarding route placed in own (onboarding) route group — (auth)/layout.tsx would redirect authenticated users to /, causing redirect loop"
  - "Profile guard uses onboarding_complete boolean field — Supabase trigger auto-creates profile row on user creation so row existence check always passes"
  - "buildStepQueue returns full tail including 'conditions'; when advancing from conditions step, strip the 'conditions' prefix to avoid duplicate step"
  - "Jest + ts-jest installed for unit tests on pure step logic; Playwright used for integration/E2E tests of screener flow"

patterns-established:
  - "State machine pattern: stepQueue array + idx pointer; advance() rebuilds queue tail on branching steps"
  - "Profile guard: check onboarding_complete field, not row existence"
  - "Route group isolation: auth-guarded routes that also need authenticated access live in their own route group separate from (auth)"

requirements-completed: [ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05]

# Metrics
duration: 11min
completed: 2026-04-16
---

# Phase 02 Plan 01: Onboarding Screener Summary

**Branching health screener with 5-path state machine (React useState), profile guard using onboarding_complete field, and 6 passing Playwright smoke tests**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-16T13:44:50Z
- **Completed:** 2026-04-16T13:55:57Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Full branching screener at /onboarding: name, age, 9-option brings-you-here, conditions multi-select with exclusivity logic, 7 condition follow-up steps, menopause/complex branch steps, synthesis placeholder
- Step logic library with 100% passing unit tests (16 tests): detectBranch, buildStepQueue, toggleCondition, BRINGS_YOU_HERE_OPTIONS, CONDITIONS_LIST, CONDITION_FOLLOWUPS
- Profile guard in (app)/layout.tsx redirects users with onboarding_complete=false to /onboarding; onboarding layout prevents re-entry if already complete
- All 6 Playwright smoke tests passing (@onbd-01 through @onbd-05)

## Task Commits

Each task was committed atomically:

1. **Task 1: Playwright test scaffold** - `6891b2c` (test)
2. **Task 2: Onboarding types and step config** - `495be51` (feat)
3. **Task 3: Screener component + profile guard** - `c443b86` (feat)

_Note: Task 2 was TDD — test-first approach with RED → GREEN cycle_

## Files Created/Modified

- `src/lib/onboarding/types.ts` — ScreenerState, StepId, BranchPath, AgeRange types
- `src/lib/onboarding/steps.ts` — detectBranch, buildStepQueue, toggleCondition, option lists
- `src/lib/onboarding/steps.test.ts` — 16 unit tests covering all behavior cases
- `src/app/(onboarding)/onboarding/page.tsx` — Full screener Client Component state machine
- `src/app/(onboarding)/onboarding/layout.tsx` — Auth guard + onboarding_complete skip
- `src/app/(app)/layout.tsx` — Added profile guard (onboarding_complete check)
- `src/app/(app)/page.tsx` — Replaced with timeline stub
- `jest.config.ts` — Jest + ts-jest configuration
- `tests/onboarding.spec.ts` — 6 Playwright smoke tests

## Decisions Made

- Used own `(onboarding)` route group — placing at `(auth)/onboarding` caused redirect loop because `(auth)/layout.tsx` redirects all authenticated users to `/`
- Profile guard checks `onboarding_complete` field, not profile row existence — Supabase trigger auto-creates a profile row on every `auth.admin.createUser()` call
- `buildStepQueue` returns full tail including 'conditions' step; advance from conditions step strips the first element to avoid the duplicate

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed Jest + ts-jest for unit tests**
- **Found during:** Task 2 (unit tests for step logic)
- **Issue:** Plan requires `npx jest` but project had no Jest setup (only Playwright)
- **Fix:** `npm install --save-dev jest @types/jest ts-jest` + created `jest.config.ts`
- **Files modified:** package.json, package-lock.json, jest.config.ts
- **Verification:** All 16 unit tests pass
- **Committed in:** 495be51 (Task 2 commit)

**2. [Rule 1 - Bug] Profile guard used wrong check (row existence vs field)**
- **Found during:** Task 3 (Playwright @onbd-01 test failing)
- **Issue:** Supabase DB trigger auto-creates a profiles row on every user creation, so `maybeSingle()` always returns a row — profile guard never redirected to /onboarding
- **Fix:** Changed `.select('id')` to `.select('onboarding_complete')` and checked `!profile?.onboarding_complete` instead of `!profile`
- **Files modified:** src/app/(app)/layout.tsx, src/app/(onboarding)/onboarding/layout.tsx
- **Verification:** @onbd-01 passes — new user redirected to /onboarding after login
- **Committed in:** c443b86 (Task 3 commit)

**3. [Rule 1 - Bug] Onboarding route in (auth) caused redirect loop**
- **Found during:** Task 3 (routing investigation)
- **Issue:** Plan specified `(auth)/onboarding/page.tsx` but `(auth)/layout.tsx` redirects ALL authenticated users to `/`, blocking access to the screener
- **Fix:** Moved to `(onboarding)/onboarding/` route group with its own layout
- **Files modified:** route group structure
- **Verification:** Authenticated users can access /onboarding without being redirected
- **Committed in:** c443b86 (Task 3 commit)

**4. [Rule 1 - Bug] Conditions advance duplicated 'conditions' in step queue**
- **Found during:** Task 3 (@onbd-04 failing)
- **Issue:** `buildStepQueue('fertility', ['endometriosis'])` returns `['conditions', 'followup-endo', 'synthesis']`. When advancing from conditions step, the code appended this full array, creating `[..., 'conditions', 'conditions', 'followup-endo', 'synthesis']` — stuck at double conditions step
- **Fix:** After building queue, strip 'conditions' prefix from the tail when current step is already 'conditions'
- **Files modified:** src/app/(onboarding)/onboarding/page.tsx
- **Verification:** @onbd-04 passes — endometriosis follow-up step shown after conditions
- **Committed in:** c443b86 (Task 3 commit)

---

**Total deviations:** 4 auto-fixed (1 blocking, 3 bugs)
**Impact on plan:** All auto-fixes necessary for correct functionality. No scope creep.

## Issues Encountered

- Test age option click failed with en-dash mismatch ("18-29" vs "18–29") — fixed by clicking first option in `fillInitialSteps` helper instead of text match

## User Setup Required

None — no external service configuration required. Supabase project already configured.

## Next Phase Readiness

- All pre-synthesis screener steps fully functional
- ScreenerState accumulates: name, ageRange, branch, conditions, suspectedConditions, followups
- Plan 02 can import ScreenerState and add the synthesiseInvestigation Server Action
- The synthesis step placeholder at /onboarding renders when stepQueue reaches 'synthesis'
- Profile guard and onboarding guard both ready; plan 02 only needs to add Server Action + set onboarding_complete=true on Supabase after synthesis completes

---
*Phase: 02-onboarding*
*Completed: 2026-04-16*
