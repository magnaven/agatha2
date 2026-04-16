# Roadmap: Agatha

## Overview

Agatha ships in five phases that follow the user's natural journey into the product. Phase 1 establishes secure access. Phase 2 gives every user a personal investigation through a branching onboarding flow. Phase 3 builds the daily investigation tools — timeline, voice journaling, blood markers, and test recommendations — that make Agatha useful in a sustained way. Phase 4 adds the community layer: research discovery, overnight AI research, and shared experiments, which is the product's core differentiator. Phase 5 hardens the app for production and open-source launch.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Auth** - Users can create accounts and log in securely
- [ ] **Phase 2: Onboarding** - Users complete a branching health screener and land in their first investigation
- [ ] **Phase 3: Investigation Tools** - Users can journal, track blood markers, and get personalised test recommendations
- [ ] **Phase 4: Discovery and Community** - Users can find research, browse trials, and run shared experiments
- [ ] **Phase 5: Launch Readiness** - App is installable, secure, and open source

## Phase Details

### Phase 1: Auth
**Goal**: Users can securely create and access their accounts
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password and land in the app
  2. User can close the browser, return later, and still be logged in
  3. User can log out from any page and is returned to the login screen
**Plans**: 3 plans

Plans:
- [x] 01-00-PLAN.md — Playwright test scaffold (Wave 0: smoke tests for AUTH-01/02/03)
- [ ] 01-01-PLAN.md — Next.js scaffold, Agatha design system, Supabase clients + middleware
- [ ] 01-02-PLAN.md — Login/signup page, Server Actions, protected app shell, e2e verification

### Phase 2: Onboarding
**Goal**: Every new user completes a branching health screener and arrives with a named investigation
**Depends on**: Phase 1
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05, ONBD-06, ONBD-07
**Success Criteria** (what must be TRUE):
  1. User is greeted with "So, what brings you here?" and can select from 9 options
  2. Selecting fertility or symptoms reveals a conditions multi-select; selecting certain conditions reveals condition-specific follow-up questions
  3. "No diagnosis but suspect something" can stack with diagnosed conditions; "No I haven't" is mutually exclusive
  4. Screener ends with a synthesis screen where Claude has generated an investigation title and created the first timeline entry
  5. User's profile (name, age range, conditions, investigation question) is persisted to Supabase and visible in subsequent sessions
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Screener state machine: types, step config, Client Component (name/age/brings-you-here/conditions/follow-ups), profile guard
- [ ] 02-02-PLAN.md — Claude synthesis Server Action + typewriter reveal + Supabase profile/investigation writes

### Phase 3: Investigation Tools
**Goal**: Users can journal daily, log blood markers, and see personalised test recommendations — making Agatha useful every week
**Depends on**: Phase 2
**Requirements**: TIME-01, TIME-02, TIME-03, TIME-04, TIME-05, BLDM-01, BLDM-02, BLDM-03, BLDM-04, BLDR-01, BLDR-02, BLDR-03, BLDR-04, BLDR-05, BLDR-06, BLDR-07, PROF-01, PROF-02
**Success Criteria** (what must be TRUE):
  1. User sees a timeline showing all entry types (voice, written, milestone, research cards) with day-of-investigation numbers
  2. User can record a voice note; it is transcribed and Claude extracts tags (conditions, symptoms, interventions, sentiment) that appear as pills on the entry
  3. User can log a blood marker manually and see HOMA-IR and Trig/HDL calculated automatically when the required inputs are present
  4. User sees a reminders screen listing personalised test recommendations tiered Overdue → Due → OK → Calculated, with a medical disclaimer
  5. User can view and update their profile conditions and mute specific test reminders
**Plans**: TBD

Plans:
- [ ] 03-01: Timeline screen (all entry types, day numbers, written journal entries)
- [ ] 03-02: Voice journaling (Web Speech API transcription + Claude tag extraction)
- [ ] 03-03: Blood markers screen (manual entry, HOMA-IR and Trig/HDL auto-calculation)
- [ ] 03-04: Blood test recommendations engine (Tier 1/2, condition-specific, age-based, journal pattern detection, disclaimer)
- [ ] 03-05: Profile and settings screen (conditions update, muted reminders)

### Phase 4: Discovery and Community
**Goal**: Users can find relevant research, browse matched clinical trials, and run shared experiments with other women
**Depends on**: Phase 3
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, NGHT-01, NGHT-02, EXPR-01, EXPR-02, EXPR-03, EXPR-04, EXPR-05
**Success Criteria** (what must be TRUE):
  1. User opens the Discover screen and sees three cards: Research, Trials, Experiments
  2. User can search PubMed and see auto-matched results; curated Agatha-reviewed results appear alongside; research cards can be pinned to the timeline
  3. User can browse matched ClinicalTrials.gov results; links open externally and are labelled as such
  4. Overnight Cron runs at 02:00 UTC and pins a new research card to any investigation with a journal entry in the last 24 hours
  5. User can create a shared experiment; other users can join; aggregate anonymised stats are visible; at experiment end Claude drafts a collective finding the creator can edit and publish
**Plans**: TBD

Plans:
- [ ] 04-01: Discover screen (3 landing cards, PubMed search, curated results, pin to timeline)
- [ ] 04-02: ClinicalTrials.gov browsing (matched results, external links, correct labelling)
- [ ] 04-03: Overnight Vercel Cron (02:00 UTC, Claude extraction, PubMed query, research card creation)
- [ ] 04-04: Shared experiments (create/join flow, aggregate stats, Claude conclusion drafting, creator publish)

### Phase 5: Launch Readiness
**Goal**: The app is installable on mobile, fully secured, GDPR-compliant, and publicly open source
**Depends on**: Phase 4
**Requirements**: PWA-01, PWA-02, PWA-03, OSS-01, OSS-02
**Success Criteria** (what must be TRUE):
  1. User can install Agatha as a PWA on iOS and Android and use it from the home screen
  2. All Supabase tables have RLS enabled; users can only read and write their own rows; experiment aggregate data is readable by participants in anonymised form
  3. Medical disclaimer and GDPR-compliant privacy policy are visible at all required points in the app
  4. GitHub README and CONTRIBUTING.md are live; a developer can clone the repo and run Agatha locally following the README
  5. Three seed experiments are published on the live site at launch
**Plans**: TBD

Plans:
- [ ] 05-01: PWA setup (next-pwa manifest and service worker, mobile install testing)
- [ ] 05-02: Supabase RLS audit (all tables, participant aggregate access, GDPR and disclaimer sweep)
- [ ] 05-03: Open source launch (README, CONTRIBUTING.md, seed experiments)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth | 2/3 | In Progress|  |
| 2. Onboarding | 0/2 | Not started | - |
| 3. Investigation Tools | 0/5 | Not started | - |
| 4. Discovery and Community | 0/4 | Not started | - |
| 5. Launch Readiness | 0/3 | Not started | - |

---
*Roadmap created: 2026-04-14*
*Last updated: 2026-04-15 — Phase 1 plan 01-00 completed (Playwright test scaffold)*
