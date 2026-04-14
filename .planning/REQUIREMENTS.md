# Requirements: Agatha

**Defined:** 2026-04-14
**Core Value:** Women can turn a personal health investigation into a shared experiment that generates real-world evidence no clinical trial has captured.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can create an account with email and password
- [ ] **AUTH-02**: User can log in and stay logged in across browser sessions
- [ ] **AUTH-03**: User can log out from any page

### Onboarding

- [ ] **ONBD-01**: User is presented with a branching screener starting with "So, what brings you here?" (9 multi-select options)
- [ ] **ONBD-02**: Screener branches into 5 paths: curious, symptoms, fertility, menopause, complex (fertility + menopause)
- [ ] **ONBD-03**: Fertility and symptoms branches show a conditions multi-select (Adenomyosis, Endometriosis, PCOS, POI, Fibroids, and more)
- [ ] **ONBD-04**: Selecting certain conditions triggers condition-specific follow-up questions (Endo stage, PCOS diagnostic criteria, POI age, Fibroid location, HA period status, RED-S specialist, Adenomyosis diagnosis method)
- [ ] **ONBD-05**: "No diagnosis but suspect something" can combine with diagnosed conditions; "No I haven't" is exclusive
- [ ] **ONBD-06**: Screener ends with a synthesis screen: Claude auto-generates an investigation title and creates the first timeline entry
- [ ] **ONBD-07**: User profile (name, age range, conditions, suspected conditions, investigation question) saved to Supabase

### Timeline & Journal

- [ ] **TIME-01**: User sees a timeline screen as their main screen showing all entry types (voice, written, milestone, research cards)
- [ ] **TIME-02**: User can record a voice note that is transcribed via Web Speech API and sent to Claude for tag extraction (conditions, interventions, symptoms, sentiment, day markers)
- [ ] **TIME-03**: Voice note tags appear as pills below the entry on the timeline
- [ ] **TIME-04**: User can write a text journal entry pinned to the timeline
- [ ] **TIME-05**: Timeline entries show day number of investigation

### Blood Markers

- [ ] **BLDM-01**: User can manually log a blood marker (name, value, unit, test date)
- [ ] **BLDM-02**: User can view all logged blood markers on a dedicated markers screen
- [ ] **BLDM-03**: System automatically calculates HOMA-IR from fasting insulin + fasting glucose (target <1.0, flag >1.5)
- [ ] **BLDM-04**: System automatically calculates Trig/HDL ratio from triglycerides ÷ HDL (target <1.5, flag >2.0)

### Blood Test Recommendations

- [ ] **BLDR-01**: User sees a `/markers/reminders` screen with test recommendations tiered as Overdue → Due → OK → Calculated
- [ ] **BLDR-02**: Tier 1 tests recommended for all users: Full blood count, Vit D, B12, Ferritin, HbA1c, Fasting glucose, Cholesterol panel, Triglycerides
- [ ] **BLDR-03**: Tier 2 tests recommended for users 30+ or with any condition: Fasting insulin, Uric acid, Homocysteine, ALT/AST, hsCRP, ApoB
- [ ] **BLDR-04**: Condition-specific tests added based on profile: Hashimoto's (TSH, Free T3/T4, TPO Abs, Reverse T3), PCOS (Free Testosterone, SHBG, LH/FSH, DHEA-S), Endometriosis (CA-125, hsCRP, Vit D), Autoimmune (ANA, hsCRP, ESR, Complement), Perimenopause (Estradiol, FSH, Progesterone, AMH), Fertility (AMH, FSH day-3, Estradiol day-3)
- [ ] **BLDR-05**: Age-based additions: 40s+ → ApoB, Lp(a) one-time, coronary calcium recommendation; 50s+ → bone turnover markers
- [ ] **BLDR-06**: Journal pattern detection triggers test suggestions: energy crash → fasting insulin + CGM; brain fog + fatigue → thyroid + homocysteine; sugar cravings → HbA1c + fasting insulin + uric acid
- [ ] **BLDR-07**: Medical disclaimer shown on reminders screen: Agatha targets are based on optimisation research, tighter than standard lab ranges, always discuss with doctor

### Research Discovery

- [ ] **DISC-01**: User sees a Discover screen with 3 landing cards (Research, Trials, Experiments)
- [ ] **DISC-02**: User can search PubMed NCBI API for studies matching their investigation; results labelled "auto-matched"
- [ ] **DISC-03**: Curated studies from Agatha's reviewed set appear labelled "Agatha reviewed"
- [ ] **DISC-04**: Research cards can be pinned to the user's timeline
- [ ] **DISC-05**: User can browse ClinicalTrials.gov matched results; links open externally and are labelled as such; Agatha never manages applications

### Overnight Research

