# Phase 2: Onboarding — Research

**Researched:** 2026-04-16
**Domain:** Branching multi-step screener UI (React state machine), Claude API Server Action synthesis, Supabase profile + investigation write, Next.js App Router
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Screener step flow**
- Single-page, animated transitions — all steps live at one route (`/onboarding`), state machine drives step progression
- Subtle step dots indicator (small dots at top showing position)
- Auto-advances on single-select steps; multi-select steps require a Continue button (button appears after at least one selection is made)
- Back button on each step — user can correct earlier answers

**Name + age range timing**
- Name is collected on step 1 — no intro framing, straight to the question (e.g. "What's your name?")
- Age range collected on its own step as an option-list (auto-advances on selection): Under 18 / 18–29 / 30–39 / 40–49 / 50+

**Conditions multi-select UI**
- Scrollable `.option-list` — same option-item row design as the 9 main options (consistent, already styled)
- "No I haven't" is visually separated by a divider from the conditions list; tapping it clears all other selections; tapping any condition clears "No I haven't"
- "No diagnosis but suspect something" can stack freely with diagnosed conditions
- Condition-specific follow-ups appear as separate steps after the conditions step — each triggered condition that has follow-ups gets its own focused step (one at a time)

**Synthesis screen**
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

### Deferred Ideas (OUT OF SCOPE)
- How Agatha tailors the ongoing experience based on medical situation — Phase 3
- Information cluster for recommending relevant investigations — Phase 3
- How users run their own individual investigation/health research flow — Phase 3
- Shared experiments structure and anonymisation — Phase 4 + Phase 5
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ONBD-01 | User is presented with a branching screener starting with "So, what brings you here?" (9 multi-select options) | Client Component with `useState` for step index + selections; `.option-list` / `.option-item` CSS already defined; auto-advance on single-select uses `onClick` → `nextStep()` |
| ONBD-02 | Screener branches into 5 paths: curious, symptoms, fertility, menopause, complex | State machine maps selected options to branch; branch determines which steps follow the 9-option question |
| ONBD-03 | Fertility and symptoms branches show a conditions multi-select (full list from schema) | Separate step component; scrollable `.option-list`; multi-select state; Continue button appears on first selection |
| ONBD-04 | Selecting certain conditions triggers condition-specific follow-up questions | Each triggered condition appended to a `followUpQueue`; drain queue one step at a time after conditions step |
| ONBD-05 | "No diagnosis but suspect something" stacks; "No I haven't" is exclusive | Toggle logic: selecting "no-havent" clears all others; selecting any condition clears "no-havent" |
| ONBD-06 | Screener ends with synthesis screen: Claude generates investigation title + creates first timeline entry | Server Action calls Claude API (`claude-sonnet-4-20250514`), inserts into `investigations` + `journal_entries` tables |
| ONBD-07 | User profile (name, age range, conditions, suspected conditions, investigation question) saved to Supabase | Server Action upserts `profiles` row; called at same time as investigation insert (single action, two writes) |
</phase_requirements>

---

## Summary

Phase 2 is entirely greenfield UI — no React component files exist yet. The full screener lives at `/onboarding` as a single Client Component (`'use client'`) that manages a local step machine. All display steps (name entry, age select, 9-option question, branch steps, conditions, follow-ups) are controlled by a `currentStep` index and a `screenData` object that accumulates answers. CSS tokens (`.onboard`, `.option-item`, `.option-list`, `.btn--primary`, `.input-field--dark`) are already defined in `globals.css` and ready to use without modification.

The heaviest implementation concern is the branching state machine: computing which step comes next given which options were selected, and correctly ordering the condition follow-up queue. This logic must be pure TypeScript (no library), implemented in a `lib/onboarding/steps.ts` helper so the component stays thin. The second concern is the synthesis screen: the Claude API call is a Server Action, must stream or resolve before rendering the typewriter, and must write to two Supabase tables atomically (profiles upsert + investigations insert + journal_entries insert).

