---
phase: 02-onboarding
plan: "02"
subsystem: onboarding
tags: [anthropic, claude-api, supabase, typewriter, server-action, tdd, web-speech-api]

# Dependency graph
requires:
  - phase: 02-onboarding-01
    provides: Screener component, ScreenerState types, step queue, profile guard, onboarding route

provides:
  - synthesiseInvestigation Server Action (Claude API call + 3 Supabase writes)
  - Synthesis screen with typewriter title reveal and Begin my investigation CTA
  - Hypothesis step (free-text investigation question with Web Speech API mic)
  - Profiles row written with onboarding_complete=true on synthesis
  - Investigations row written on synthesis with active status
  - Journal milestone entry written on synthesis (day_number=1)
  - Full onboarding loop: screener → hypothesis → synthesis → app (no redirect back)

affects: [03-timeline, 04-journal, 05-insights, any phase reading profiles or investigations table]

# Tech tracking
tech-stack:
  added:
    - "@anthropic-ai/sdk — Claude API client for investigation title generation"
    - "@types/dom-speech-recognition — type-safe Web Speech API"
  patterns:
    - "Server Action calling Claude API then writing multiple Supabase rows sequentially"
    - "useTypewriter hook (inline, no external library) — 40ms/char interval, clears on new text"
    - "synthesisState (idle/loading/done) triad for async UI transitions"
    - "window.location.href=/ to force full reload and re-run profile guard after onboarding"
    - "Error fallback title ('My health investigation') so API failure never blocks onboarding"
    - "TDD (RED → GREEN) for Server Action unit tests with mock supabase + mock anthropic"

key-files:
  created:
    - src/lib/onboarding/actions.ts
    - src/lib/onboarding/actions.test.ts
  modified:
    - src/app/(onboarding)/onboarding/page.tsx
    - src/lib/onboarding/steps.ts
    - src/lib/onboarding/types.ts
    - package.json
    - package-lock.json

key-decisions:
  - "onboarding_complete=true set in profiles upsert inside synthesiseInvestigation — without it profile guard always redirects back to /onboarding"
  - "window.location.href=/ used over router.push to force full page reload so (app)/layout.tsx profile guard re-runs and confirms profile exists"
  - "Hypothesis step added before synthesis to capture user's own investigation question in their own words — feeds into Claude prompt as primary signal"
  - "Web Speech API mic integrated into hypothesis step for voice input without server audio upload"
  - "Error fallback title 'My health investigation' ensures synthesis failure never blocks user completing onboarding"
  - "Claude model claude-sonnet-4-20250514 with max_tokens=100 — small budget sufficient for 6-12 word title"

patterns-established:
  - "Server Action pattern: 'use server' module, createClient(), getUser() auth check, then sequential Supabase writes"
  - "Typewriter hook pattern: useTypewriter(text, delay) returns displayed string; CTA gated on displayedTitle.length === investigationTitle?.length"
  - "Synthesis step triad: idle (nothing rendered) → loading (thinking animation) → done (typewriter reveal)"

requirements-completed: [ONBD-06, ONBD-07]

# Metrics
duration: 65min
completed: 2026-04-17
---

# Phase 02 Plan 02: Synthesis Summary

**Claude-powered investigation title generation with typewriter reveal, hypothesis step, and three-table Supabase write on completion of the onboarding screener**

## Performance

- **Duration:** ~65 min
- **Started:** 2026-04-17T05:00:00Z (approximate)
- **Completed:** 2026-04-17T07:13:54Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 7

## Accomplishments

- synthesiseInvestigation Server Action calls Claude claude-sonnet-4-20250514 to produce a 6-12 word personalised investigation title, then writes profiles upsert (with onboarding_complete=true), investigations insert, and journal_entries milestone insert in a single server-side flow
- Synthesis screen renders "Agatha is thinking…" loading state then reveals the title character-by-character via a custom useTypewriter hook at 40ms/char; the "Begin my investigation" CTA only appears after the full title is displayed
- Hypothesis step added before synthesis captures the user's own investigation question via textarea and Web Speech API voice input; the answer feeds into the Claude prompt as the primary signal for title generation
- Full navigation loop confirmed: login → /onboarding → hypothesis → synthesis → / → refresh → stays at / (profile guard allows through because onboarding_complete=true)

## Task Commits

Each task was committed atomically:

1. **Task 1: synthesiseInvestigation Server Action** - `999d032` (feat, TDD)
2. **Task 1 fix: set onboarding_complete=true in profiles upsert** - `e91ff38` (fix)
3. **Task 2: Synthesis screen with typewriter reveal** - `76a5c44` (feat)
4. **Task 2 post-checkpoint: Add hypothesis step before synthesis** - `c19a2c2` (feat)

## Files Created/Modified

