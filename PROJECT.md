# Agatha — PROJECT.md
> GSD north star document. Read this before every session.
> Last updated: April 2026 — v2 spec incorporating UX pilot gap analysis

---

## What Agatha is

Agatha is an open source web app that helps women investigate their own health. The core idea: a woman forms a hypothesis, runs it as a structured experiment over time, and shares her findings with others. It is a **citizen science platform for women's health** — not a symptom tracker, not a health dashboard.

The central metaphor is **the investigation**. Every user is a detective building a case file. Journal entries, blood markers, research papers, and community findings are all evidence pinned to a timeline. Agatha's job is to help connect the evidence into a story the user can act on.

**The key differentiator**: Agatha lets users turn a personal investigation into a **shared experiment** that other women can join with their own data. At the end, Agatha drafts a collective finding. This is real-world women's health data that no clinical trial has ever captured.

---

## Live URL

`agatha-psi.vercel.app`

---

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Already deployed on Vercel, server components, API routes |
| Language | TypeScript | Spec already written in TS types, open source contributor clarity |
| Database + Auth | Supabase | Open source Postgres + auth + realtime + storage |
| Deployment | Vercel | Already connected, edge functions for cron jobs |
| Styling | Tailwind CSS + src/index.css design system | Tailwind for utilities, custom CSS for design tokens |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) | Voice note extraction, research matching, conclusion drafting |
| Research | PubMed NCBI API (free, no key required) | 36M peer-reviewed articles, filtered for women's health |
| Trials | ClinicalTrials.gov API v2 | Recruiting trial matching, links out — Agatha never manages applications |
| PWA | next-pwa | Installable on mobile, offline support |

---

## Design system

**File**: src/index.css
**Fonts**: Newsreader (serif, editorial moments) + Manrope (sans, UI)
**Palette**:

```
--primary:           #041b0b   (deep forest green)
--primary-container: #19301E   (dark cards, milestone entries)
--secondary:         #A3B18A   (sage)
--secondary-dark:    #566342   (sage dark)
--accent:            #CCF232   (lime — primary CTA)
--accent-text:       #171e00   (text on lime)
--surface:           #fafaf5
--surface-low:       #f4f4ef
--surface-mid:       #eeeee9
--surface-high:      #e3e3de
--on-surface:        #1a1c19
--on-surface-mid:    #3d4039
--on-surface-low:    #6b6f64
--on-surface-ghost:  #9ea198
```

**Critical design rules**:
- No 1px borders for section separation — tonal background shifts only
- ghost-border only for interactive component edges
- No drop shadows except --shadow-float: 0px 24px 48px rgba(26,28,25,0.06)
- Newsreader for hero headlines, timeline entry titles, large numbers
- Manrope for all UI chrome, labels, buttons, body text
- Lime #CCF232 is the primary action colour

**Navigation**: 3 tabs only — Timeline, Markers, Discover. Profile via avatar in top-right of hero. No 5-tab nav.

---

## Database schema (Supabase)

```sql
profiles (
  id uuid references auth.users primary key,
  name text,
  age_range text,
  onboarding_selections text[],
  conditions text[],
  suspected_conditions text[],
  investigation_question text,
  muted_tests text[],
  data_consent jsonb,
  notification_schedule jsonb,
  created_at timestamptz default now()
)

investigations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles,
  title text,
  hypothesis text,
  conditions text[],
  interventions text[],
  dependent_variables jsonb,
  tracking_variables jsonb,
  safety_confirmed boolean default false,
  started_at timestamptz default now(),
  status text default 'active',
  experiment_id uuid references experiments
)

journal_entries (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid references investigations,
  user_id uuid references profiles,
  entry_type text,
  raw_text text,
  extracted_tags jsonb,
  variable_logs jsonb,
  hypothesis_match_pct integer,
  hypothesis_match_note text,
  community_pattern text,
  day_number integer,
  created_at timestamptz default now()
)

blood_markers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles,
  marker_name text,
  value numeric,
  unit text,
  tested_at date,
  source text default 'manual',
  created_at timestamptz default now()
)

research_cards (
  id uuid primary key default gen_random_uuid(),
  investigation_id uuid references investigations,
  user_id uuid references profiles,
  source text,
  title text,
  abstract_snippet text,
  pubmed_id text,
  study_type text,
  evidence_strength text,
  population text,
  limitations text,
  year integer,
  tags text[],
  pinned_at timestamptz default now()
)

experiments (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles,
  title text,
  hypothesis text,
  protocol jsonb,
  conditions text[],
  interventions text[],
  status text default 'active',
  participant_count integer default 0,
  started_at timestamptz default now(),
  concluded_at timestamptz,
  agatha_draft_conclusion text,
  published_conclusion text,
  community_insights jsonb
)

experiment_participants (
  experiment_id uuid references experiments,
  user_id uuid references profiles,
  investigation_id uuid references investigations,
  joined_at timestamptz default now(),
  primary key (experiment_id, user_id)
)
```