The new-user redirect problem must be solved at the app layout level: `(app)/layout.tsx` currently redirects unauthenticated users to `/login` but does not check for an existing profile. After Phase 2, it must additionally redirect users with no profile row to `/onboarding`, and prevent users with an existing profile from being routed back to `/onboarding`.

**Primary recommendation:** One Client Component at `src/app/(app)/onboarding/page.tsx` drives the full screener via `useState`. Steps are objects from a `lib/onboarding/steps.ts` config. The synthesis call is a single `'use server'` action in `lib/onboarding/actions.ts` that writes profile + investigation + first journal entry in sequence, then returns the generated title for typewriter display.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React `useState` / `useReducer` | 18.3.x (already installed) | Step machine + screener state | No external library needed; state is local to one component |
| Next.js Server Actions | 14.x (already installed) | Claude API call + Supabase writes | Avoids API routes; CSRF protected; aligns with Phase 1 pattern |
| `@supabase/ssr` + `createClient()` | 0.10.x (already installed) | Profile + investigation writes from Server Action | Established Phase 1 pattern; async server client |
| Anthropic SDK or `fetch` | — | Claude synthesis call | See note below |
| CSS custom classes | — | All screener UI | Already defined: `.onboard`, `.option-item`, `.option-list`, `.btn--primary`, `.input-field--dark`, `.onboard__question`, `.onboard__hint` |

### Anthropic SDK vs fetch
The project has no `@anthropic-ai/sdk` in `package.json`. Two options:

1. **Install `@anthropic-ai/sdk`** — clean typed client, streaming support, recommended for multiple AI features
2. **Use native `fetch`** — one-off call, no dependency

Given the Claude API is used in multiple phases (synthesis, voice extraction, overnight research), install the SDK:

```bash
npm install @anthropic-ai/sdk
```

Model: `claude-sonnet-4-20250514` (from PROJECT.md). Key: `ANTHROPIC_API_KEY` environment variable (already set on Vercel per project notes).

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@anthropic-ai/sdk` | ^0.30+ | Claude API calls | Install now; used in synthesis + later phases |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single Client Component state machine | React Router / XState | XState is overkill for a linear screener with ~12 steps; adds bundle weight |
| Server Action for synthesis | Route Handler (`/api/onboarding/synthesise`) | Route Handlers require extra auth check; Server Actions inherit session context automatically |
| Sequential Supabase writes | Supabase transaction | Supabase JS SDK does not expose explicit transactions; sequential `insert` calls are fine for 3 rows |

**Installation:**
```bash
npm install @anthropic-ai/sdk
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── (app)/
│       ├── layout.tsx          # MODIFY: add profile check → redirect to /onboarding
│       ├── page.tsx            # MODIFY: become timeline stub (Phase 3 placeholder)
│       └── onboarding/
│           └── page.tsx        # NEW: Client Component — full screener state machine
├── lib/
│   ├── supabase/               # Existing: server.ts, client.ts, middleware.ts
│   └── onboarding/
│       ├── steps.ts            # NEW: step definitions, branch logic, follow-up queue
│       ├── actions.ts          # NEW: Server Action — Claude synthesis + DB writes
│       └── types.ts            # NEW: ScreenerState, StepDef, BranchPath types
```

### Pattern 1: Linear State Machine with Dynamic Queue
**What:** `currentStepIndex` advances through a mutable array of steps. Base steps are defined up front; after the conditions step, condition-specific follow-up steps are spliced into the queue based on selected conditions.
**When to use:** Screeners where the number of steps depends on prior answers.

```typescript
// lib/onboarding/steps.ts (conceptual — not complete implementation)

export type StepId =
  | 'name' | 'age' | 'brings-you-here'
  | 'branch-curious' | 'branch-symptoms' | 'branch-fertility'
  | 'branch-menopause' | 'branch-complex'
  | 'conditions'
  | 'followup-endo' | 'followup-pcos' | 'followup-poi'
  | 'followup-fibroids' | 'followup-ha' | 'followup-reds' | 'followup-adeno'
  | 'synthesis'

export type BranchPath = 'curious' | 'symptoms' | 'fertility' | 'menopause' | 'complex'

