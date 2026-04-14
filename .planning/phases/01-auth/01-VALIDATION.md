---
phase: 1
slug: auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright |
| **Config file** | `playwright.config.ts` — Wave 0 installs |
| **Quick run command** | `npx playwright test --grep @smoke` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Manual browser verification of the changed flow
- **After every plan wave:** `npx playwright test` full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| signup | 01 | 1 | AUTH-01 | e2e smoke | `npx playwright test --grep @auth-signup` | ❌ W0 | ⬜ pending |
| session | 01 | 1 | AUTH-02 | e2e smoke | `npx playwright test --grep @auth-session` | ❌ W0 | ⬜ pending |
| signout | 01 | 1 | AUTH-03 | e2e smoke | `npx playwright test --grep @auth-signout` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/auth.spec.ts` — smoke tests for AUTH-01, AUTH-02, AUTH-03 (tags: @smoke @auth-signup @auth-session @auth-signout)
- [ ] `playwright.config.ts` — base URL, test project config
- [ ] `.env.test.local` — Supabase test credentials
- [ ] Framework install: `npm install --save-dev @playwright/test && npx playwright install chromium`

*Alternative: If Playwright is too heavy for phase 1, manual testing against Vercel preview URL satisfies the phase gate — planner should document manual steps.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session persists across browser close | AUTH-02 | Requires real cookie lifecycle | Close browser tab, reopen app URL, confirm still logged in |
| Redirect after login lands in app | AUTH-01 | UI redirect chain | Sign up, verify redirect to /onboarding or /timeline |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