RLS enabled on every table. Users read/write own rows only. Experiment participant updates readable by co-participants (anonymised).

---

## Application routes

```
/                              -> redirect to /onboarding or /timeline
/onboarding/consent            -> data consent + privacy (MUST come before screener)
/onboarding/screener           -> branching questions
/onboarding/hypothesis         -> investigation question + Agatha follow-up
/onboarding/variables          -> define what to track (interventions + measures)
/onboarding/safety             -> safety confirmation checklist
/onboarding/synthesis          -> Agatha frames investigation, typewriter reveal
/timeline                      -> main screen, investigation spine
/timeline/entry/[id]           -> entry detail + insight thread + hypothesis match
/timeline/investigation/builder -> investigation builder (within Timeline tab)
/markers                       -> blood markers + Agatha target ranges
/markers/reminders             -> recommendation engine
/discover                      -> landing cards for 3 sections
/discover/research             -> PubMed + curated studies
/discover/trials               -> ClinicalTrials.gov + discussion guide
/discover/experiments          -> shared experiments + community insights
/discover/experiments/[id]     -> individual experiment
/discover/experiments/new      -> create experiment
/profile                       -> settings, data export, notifications, emergency resources
```

---

## Feature specs

### 1. Data consent screen — CRITICAL, must come first

Route: /onboarding/consent

Required before any data is collected. GDPR compliance + user trust.