// Conditions that trigger follow-up steps (from PROJECT.md spec)
export const CONDITION_FOLLOWUPS: Record<string, StepId> = {
  'endometriosis':  'followup-endo',
  'pcos':           'followup-pcos',
  'poi':            'followup-poi',
  'fibroids':       'followup-fibroids',
  'ha':             'followup-ha',
  'reds':           'followup-reds',
  'adenomyosis':    'followup-adeno',
}

// Branch from "what brings you here" selections
export function detectBranch(selections: string[]): BranchPath {
  const hasFertility  = selections.includes('fertility')
  const hasMenopause  = selections.includes('menopause')
  if (hasFertility && hasMenopause) return 'complex'
  if (hasFertility)  return 'fertility'
  if (hasMenopause)  return 'menopause'
  if (selections.some(s => ['symptoms','diagnosed'].includes(s))) return 'symptoms'
  return 'curious'
}

// Build the step queue after "brings you here" is answered
export function buildStepQueue(
  branch: BranchPath,
  selectedConditions: string[]
): StepId[] {
  const branchSteps: Record<BranchPath, StepId[]> = {
    curious:    [],
    symptoms:   ['conditions'],
    fertility:  ['conditions'],
    menopause:  ['branch-menopause'],
    complex:    ['branch-complex', 'conditions'],
  }
  const conditionFollowups = selectedConditions
    .filter(c => CONDITION_FOLLOWUPS[c])
    .map(c => CONDITION_FOLLOWUPS[c])
  return [...branchSteps[branch], ...conditionFollowups, 'synthesis']
}
```

### Pattern 2: Client Component Screener with Back Stack
**What:** A single `'use client'` page component holds `steps: StepId[]` (the current queue), `currentIndex: number`, and `answers: ScreenerState`. Going back decrements `currentIndex`; going forward either increments or, at the branch point, calls `buildStepQueue` to replace the remaining queue.
**When to use:** This is the only correct pattern for a single-page animated screener.

```typescript
// src/app/(app)/onboarding/page.tsx (structural skeleton)
'use client'
import { useState } from 'react'
import type { ScreenerState } from '@/lib/onboarding/types'
import { buildStepQueue, detectBranch } from '@/lib/onboarding/steps'
import { synthesiseInvestigation } from '@/lib/onboarding/actions'

const INITIAL_STEPS = ['name', 'age', 'brings-you-here'] as const

export default function OnboardingPage() {
  const [stepQueue, setStepQueue] = useState<string[]>([...INITIAL_STEPS])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<ScreenerState>({})
  const [synthesisTitle, setSynthesisTitle] = useState<string | null>(null)

  const currentStep = stepQueue[idx]

  function advance(newAnswers: Partial<ScreenerState>) {
    const merged = { ...answers, ...newAnswers }
    setAnswers(merged)

    // At brings-you-here step, compute remaining queue
    if (currentStep === 'brings-you-here') {
      const branch = detectBranch(merged.bringsYouHere ?? [])
      const remaining = buildStepQueue(branch, []) // conditions unknown yet
      setStepQueue(['name', 'age', 'brings-you-here', ...remaining])
    }

    // At conditions step, splice in follow-up steps
    if (currentStep === 'conditions') {
      const branch = detectBranch(merged.bringsYouHere ?? [])
      const remaining = buildStepQueue(branch, merged.conditions ?? [])
      // Replace tail from current position
      setStepQueue(prev => [...prev.slice(0, idx + 1), ...remaining])
    }

    setIdx(i => i + 1)
  }

  function back() {
    setIdx(i => Math.max(0, i - 1))
  }

  // Render the correct step component based on currentStep
  // ...
}
```

### Pattern 3: Server Action for Synthesis + DB Write
**What:** Client calls a `'use server'` action with the complete `ScreenerState`. The action: (1) calls Claude API, (2) upserts `profiles`, (3) inserts `investigations`, (4) inserts first `journal_entries` milestone, (5) returns the generated title.
**When to use:** Any time you need AI + DB writes triggered from client — never call Anthropic API from browser (key exposure).

```typescript
// lib/onboarding/actions.ts
'use server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { ScreenerState } from './types'

