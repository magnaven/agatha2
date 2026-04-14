# Agatha

## What This Is

Agatha is an open source web app that helps women investigate their own health. Users form a hypothesis, run it as a structured investigation over time, and share findings with others. It is a **citizen science platform for women's health** — not a symptom tracker, not a health dashboard. The central metaphor is the investigation: every user is a detective building a case file.

## Core Value

Women can turn a personal health investigation into a shared experiment that other women join with their own data — generating real-world women's health evidence that no clinical trial has ever captured.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Branching onboarding screener (5 branch paths, condition follow-ups, Claude synthesis → first investigation)
- [ ] Timeline screen showing all entry types (voice, written, milestones, research cards)
- [ ] Voice journaling via Web Speech API + Claude tag extraction
- [ ] Blood markers screen with manual entry
- [ ] Blood test recommendation engine (`bloodTestRecommendations.ts`) with Tier 1/2/condition/age logic
- [ ] `/markers/reminders` screen (Overdue → Due → OK → Calculated tiers)
- [ ] HOMA-IR + Trig/HDL auto-calculated markers
- [ ] Journal pattern detection (energy crash → insulin, brain fog → thyroid, sugar cravings → HbA1c)
- [ ] Discover screen with 3 landing cards (Research, Trials, Experiments)
- [ ] PubMed NCBI API search + curated study cards
- [ ] ClinicalTrials.gov API v2 matched results (links out only)
- [ ] Shared experiment create/join flow
- [ ] Overnight Vercel Cron research processing (02:00 UTC daily)
- [ ] Claude API collective conclusion drafting for experiments
- [ ] PWA setup (manifest + service worker)
- [ ] Supabase Row Level Security audit
- [ ] Open source launch (GitHub README + CONTRIBUTING.md + seed experiments)

### Out of Scope

- Real-time chat — high complexity, not core to community value
- Video posts — storage/bandwidth costs, defer to v2+
- OAuth login — email/password sufficient for v1
- Mobile native app — web-first (PWA covers mobile)
- Managing user applications to clinical trials — Agatha links out only
- Reproducing full study abstracts — snippet + PubMed link only
- Medical diagnosis or advice — Agatha is not a medical device

## Context

- **Live URL**: agatha-psi.vercel.app (deployed on Vercel, connected)
- **Stack**: Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth + Realtime + Storage) · Tailwind CSS · Claude API (`claude-sonnet-4-20250514`) · PubMed NCBI API · ClinicalTrials.gov API v2 · next-pwa
- **Design system**: `src/index.css` — Newsreader (serif) + Manrope (sans), deep forest green primary, lime accent (#CCF232), tonal background shifts (no 1px borders)
- **Database**: Full schema defined (profiles, investigations, journal_entries, blood_markers, research_cards, experiments, experiment_participants)
- **AI role**: Onboarding synthesis, voice tag extraction, overnight research matching, experiment conclusion drafting
- **Open source**: MIT licence, contribution targets = blood marker engine + curated research + condition screener

## Constraints

- **Design**: No 1px borders for section separation — tonal background shifts only
- **Security**: Always use Supabase RLS — health data is sensitive
- **API keys**: Never hardcode Anthropic API key — injected by Vercel environment
- **Medical**: Always show disclaimer on blood test recommendations; always label PubMed results as "auto-matched" and curated as "Agatha reviewed"
- **PubMed**: Cache aggressively, rate limit is 3 req/sec
- **Voice**: Test on mobile Safari early — Web Speech API support varies
- **Trials**: Always label ClinicalTrials links as opening externally

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 14 App Router | Already deployed on Vercel, server components, API routes | — Pending |
| Supabase over custom auth | Open source Postgres + auth + realtime + storage in one | — Pending |
| Claude API for synthesis | Voice extraction, research matching, conclusion drafting | — Pending |
| PubMed (no key required) | 36M peer-reviewed articles, free, filtered for women's health | — Pending |
| Investigation metaphor | Differentiates from symptom trackers; frames users as active researchers | — Pending |
| Web Speech API for voice | No server audio upload needed; test mobile Safari early | — Pending |

---
*Last updated: 2026-04-14 after initialization*