- [ ] **NGHT-01**: Vercel Cron job runs at 02:00 UTC daily
- [ ] **NGHT-02**: For each active investigation with a new journal entry in the last 24h: extract condition + intervention (Claude API), query PubMed, create a research card pinned to today labelled "Agatha · overnight research"

### Shared Experiments

- [ ] **EXPR-01**: User can create a shared experiment with title, hypothesis, protocol (what to track, duration, baseline markers), and conditions filter
- [ ] **EXPR-02**: User can join an experiment; Agatha creates a linked investigation using the experiment protocol as starting template
- [ ] **EXPR-03**: Participant data stays in their own investigation; aggregate stats (% with improvement, median change) visible to all participants (anonymised)
- [ ] **EXPR-04**: At experiment end, Claude API drafts a collective finding from all participants' anonymised data
- [ ] **EXPR-05**: Experiment creator can edit and publish the conclusion; published conclusion visible on the experiment card in Discover

### Profile & Settings

- [ ] **PROF-01**: User can view and update their profile (conditions, suspected conditions, muted tests)
- [ ] **PROF-02**: User can mute specific blood test reminders

### PWA & Open Source

- [ ] **PWA-01**: App is installable as PWA on mobile (manifest + service worker via next-pwa)
- [ ] **PWA-02**: Supabase Row Level Security audit — all tables have RLS, users read/write own rows only, experiment participant aggregate data readable by participants (anonymised)
- [ ] **PWA-03**: GDPR-compliant privacy policy and medical disclaimer throughout
- [ ] **OSS-01**: GitHub README and CONTRIBUTING.md published covering: local dev setup, adding blood markers, submitting curated studies, adding conditions to screener
- [ ] **OSS-02**: 3 seed experiments published at launch

## v2 Requirements

### Integrations

- **INT-01**: Apple Health import for blood markers
- **INT-02**: OAuth login (Google, GitHub)
- **INT-03**: Email verification after signup
- **INT-04**: Password reset via email link

### Notifications

- **NOTF-01**: In-app notifications for experiment updates
- **NOTF-02**: Email notifications for experiment conclusions

### Advanced

- **ADV-01**: Multiple investigations per user (currently scoped to one active)
- **ADV-02**: Magic link login
- **ADV-03**: CGM integration suggestions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat | High complexity, not core to investigation value |
| Video posts | Storage/bandwidth costs |
| Mobile native app | Web-first; PWA covers mobile |
| Managing trial applications | Agatha links out only — never manages applications |
| Reproducing full study abstracts | Snippet + PubMed link only (copyright + UX) |
| Medical diagnosis or advice | Not a medical device |
| Symptom checker | Explicitly not the product metaphor |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| ONBD-01 | Phase 2 | Pending |
| ONBD-02 | Phase 2 | Pending |
| ONBD-03 | Phase 2 | Pending |
| ONBD-04 | Phase 2 | Pending |
| ONBD-05 | Phase 2 | Pending |
| ONBD-06 | Phase 2 | Pending |
| ONBD-07 | Phase 2 | Pending |
| TIME-01 | Phase 3 | Pending |
| TIME-02 | Phase 3 | Pending |
| TIME-03 | Phase 3 | Pending |
| TIME-04 | Phase 3 | Pending |
| TIME-05 | Phase 3 | Pending |
| BLDM-01 | Phase 3 | Pending |
| BLDM-02 | Phase 3 | Pending |
| BLDM-03 | Phase 3 | Pending |
| BLDM-04 | Phase 3 | Pending |
| BLDR-01 | Phase 3 | Pending |
| BLDR-02 | Phase 3 | Pending |
| BLDR-03 | Phase 3 | Pending |
| BLDR-04 | Phase 3 | Pending |
| BLDR-05 | Phase 3 | Pending |
| BLDR-06 | Phase 3 | Pending |
| BLDR-07 | Phase 3 | Pending |
| DISC-01 | Phase 4 | Pending |
| DISC-02 | Phase 4 | Pending |
| DISC-03 | Phase 4 | Pending |
| DISC-04 | Phase 4 | Pending |
| DISC-05 | Phase 4 | Pending |
| NGHT-01 | Phase 4 | Pending |
| NGHT-02 | Phase 4 | Pending |
| EXPR-01 | Phase 4 | Pending |
| EXPR-02 | Phase 4 | Pending |
| EXPR-03 | Phase 4 | Pending |
| EXPR-04 | Phase 4 | Pending |
| EXPR-05 | Phase 4 | Pending |
| PROF-01 | Phase 3 | Pending |
| PROF-02 | Phase 3 | Pending |
| PWA-01 | Phase 5 | Pending |
| PWA-02 | Phase 5 | Pending |
| PWA-03 | Phase 5 | Pending |
| OSS-01 | Phase 5 | Pending |
| OSS-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 after initial definition*