export async function synthesiseInvestigation(state: ScreenerState) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Generate investigation title
  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: buildSynthesisPrompt(state),
    }],
  })
  const title = (message.content[0] as { type: 'text'; text: string }).text.trim()

  // 2. Upsert profile
  await supabase.from('profiles').upsert({
    id: user.id,
    name: state.name,
    age_range: state.ageRange,
    conditions: state.conditions ?? [],
    suspected_conditions: state.suspectedConditions ?? [],
    onboarding_selections: state.bringsYouHere ?? [],
    investigation_question: title,
  })

  // 3. Insert investigation
  const { data: inv } = await supabase.from('investigations').insert({
    user_id: user.id,
    title,
    conditions: state.conditions ?? [],
    status: 'active',
  }).select('id').single()

  // 4. Insert first timeline entry (milestone)
  await supabase.from('journal_entries').insert({
    investigation_id: inv!.id,
    user_id: user.id,
    entry_type: 'milestone',
    raw_text: 'Investigation started',
    day_number: 1,
  })

  return { title }
}

function buildSynthesisPrompt(state: ScreenerState): string {
  return `You are Agatha, a women's health investigation assistant. Based on this user's onboarding:
- Name: ${state.name}
- Conditions: ${(state.conditions ?? []).join(', ') || 'none diagnosed'}
- Suspected: ${(state.suspectedConditions ?? []).join(', ') || 'none'}
- Areas of interest: ${(state.bringsYouHere ?? []).join(', ')}

Write a single investigation title (6–12 words, no punctuation) in first person that names their investigation.
Example: "Understanding my endometriosis and how to reduce flares"
Respond with ONLY the title, nothing else.`
}
```

### Pattern 4: Profile Guard in App Layout
**What:** `(app)/layout.tsx` currently only checks `user` (authentication). It must also check for a `profiles` row. New users who just signed up are authenticated but have no profile — they must land at `/onboarding`. Returning users with a profile must not be redirected to `/onboarding`.
**When to use:** Any route inside `(app)/` that assumes onboarding is complete.

```typescript
// src/app/(app)/layout.tsx — UPDATED
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) redirect('/login')

  // NEW: check profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle()

  // Avoid redirect loop: only redirect non-onboarding routes
  // The /onboarding route is also inside (app), so we must not redirect from it
  // This check is done via pathname — but layout.tsx doesn't have access to pathname
  // Solution: onboarding page itself handles the "already onboarded" check
  if (!profile) redirect('/onboarding')

  return <>{children}</>
}
```

**Redirect loop problem:** If `/onboarding` lives inside `(app)/` and `(app)/layout.tsx` redirects to `/onboarding` when no profile exists, no loop occurs because the `/onboarding` page itself completes the profile. BUT: the layout check `if (!profile) redirect('/onboarding')` will run on the `/onboarding` route itself — this creates an infinite redirect loop.

**Correct solution:** Move `/onboarding` OUTSIDE the `(app)` layout (its own route group, or a sibling of `(app)`) — or check the pathname and skip the redirect for the `/onboarding` route. The simplest fix: put `/onboarding` in the `(auth)` route group (no layout guard), but add an auth check inside the onboarding page itself.

**Recommended structure:**
```
src/app/
├── (auth)/
│   ├── login/                  # existing
│   └── onboarding/             # NEW — moved here, no profile guard
│       └── page.tsx
├── (app)/
│   ├── layout.tsx              # guards: must be authenticated + have profile
│   └── page.tsx                # timeline stub
```

This is cleaner: `(auth)` handles pre-profile flows, `(app)` handles post-onboarding flows.

### Typewriter Effect
**What:** Reveals a string character by character using `setInterval`. No library needed.
**Pattern:**
```typescript
// In synthesis step component
function useTypewriter(text: string | null, delay = 40) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!text) return
    setDisplayed('')
    let i = 0
    const id = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(id)
    }, delay)
    return () => clearInterval(id)
  }, [text, delay])
  return displayed
}
```

### Anti-Patterns to Avoid
- **Calling Anthropic API from the browser:** Key would be exposed in client bundle. Always call from Server Action.
- **Multiple Server Actions for the atomic write:** Profile + investigation + first entry should be one action to avoid partial writes if the user closes the tab mid-sequence.
- **Storing screener state in URL params:** State is sensitive health data; keep it in React state only, write to DB at synthesis step.
- **Using `useReducer` for the full screener:** The state shape is simple enough for `useState` + helper functions; `useReducer` adds boilerplate without benefit here.
- **Redirect loop with profile guard:** See Pattern 4 above — `/onboarding` must not be inside a layout that redirects to `/onboarding`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Typewriter animation | Custom requestAnimationFrame loop | `setInterval` + `useState` pattern (20 lines) | Simple and sufficient; RAF adds complexity without benefit at this speed |
| Step transition animation | Custom CSS keyframe generator | CSS `transition` on `opacity` + `transform` | Already in design system pattern; `transition: opacity 0.2s ease, transform 0.2s ease` is sufficient |
| Form validation for name step | Custom validator | HTML `required` + `minLength` attribute | Sufficient; already used in login form |
| Exclusive/inclusive option toggle | Custom state reducer | Simple `toggle` function with special-case for "no-havent" | 10 lines of logic, no library needed |
| Claude prompt construction | Template engine | Plain TypeScript string interpolation | Context is small and structured |

**Key insight:** This phase is mostly React state management + CSS — the design system already provides all the visual components. Resist adding libraries.

---

## Common Pitfalls

### Pitfall 1: Redirect Loop — Profile Guard vs Onboarding Route
**What goes wrong:** `(app)/layout.tsx` redirects to `/onboarding` when no profile exists, but `/onboarding` is also inside `(app)/`, causing an infinite redirect loop.
**Why it happens:** Layout guard runs on every route in the group, including the escape hatch route.
**How to avoid:** Place `/onboarding` in `(auth)/` route group (outside the profile guard). The onboarding page does its own `auth.getUser()` check and redirects to `/login` if not authenticated.
**Warning signs:** Browser shows "too many redirects" error immediately after signup.

### Pitfall 2: Partial DB Write on Tab Close
**What goes wrong:** User completes synthesis, tabs away before the Server Action finishes. Profile row exists but no investigation row — the app breaks downstream.
**Why it happens:** Three separate Supabase inserts with no transaction.
**How to avoid:** Do all three writes in a single Server Action. Consider writing profile first (idempotent upsert), then investigation + journal entry sequentially. On re-entry, check `investigations` count: if profile exists but no investigation, re-trigger synthesis from the last saved profile state.
**Warning signs:** User returns to app, gets past the profile guard, but investigation query returns empty.

### Pitfall 3: Conditions Step Shows Before Branch Requires It
**What goes wrong:** "Curious" branch users see the conditions step, which is only relevant for symptoms/fertility.
**Why it happens:** `buildStepQueue` accidentally includes conditions for all branches.
**How to avoid:** Only `symptoms` and `fertility` branches include the conditions step. Validate branch-to-step mappings with a unit test.
**Warning signs:** Curious users see the diagnosis question.

### Pitfall 4: "No I Haven't" Mutual Exclusivity Bug
**What goes wrong:** User selects "endometriosis", then selects "no-havent" — the UI removes endometriosis from selections, but the follow-up step for endo is still in the queue (because it was spliced in at the conditions step).
**Why it happens:** Step queue is rebuilt at the conditions `advance()` call, but if the user goes back to the conditions step, the queue is stale.
**How to avoid:** Rebuild the follow-up portion of the queue on EVERY `advance()` call from the conditions step, not just the first time.
**Warning signs:** Follow-up question for a condition the user deselected still appears.

### Pitfall 5: Claude API Call Timeout on Synthesis
**What goes wrong:** `claude-sonnet-4-20250514` takes 3-8 seconds. Next.js Server Action default timeout may be hit in edge environments.
**Why it happens:** Edge runtime has a shorter timeout than Node.js runtime.
**How to avoid:** Ensure `/onboarding` (and its Server Action) runs on Node.js runtime, not Edge. Set `export const runtime = 'nodejs'` in the action file, or do nothing (Node.js is the default for App Router Server Actions). Avoid `export const runtime = 'edge'` anywhere in the onboarding path.
**Warning signs:** Synthesis screen shows error after ~10s on Vercel.

### Pitfall 6: `age_range` Mismatch with Schema
**What goes wrong:** The CONTEXT.md specifies "Under 18 / 18–29 / 30–39 / 40–49 / 50+" but the PROJECT.md schema comment shows `'under-25' | '25-29' | '30-34' | '35-39' | '40+'`. These do not match.
**Why it happens:** Schema was sketched before the UX age ranges were decided in the context session.
**How to avoid:** The CONTEXT.md decision is the locked UX choice. Use slug values matching the UX labels: `'under-18' | '18-29' | '30-39' | '40-49' | '50+'`. The schema `text` column accepts any string — no migration needed, but use consistent slugs throughout.
**Warning signs:** Blood test recommendation engine (Phase 3) fails to find users in age-gated tiers.

---

## Code Examples

Verified patterns from existing codebase:

### Supabase Server Client (from `src/lib/supabase/server.ts`)
```typescript
// Pattern: always await createClient(), then use for auth + DB
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// Profile upsert
await supabase.from('profiles').upsert({
  id: user.id,
  name: 'Alice',
  age_range: '30-39',
  conditions: ['endometriosis'],
})

