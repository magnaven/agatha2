# Phase 2: Onboarding - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Every new user completes a branching health screener and arrives at the app with a named investigation. Covers: name + age collection, the 9-option "what brings you here" question, condition multi-select and follow-ups, Claude synthesis screen (investigation title generation + first timeline entry creation), and profile persistence to Supabase. Does not include the Timeline screen itself (Phase 3) — the user lands on a stub.

</domain>

<decisions>
## Implementation Decisions

### Screener step flow
- Single-page, animated transitions — all steps live at one route (`/onboarding`), state machine drives step progression
- Subtle step dots indicator (small dots at top showing position)
- Auto-advances on single-select steps; multi-select steps require a Continue button (button appears after at least one selection is made)
- Back button on each step — user can correct earlier answers

### Name + age range timing
- Name is collected on step 1 — no intro framing, straight to the question (e.g. "What's your name?")
- Age range collected on its own step as an option-list (auto-advances on selection): Under 18 / 18–29 / 30–39 / 40–49 / 50+

### Conditions multi-select UI
- Scrollable `.option-list` — same option-item row design as the 9 main options (consistent, already styled)
- "No I haven't" is visually separated by a divider from the conditions list; tapping it clears all other selections; tapping any condition clears "No I haven't"
- "No diagnosis but suspect something" can stack freely with diagnosed conditions
- Condition-specific follow-ups appear as separate steps after the conditions step — each triggered condition that has follow-ups gets its own focused step (one at a time)

### Synthesis screen
- Dark `.onboard` background maintained throughout — no surface switch during loading
- Loading state shows animated text (e.g. "Agatha is thinking…") while Claude API call completes
- Investigation title revealed via typewriter effect (character-by-character)
- Screen shows: investigation title (serif) + one line of framing copy + single lime `btn--primary` CTA
- CTA reads "Begin my investigation" → navigates to the Timeline screen (stub for now)

### Claude's Discretion
- Exact animation timing and easing for step transitions
- Specific framing copy on the synthesis screen ("Your investigation starts now" or similar)
- Loading animation design (pulse, dots, etc.)
- Whether the name is echoed back anywhere in the screener questions

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.onboard` container: full-screen dark forest green background — use for all screener steps
- `.option-item` / `.option-list`: multi-select option rows with checkbox — already styled for the 9-option question and conditions list
- `.option-item.selected`: lime accent selection state — ready to use
- `.onboard__question`: serif 20px question text — use for all step questions
- `.onboard__hint`: 12px secondary hint text in sage — use for sub-labels
- `.btn--primary`: lime full-width CTA — use for Continue buttons and synthesis CTA
- `.input-field--dark`: dark-variant text input — use for the name entry step
- `.ill-slot--onboarding`: 280×200px illustration slot — available for an optional illustration on synthesis screen

### Established Patterns
- No React component files exist yet — this phase creates the first real UI components
- Supabase server client via `createClient()` (async, uses next/headers) for profile writes
- App layout (`(app)/layout.tsx`) guards authenticated routes via `getUser()` — onboarding needs to handle the case where a new user IS authenticated but has no profile yet
- Design constraint: no 1px borders for section separation — use tonal background shifts or `.divider` only for interactive component edges

### Integration Points
- Onboarding flow likely lives at `/onboarding` inside the `(app)` route group (authenticated)
- Profile save targets the `profiles` table in Supabase (already in schema)
- Claude API call for synthesis — Server Action or Route Handler using `claude-sonnet-4-20250514`
- First timeline entry creation — targets `journal_entries` or `investigations` table (schema exists)
- After synthesis CTA: redirect to `/(app)` (Timeline stub)

</code_context>

<specifics>
## Specific Ideas

- The screener should feel conversational and focused — one question at a time, full screen, dark immersive background throughout
- The typewriter reveal of the investigation title is the primary brand moment — this is what users will remember
- "No I haven't" / exclusivity logic should be self-evident through visual behaviour (divider + auto-deselect), not through explanatory text

</specifics>

<deferred>
## Deferred Ideas

- How Agatha tailors the ongoing experience based on medical situation — Phase 3 (Investigation Tools)
- Information cluster for recommending relevant investigations — Phase 3
- How users run their own individual investigation/health research flow — Phase 3
- Shared experiments structure and anonymisation — Phase 4 (Discovery & Community) + Phase 5 (Launch Readiness / RLS audit)

</deferred>

---

*Phase: 02-onboarding*
*Context gathered: 2026-04-16*
