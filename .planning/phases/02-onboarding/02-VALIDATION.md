---
phase: 2
slug: onboarding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.59.x |
| **Config file** | `playwright.config.ts` |
| **Quick run command** | `npx playwright test --grep @smoke` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --grep @smoke`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | ONBD-01 | smoke | `npx playwright test --grep @onbd-01` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | ONBD-01 | smoke | `npx playwright test --grep @onbd-01` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | ONBD-02 | smoke | `npx playwright test --grep @onbd-02` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | ONBD-03 | smoke | `npx playwright test --grep @onbd-03` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | ONBD-04 | smoke | `npx playwright test --grep @onbd-04` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | ONBD-05 | smoke | `npx playwright test --grep @onbd-05` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | ONBD-06 | smoke | `npx playwright test --grep @onbd-06` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | ONBD-07 | smoke | `npx playwright test --grep @onbd-07` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/onboarding.spec.ts` — stubs for ONBD-01 through ONBD-07
- [ ] Reuse Supabase admin client pattern from `tests/auth.spec.ts` for profile assertions (ONBD-07)
- [ ] Test user seeding — fresh authenticated user with no profile row (reuse `createUser`/`deleteUser` pattern from `auth.spec.ts`)

*Existing infrastructure covers Playwright setup; Wave 0 adds the onboarding spec file only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Typewriter effect character-by-character animation | ONBD-06 | Visual timing requires human judgement | Load synthesis screen, verify title appears letter-by-letter with ~40ms delay |
| Step transition animation (opacity/transform) | ONBD-01 | CSS transition timing requires human judgement | Navigate between screener steps, verify smooth animated transitions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