// Investigation insert
const { data: inv } = await supabase
  .from('investigations')
  .insert({ user_id: user.id, title: '...', status: 'active' })
  .select('id')
  .single()
```

### Server Action Pattern (from `src/app/(auth)/login/actions.ts`)
```typescript
'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function myAction(formData: FormData) {
  const supabase = await createClient()
  // IMPORTANT: redirect() must NOT be inside try/catch — it throws internally
  const { error } = await supabase.from('table').insert({ ... })
  if (error) redirect(`/onboarding?error=${encodeURIComponent(error.message)}`)
  redirect('/')
}
```

### Option Item Toggle (matches existing CSS)
```typescript
// Multi-select toggle: general conditions
function toggleCondition(id: string, current: string[]): string[] {
  if (id === 'no-havent') return ['no-havent'] // exclusive
  const without = current.filter(c => c !== 'no-havent') // clear exclusive
  return without.includes(id)
    ? without.filter(c => c !== id)
    : [...without, id]
}

// 'no-diagnosis-but-suspect' stacks freely — no special case needed
```

### CSS Classes for Screener (from `src/app/globals.css`)
```html
<!-- Step container -->
<div class="onboard">
  <!-- Question -->
  <p class="onboard__question">What's your name?</p>
  <p class="onboard__hint">We'll use this throughout your investigation.</p>

  <!-- Dark text input -->
  <input class="input-field input-field--dark" type="text" />

  <!-- Option list -->
  <div class="option-list">
    <div class="option-item selected">
      <div class="option-item__check"><!-- checkmark svg --></div>
      <span class="option-item__label">Endometriosis</span>
    </div>
  </div>

  <!-- CTA -->
  <button class="btn btn--primary btn--full">Continue</button>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multi-page wizard (separate routes per step) | Single-page state machine (one route, CSS transitions) | Project decision in CONTEXT.md | Simpler URL management, smoother animation, back button uses React state not browser history |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023 (established in Phase 1) | Must not revert; auth-helpers is deprecated for App Router |