Contents:
- Local encryption notice
- Community insights opt-in (anonymous aggregation for PCOS, Hashimoto's, Endometriosis research)
- Sensitive category opt-in (extra confirmation for fertility + mental health data)
- Link to privacy policy

Saved to: profiles.data_consent jsonb with timestamp.

### 2. Branching screener

Route: /onboarding/screener

Entry question: "So, what brings you here?" — 9 multi-select options.

Branches:
- curious: 1 follow-up, light path
- symptoms: describe + diagnosis status
- fertility: age range, timing (age-conditional), conditions
- menopause: symptom multi-select + HRT status
- complex (fertility + menopause): priority question

Conditions question: 16 options multi-select. Condition-specific follow-ups (Endometriosis stage, PCOS criteria, POI age at dx, Fibroids location, HA period status, RED-S specialist, Adenomyosis diagnosis method). "No diagnosis but suspect" combines. "No I haven't" exclusive.

### 3. Hypothesis formation

Route: /onboarding/hypothesis

"What do you want to investigate?" — open text + voice.
Agatha asks 1-2 clarifying follow-ups (baseline marker? duration?).
Output: investigation title + tags.

### 4. Variables and measures — MISSING, ADD TO PHASE 2

Route: /onboarding/variables

Scientific structure of the investigation. Without it, logging is unstructured journaling.

Independent variables: interventions being tested (e.g. gluten-free diet, selenium 200mcg)
Dependent variables: what is being measured
  - Blood markers with frequency (e.g. TPO Antibodies, Day 0 and Day 30)
  - Symptom scales (e.g. Fatigue Level 1-10, daily at 8pm)
  - Custom measures

Tracking reminders: push notification time for daily logs.

Saved to: investigations.dependent_variables and investigations.tracking_variables jsonb.

### 5. Safety confirmation — ADD TO PHASE 2

Route: /onboarding/safety

Before investigation activates, user confirms:
- Discussed with primary care clinician (or acknowledges they have not)
- Intervention is reversible
- Protocol is feasible within routine and budget

Not a hard blocker. Saved to: investigations.safety_confirmed boolean.

### 6. Voice journaling

1. User taps Add to investigation FAB
2. Web Speech API records + transcribes
3. Claude API extracts: conditions, interventions, symptoms, sentiment, day markers, variable values
4. Tags displayed as pills
5. Structured variable logs saved to journal_entries.variable_logs
6. Entry pinned to timeline

### 7. Entry detail and insight thread — MISSING, ADD TO PHASE 3

Route: /timeline/entry/[id]

Tapping any entry opens detail view showing:

Hypothesis match:
- Percentage (0-100%) from Agatha pattern detection
- Plain language: e.g. "75% confidence — Morning fatigue correlates with Myo-Inositol timing"
- Cross-references all entries in investigation

Community pattern:
- Matching pattern from anonymised community data
- e.g. "12% of users in similar investigations report morning joint stiffness with poor sleep"

Edit history: previous versions if edited.

Actions: pin as evidence, link to research card, share to experiment.

### 8. Blood test recommendation engine

File: src/lib/bloodTestRecommendations.ts

Tier 1 (every user): Full blood count, Vit D (target 50-80 ng/mL), B12, Ferritin (target 50-150), HbA1c (target below 5.4%), Fasting glucose (target below 90 mg/dL), Cholesterol panel, Triglycerides (target below 100 mg/dL).

Tier 2 (Attia framework, 30s+, all conditions): Fasting insulin (target below 6 uIU/mL), Uric acid (target 2-3, flag above 5), Homocysteine (target below 10 umol/L), ALT/AST (target below 20 U/L), hsCRP (target below 1.0 mg/L), ApoB.

Calculated: HOMA-IR = (fasting insulin x fasting glucose) / 405. Trig/HDL ratio = triglycerides / HDL.

Condition additions:
- Hashimoto's: TSH (90d target 0.5-2.0), Free T3/T4 (90d), TPO Abs (180d), Reverse T3 (180d) + Tier 2
- PCOS: Free Testosterone (180d), SHBG (180d), LH/FSH ratio (180d), Fasting insulin HIGH PRIORITY (90d), DHEA-S (365d)
- Endometriosis: CA-125 (365d), hsCRP (180d), Vit D (90d)
- Autoimmune: ANA (365d), hsCRP (180d), ESR (180d), Complement C3/C4 (365d)
- Perimenopause: Estradiol (90d), FSH (90d), Progesterone day-21 (90d), AMH (365d) + Tier 2
- Fertility: AMH (365d), FSH day-3 (180d), Estradiol day-3 (180d), Fasting insulin

Age additions: 40s+ ApoB, Lp(a) one-time, coronary calcium score. 50s+ bone turnover markers.

Journal pattern detection (last 14 entries):
- energy crash / tired after eating / afternoon slump -> fasting insulin + CGM
- brain fog / cant concentrate + fatigue -> thyroid panel + homocysteine
- sugar craving / need sugar -> HbA1c + fasting insulin + uric acid

Disclaimer on /markers/reminders: "Agatha's targets are based on optimisation research, not just disease prevention. They are often tighter than standard lab reference ranges. Always discuss with your doctor."

### 9. Research cards — enhanced, UPDATE PHASE 4

Each card must show:
- Source: curated (Agatha reviewed) or PubMed (auto-matched)
- Study type: RCT, systematic review, or observational
- Evidence strength: High, Moderate, or Low
- Population: e.g. 142 women stages I-IV
- Limitations: plain language
- Link to investigation button: pins study to timeline as evidence

Saved to: research_cards.evidence_strength, population, limitations.

### 10. Community insights — enhanced, UPDATE PHASE 4

Aggregated community findings beyond just join experiments:

High confidence insights: e.g. "Users tracking 2000mg+ daily report 34% reduction in afternoon fatigue after week 3" — n=450, last 30 days.
What helped / did not — filterable by symptom (Brain Fog, Pain, Sleep, Energy etc).
Per intervention: % helpful vs mixed vs unhelpful.
Bias warnings: e.g. "High variance in dosage and timing among reporters."

Data source: journal_entries.variable_logs aggregated across users with data_consent.community_insights = true.
Saved to: experiments.community_insights jsonb.

### 11. Clinical trials discussion guide — ADD TO PHASE 4

Each trial listing includes collapsible discussion guide:
- Will this trial interfere with my current medications?
- What are the potential side effects of the intervention?
- How will my personal data be protected and shared?

### 12. Overnight research processing

Vercel Cron job at 02:00 UTC daily.

For each active investigation with new journal entry in last 24h:
1. Extract condition + intervention via Claude API
2. Query PubMed NCBI API (women's health filter, last 10 years, RCTs first)
3. Check curated research table
4. Create research_cards record pinned to today
5. Appears next morning as "Agatha overnight research"

PubMed: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/ — no key, 3 req/sec limit, cache aggressively.

### 13. Shared experiments

Create: title, hypothesis, protocol, conditions filter.
Join: linked investigation created from protocol template.
Participant data: stays in own investigation. Aggregate stats visible to all.
Conclusion: Claude API drafts, creator edits, publishes to Discover.

### 14. Profile screen — MISSING, ADD TO PHASE 5

Route: /profile
Entry: avatar top-right of timeline hero — not a bottom nav tab.

Data export:
- PDF (doctor-friendly: investigation title, hypothesis, timeline, markers, research, conclusion)
- CSV (raw data)

Notification schedule:
- Daily tracking reminder time (default 8:00 AM)
- Weekly insights summary (default Sunday)

Conditions and profile: edit conditions, age range, investigation focus, mute blood test reminders.

Medical disclaimer (always visible): "Agatha is an investigation tool, not a diagnostic platform. Always consult your healthcare provider before making medical decisions."

Support and safety:
- Support centre link
- Emergency resources (crisis helplines for eating disorders, mental health)
- Sign out

Account: delete account + all data (GDPR right to erasure).

### 15. Investigation builder — within Timeline tab

Route: /timeline/investigation/builder
Entry: button within Timeline — not a separate nav tab.

Allows:
- Edit hypothesis and title
- Add or modify tracking variables
- Set reminder times
- View current protocol
- Start new investigation when previous is complete

---

## Implementation phases

### Phase 1 — Foundation — COMPLETE
- Next.js 14 + TypeScript + Tailwind
- Supabase auth + schema
- Login / signup
- Protected routes

### Phase 2 — Onboarding — IN PROGRESS
- Data consent screen (ADD — must come first)
- Branching screener (built)
- Hypothesis formation (built)
- Variables and measures screen (ADD)
- Safety confirmation checklist (ADD)
- Synthesis + first investigation creation

### Phase 3 — Core app — LinkedIn milestone
- Timeline screen (all entry types)
- Voice journaling (Web Speech API + Claude extraction)
- Entry detail + insight thread with hypothesis match percentage (ADD)
- Weekly/monthly chart view on home (ADD)
- Profile avatar in hero -> /profile stub (ADD)
- Blood markers screen + manual entry
- bloodTestRecommendations.ts
- /markers/reminders
- HOMA-IR + Trig/HDL auto-calculation
- Journal pattern detection

### Phase 4 — Discover + experiments
- Discover screen with 3 landing cards
- PubMed search + enhanced research cards (evidence strength, population, limitations, link to investigation)
- ClinicalTrials.gov API + discussion guide (ADD)
- Community insights aggregation with confidence ratings + bias warnings (ADD)
- Experiment create, join, participant timeline
- Overnight research Vercel Cron job
- Conclusion generation

### Phase 5 — Profile + polish + launch
- Profile screen: data export PDF/CSV, notifications, emergency resources, delete account (ADD)
- Investigation builder flow within Timeline
- PWA setup
- Mobile responsive audit
- GDPR + privacy policy
- RLS audit
- GitHub README + CONTRIBUTING.md
- Seed 3 real experiments for launch

---

## Open source

Licence: MIT

CONTRIBUTING.md should cover:
- Run locally (Next.js + Supabase local dev)
- Add a blood marker to the recommendation engine
- Submit a curated research study
- Add a condition to the onboarding screener

bloodTestRecommendations.ts is the primary open source contribution target.

---

## Critical constraints

- Never use 1px borders for section separation
- Never hardcode Anthropic API key
- Always show data consent screen before collecting any data
- Always use Supabase RLS
- Always show medical disclaimer on blood test recommendations and profile screen
- Always label PubMed results as auto-matched and curated as Agatha reviewed
- Always label ClinicalTrials links as opening externally
- Always show evidence strength, population, limitations on research cards
- Always show bias warnings on community aggregated insights
- Never reproduce more than a snippet of a study abstract
- PubMed: cache aggressively, 3 req/sec limit
- Voice: test mobile Safari early
- Data export PDF/CSV: must be usable by doctors

---

## What Agatha is not

- Not a medical device
- Not a symptom checker
- Not a replacement for medical advice
- Not a clinical trial platform
- Not managing user applications to external trials

---

Last updated: April 2026 v2
Stack: Next.js 14, TypeScript, Supabase, Vercel, Claude API