- `src/lib/onboarding/actions.ts` — synthesiseInvestigation Server Action: Claude call + profiles upsert + investigations insert + journal_entries milestone insert
- `src/lib/onboarding/actions.test.ts` — 6 unit tests (TDD RED→GREEN): auth check, title return, profiles upsert fields, investigations insert, journal_entries insert
- `src/app/(onboarding)/onboarding/page.tsx` — useTypewriter hook, synthesisState triad, synthesis step UI (loading/done), hypothesis step with Web Speech API mic, synthesiseInvestigation wiring
- `src/lib/onboarding/steps.ts` — hypothesis StepId added to every branch queue before synthesis
- `src/lib/onboarding/types.ts` — hypothesis answer field added to ScreenerState
- `package.json` — @anthropic-ai/sdk and @types/dom-speech-recognition added
- `package-lock.json` — dependency lockfile updated

## Decisions Made

- **onboarding_complete=true in profiles upsert:** Without this flag, the (app)/layout.tsx profile guard always redirects authenticated users back to /onboarding since the guard checks this field. Discovered during human verification and fixed immediately.
- **window.location.href=/ over router.push:** Forces a full page reload so the profile guard server component re-runs and reads the newly-written profile. router.push is client-side and the guard would see stale cache.
- **Hypothesis step before synthesis:** User's own words are the best signal for a personalised investigation title. The free-text question feeds into the Claude prompt as the primary context signal before conditions and other screener answers.
- **Web Speech API (no server audio):** Browser-native voice input with no upload; consistent with the project-level decision recorded in STATE.md.
- **Error fallback title:** synthesiseInvestigation catches Claude API errors and sets 'My health investigation' as fallback title so a transient API error never blocks the user from completing onboarding.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] onboarding_complete not set in profiles upsert**
- **Found during:** Task 2 human verification (post-checkpoint)
- **Issue:** After synthesis, the profiles upsert did not include `onboarding_complete: true`. The (app)/layout.tsx profile guard checks this field to decide whether to redirect to /onboarding. Without it, every app visit after onboarding redirected the user back to the screener.
- **Fix:** Added `onboarding_complete: true` to the upsert payload in synthesiseInvestigation; added a test assertion verifying the field is passed.
- **Files modified:** src/lib/onboarding/actions.ts, src/lib/onboarding/actions.test.ts
- **Verification:** Manual re-test confirmed user stays in app after synthesis. Unit test asserts field presence.
- **Committed in:** e91ff38

**2. [Rule 2 - Missing Critical] Hypothesis step added before synthesis**
- **Found during:** Human verification / post-checkpoint iteration
- **Issue:** Plan specified synthesis directly after follow-up steps. During verification, the flow felt abrupt — Claude had only structured screener answers to work with, missing the user's own framing of their investigation.
- **Fix:** Added 'hypothesis' StepId to steps.ts queue before synthesis; textarea + Web Speech API voice input; answer stored in ScreenerState and passed to synthesis prompt as primary signal. Installed @types/dom-speech-recognition.
- **Files modified:** src/app/(onboarding)/onboarding/page.tsx, src/lib/onboarding/steps.ts, src/lib/onboarding/types.ts, src/lib/onboarding/actions.ts, package.json, package-lock.json
- **Verification:** Human verified the full flow including the hypothesis step; checkpoint approved.
- **Committed in:** c19a2c2

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 missing critical UX)
**Impact on plan:** Both fixes essential for correctness and quality. onboarding_complete fix was a blocking correctness bug. Hypothesis step meaningfully improves the Claude synthesis signal and was approved at human checkpoint.

## Issues Encountered

None beyond the two deviations documented above. The TDD cycle for actions.ts ran cleanly (RED confirmed, GREEN on first implementation). Playwright suite was not run for ONBD-06/07 as those tests require a live Anthropic API key and the full Supabase environment; manual end-to-end verification at the human checkpoint served as the acceptance gate.

## User Setup Required

**External services require manual configuration.**

- **ANTHROPIC_API_KEY** — Required for synthesis. Set in environment (`.env.local` for local dev; Vercel environment variables for production).
  - Source: Anthropic Console → API Keys (https://console.anthropic.com/settings/keys)
  - Verification: `ANTHROPIC_API_KEY=sk-ant-... npx tsx -e "import Anthropic from '@anthropic-ai/sdk'; const a = new Anthropic(); const r = await a.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 10, messages: [{ role: 'user', content: 'hi' }] }); console.log(r.content[0])"`

## Next Phase Readiness

- profiles, investigations, and journal_entries tables all have rows after onboarding — Phase 03 (Timeline) can read investigations by user_id immediately
- investigation_question stored on profile for use in AI features
- onboarding_complete=true means profile guard works correctly — all (app)/ routes accessible after onboarding
- No blockers for Phase 03

## Self-Check: PASSED

- FOUND: .planning/phases/02-onboarding/02-02-SUMMARY.md
- FOUND: commit 999d032 (feat: synthesiseInvestigation Server Action)
- FOUND: commit e91ff38 (fix: onboarding_complete=true)
- FOUND: commit 76a5c44 (feat: synthesis screen typewriter reveal)
- FOUND: commit c19a2c2 (feat: hypothesis step)

---
*Phase: 02-onboarding*
*Completed: 2026-04-17*