| Anthropic `fetch` calls | `@anthropic-ai/sdk` | Phase 2 introduces SDK | Typed responses, SDK handles retries and streaming |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Already excluded in Phase 1 — do not introduce.
- `getSession()` on server: Excluded in Phase 1 — use `getUser()` only.

---

## Open Questions

1. **The 9 "what brings you here" options — exact option set**
   - What we know: "9 multi-select options" per ONBD-01; PROJECT.md lists 5 branches (curious, symptoms, fertility, menopause, complex); CONTEXT.md says "9 options"
   - What's unclear: The exact 9 label strings and their slug values are not spelled out in any planning doc
   - Recommendation: Planner should define the 9 options inline in `steps.ts` as constants — likely: "I'm curious about my health", "I have unexplained symptoms", "I'm trying to conceive", "I have a diagnosis", "I'm exploring fertility", "I'm in perimenopause", "I'm in menopause", "I have an autoimmune condition", "Something else" — exact wording is Claude's discretion

2. **Menopause branch steps — not specified in CONTEXT.md**
   - What we know: menopause is one of 5 branches; complex = fertility + menopause
   - What's unclear: CONTEXT.md only describes fertile/symptoms branch (conditions multi-select). Menopause branch steps are not defined.
   - Recommendation: Planner should treat menopause branch as: age range → symptom multi-select (hot flushes, brain fog, etc.) → HRT status (yes/no/considering) — consistent with PROJECT.md feature spec

3. **Supabase `profiles` table — migration exists or needs creating?**
   - What we know: Schema is defined in PROJECT.md; Phase 1 set up Supabase project
   - What's unclear: Whether the table DDL was ever run as a migration
   - Recommendation: Plan 02-01 Wave 0 should include a task to verify the table exists (or create it via Supabase Studio migration)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.x |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test --grep @smoke` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONBD-01 | Screener loads at `/onboarding` showing 9 options | smoke | `npx playwright test --grep @onbd-01` | ❌ Wave 0 |
| ONBD-02 | Selecting "fertility" options leads to conditions step; "curious" skips it | smoke | `npx playwright test --grep @onbd-02` | ❌ Wave 0 |
| ONBD-03 | Conditions multi-select is shown for fertility/symptoms branch | smoke | `npx playwright test --grep @onbd-03` | ❌ Wave 0 |
| ONBD-04 | Selecting "Endometriosis" shows a follow-up step | smoke | `npx playwright test --grep @onbd-04` | ❌ Wave 0 |
| ONBD-05 | Selecting "No I haven't" clears other conditions; "no-diagnosis-suspect" stacks | smoke | `npx playwright test --grep @onbd-05` | ❌ Wave 0 |
| ONBD-06 | Synthesis screen appears with a title and "Begin my investigation" CTA | smoke | `npx playwright test --grep @onbd-06` | ❌ Wave 0 |
| ONBD-07 | After synthesis, `profiles` row exists in Supabase with correct fields | smoke | `npx playwright test --grep @onbd-07` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test --grep @smoke`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/onboarding.spec.ts` — covers ONBD-01 through ONBD-07
- [ ] Supabase admin client already in `tests/auth.spec.ts` — reuse pattern for profile assertions in ONBD-07
- [ ] Test user seeding: onboarding tests need a fresh authenticated user with no profile row — can use admin `createUser` + `deleteUser` pattern from `auth.spec.ts`

---

## Sources

### Primary (HIGH confidence)
- Codebase: `src/app/globals.css` — all `.onboard`, `.option-item`, `.option-list`, `.input-field--dark`, `.btn--primary` classes verified line-by-line
- Codebase: `src/lib/supabase/server.ts` — `createClient()` async pattern confirmed
- Codebase: `src/app/(auth)/login/actions.ts` — Server Action pattern confirmed (redirect outside try/catch)
- Codebase: `src/app/(app)/layout.tsx` — current profile guard gap confirmed
- `PROJECTagatha.md` — full DB schema, 9-option branches, conditions list, follow-up trigger conditions all verified
- `package.json` — confirmed no Anthropic SDK installed yet; `@supabase/ssr@0.10.2` and Next.js 14 confirmed

### Secondary (MEDIUM confidence)
- `@anthropic-ai/sdk` npm package: install recommendation is based on known SDK existence (training knowledge) + the fact that Claude API is used in 3+ later phases

### Tertiary (LOW confidence)
- None — all findings grounded in codebase or locked decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed in `package.json`; only new addition is `@anthropic-ai/sdk`
- Architecture: HIGH — patterns are direct extensions of Phase 1 established patterns + locked decisions
- Pitfalls: HIGH — redirect loop and partial write pitfalls are deterministic from the code structure

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable stack; Next.js 14 / Supabase / Anthropic SDK APIs are not fast-moving)
