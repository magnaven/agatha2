# Phase 1: Auth — Research

**Researched:** 2026-04-14
**Domain:** Supabase Auth with Next.js 14 App Router, @supabase/ssr, server-side session management
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create an account with email and password | `supabase.auth.signUp()` via Server Action; no email confirmation required for v1 (disable in Supabase Dashboard) |
| AUTH-02 | User can log in and stay logged in across browser sessions | `supabase.auth.signInWithPassword()` via Server Action; session stored in cookies via middleware; `@supabase/ssr` handles refresh automatically |
| AUTH-03 | User can log out from any page | `supabase.auth.signOut()` Server Action callable from any layout's sign-out button; redirect to `/login` |
</phase_requirements>

---

## Summary

This phase bootstraps a greenfield Next.js 14 App Router project with full email/password authentication using Supabase. The project currently has only `index.css` and `PROJECTagatha.md` at the root — no `package.json`, no `next.config.js`. This means phase 1 starts with `create-next-app` scaffolding before wiring auth.

The correct Supabase package for App Router is `@supabase/ssr`. The deprecated `@supabase/auth-helpers-nextjs` must not be used — it does not support App Router cookie semantics. Session persistence is handled by Next.js middleware that intercepts every request, refreshes the Supabase token, and writes the updated session back to both the request (for Server Components) and the response (for the browser).

Since Agatha is a new Supabase project created after October 2025, it uses asymmetric JWT signing by default. This means the new `supabase.auth.getClaims()` method performs local JWT verification (no network round-trip) and is the fast, secure choice for server-side auth checks. The Supabase official SSR docs still show `getUser()` patterns — both are correct, but `getUser()` makes a network call to Supabase Auth on every request whereas `getClaims()` does not. Use `getUser()` in middleware (to force token refresh) and `getClaims()` in protected Server Components (for fast local validation).

**Primary recommendation:** Scaffold with `create-next-app --typescript --tailwind --app --src-dir`, install `@supabase/supabase-js @supabase/ssr`, set up two utility clients (server + browser), configure middleware for session refresh, and build auth pages using Server Actions with the Agatha design system classes from `index.css`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 14.x (pin via create-next-app) | App Router framework | Project decision — already on Vercel |
| `@supabase/supabase-js` | ^2.x | Supabase client SDK | Required peer of @supabase/ssr |
| `@supabase/ssr` | ^0.5.x | Cookie-based auth for SSR | Official Supabase package for App Router; replaces deprecated auth-helpers |
| `typescript` | ^5.x | Type safety | create-next-app scaffolds this |
| `tailwindcss` | ^3.x | Utility classes (complement to design system) | Project decision; design system in index.css |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-hook-form` | ^7.x | Form state and validation | Optional — can use plain Server Actions for v1 simplicity |
| `zod` | ^3.x | Input validation schema | Optional — use for validating formData in Server Actions if robustness needed |

### Alternatives Considered (do NOT use)
| Instead of | Could Use | Why We Don't |
|------------|-----------|-------------|
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | Deprecated for App Router; cookie API incompatible |
| `@supabase/ssr` | NextAuth.js | Unnecessary abstraction — Supabase handles auth end-to-end |
| Server Actions | Client-side fetch to API route | Server Actions are simpler, no API route needed, CSRF protected by Next.js |

**Installation:**
```bash
npx create-next-app@latest agatha --typescript --tailwind --app --src-dir --import-alias "@/*"
cd agatha
npm install @supabase/supabase-js @supabase/ssr
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/                 # Route group — auth pages, no app chrome
│   │   ├── login/
│   │   │   ├── page.tsx        # Login/signup UI (Server Component)
│   │   │   └── actions.ts      # Server Actions: login, signup
│   │   ├── signup/
│   │   │   └── page.tsx        # (optional — or combine with login)
│   │   └── layout.tsx          # Minimal layout: onboard dark bg
│   ├── (app)/                  # Route group — authenticated app shell
│   │   ├── layout.tsx          # App shell with nav bar
│   │   └── page.tsx            # Post-auth landing (timeline, phase 3)
│   ├── auth/
│   │   └── confirm/
│   │       └── route.ts        # Email OTP confirmation handler (needed even if confirmation disabled, for safety)
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Import index.css design tokens
├── lib/
│   └── supabase/
│       ├── client.ts           # createBrowserClient — use in Client Components
│       └── server.ts           # createServerClient — use in Server Components + Actions
├── middleware.ts               # Session refresh on every request
└── index.css                   # Agatha design system (already exists — copy in)
```

### Pattern 1: Two Supabase Clients (Server + Browser)

**What:** `@supabase/ssr` requires two separate factory functions — one for browser environments (Client Components) and one for server environments (Server Components, Server Actions, Route Handlers). They cannot be swapped.

**When to use server client:** Any component/action that runs on Node.js (Server Components, `use server` actions, Route Handlers)
**When to use browser client:** Any `"use client"` component that needs to react to auth state changes client-side

```typescript
// src/lib/supabase/server.ts
// Source: Supabase SSR official docs + ryankatayi.com verified pattern
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — middleware will persist the session
          }
        },
      },
    }
  )
}
```

```typescript
// src/lib/supabase/client.ts
// Source: Supabase SSR official docs
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 2: Middleware for Session Refresh

**What:** Next.js middleware runs before every route render and refreshes the Supabase token. Without this, sessions expire silently.

**Critical:** Middleware must call `supabase.auth.getUser()` (not `getSession()`) to trigger actual token refresh with the Supabase Auth server.

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(({ name, value }) => ({ name, value }))
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // getUser() triggers server-side token validation and refresh
  await supabase.auth.getUser()
  return response
}
```

```typescript
// middleware.ts (project root, NOT inside src/app)
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 3: Server Actions for Auth Operations

**What:** All auth mutations (login, signup, signout) run as Next.js Server Actions — no client-side fetch needed, CSRF protection built in.

```typescript
// src/app/(auth)/login/actions.ts
'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  // Email confirmation disabled for v1 — redirect straight to app
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

### Pattern 4: Protected Route (Server Component)

**What:** Any Server Component in the `(app)` route group checks auth with `getUser()`. Unauthenticated users are redirected to `/login`.

```typescript
// src/app/(app)/layout.tsx — protects all app routes at layout level
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) redirect('/login')

  return <>{children}</>
}
```

Protecting at layout level means every route inside `(app)/` is automatically protected without repeating the check on each page.

### Pattern 5: Login UI Using Agatha Design System

The login/signup page should use Agatha's existing `.onboard` dark background pattern (deep forest green), `.input-field--dark` inputs, and `.btn--primary` (lime accent) CTA. This matches the onboarding aesthetic the design system already defines.

```tsx
// src/app/(auth)/login/page.tsx (abbreviated)
import { login, signup } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="onboard" style={{ minHeight: '100dvh' }}>
      <div className="onboard__logo">Agatha</div>
      <p className="onboard__tagline">Your health investigation starts here.</p>
      {searchParams.error && (
        <p style={{ color: 'var(--status-high-text)', fontSize: '13px' }}>
          {searchParams.error}
        </p>
      )}
      <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input className="input-field input-field--dark" name="email" type="email" placeholder="Email" required />
        <input className="input-field input-field--dark" name="password" type="password" placeholder="Password" required />
        <button className="btn btn--primary btn--full" formAction={login}>Log in</button>
        <button className="btn btn--ghost btn--full" formAction={signup}>Create account</button>
      </form>
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Using `getSession()` on the server:** Returns unvalidated session from cookies. Can be spoofed. Use `getUser()` or `getClaims()` instead.
- **Using `@supabase/auth-helpers-nextjs`:** Deprecated for App Router. Its cookie API is incompatible with Next.js 14 middleware cookie semantics.
- **Protecting routes only in middleware:** Middleware is stateless and can be bypassed if cookie is forged. Always also check `getUser()` in the protected layout/page.
- **Calling `cookies()` from a Server Component after redirect:** The cookies store from `next/headers` is read-only in Server Components — set cookies only via middleware or Server Actions.
- **Single combined client for server+browser:** `createBrowserClient` and `createServerClient` are environment-specific. Mixing them causes runtime errors.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session storage across tabs | Custom localStorage/cookie sync | `@supabase/ssr` + middleware | Supabase handles PKCE flow, token rotation, secure SameSite cookies |
| Token refresh | Manual JWT expiry checking | Middleware calling `getUser()` | Handles asymmetric key rotation, revocation, refresh token cycling |
| Password hashing | Any custom bcrypt setup | Supabase Auth (server-managed) | Passwords never reach app code; handled server-side by Supabase |
| CSRF protection for auth forms | Custom CSRF tokens | Next.js Server Actions | Server Actions include built-in CSRF protection |
| Protected route logic | Route guard HOC | App Router layout with `redirect()` | Layout-level protection is simpler, composable, no client flash |

**Key insight:** Supabase Auth handles the entire credential lifecycle. The app only passes email/password to Supabase SDK calls; it never stores, hashes, or validates credentials itself.

---

## Common Pitfalls

### Pitfall 1: Forgetting to `await cookies()` in server client

**What goes wrong:** Build error or stale session in Next.js 15 (and some Next.js 14 configurations) — `cookies()` returned a Promise in newer versions.
**Why it happens:** Next.js updated `cookies()` from synchronous to async in anticipation of Next.js 15 changes.
**How to avoid:** Always `const cookieStore = await cookies()` in `server.ts`.
**Warning signs:** TypeScript error "cannot invoke object which is possibly undefined" or stale session data.

### Pitfall 2: Middleware not running on auth pages

**What goes wrong:** The session refresh doesn't fire on `/login`, causing redirect loops or stale state.
**Why it happens:** The middleware `matcher` pattern accidentally excludes the login route.
**How to avoid:** The matcher pattern `/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)` includes all app pages including `/login`. Do not add `/login` to exclusions.

### Pitfall 3: Email confirmation blocking signup in v1

**What goes wrong:** User signs up, gets stuck on "check your email" with no confirmation flow built.
**Why it happens:** Supabase enables email confirmation by default; v2 requirements defer email verification (`INT-03`).
**How to avoid:** In Supabase Dashboard → Authentication → Settings → disable "Enable email confirmations" for v1. Re-enable in v2. The `auth/confirm` route.ts still needs to exist as a stub.

### Pitfall 4: Server Action error handling via exceptions

**What goes wrong:** If a Server Action throws, Next.js shows a generic error boundary instead of a user-friendly message.
**Why it happens:** `redirect()` inside a try/catch catches the redirect throw (it throws internally).
**How to avoid:** Do NOT put `redirect()` inside a try/catch. Call redirect after the try block, or use query param error passing as shown in Pattern 3 above (`redirect('/login?error=...')`).

### Pitfall 5: Importing server client in a Client Component

**What goes wrong:** Runtime error — `next/headers` is not available in client bundles.
**Why it happens:** `src/lib/supabase/server.ts` imports from `next/headers` which only works on server.
**How to avoid:** Import only `src/lib/supabase/client.ts` inside `"use client"` components. The filenames make the distinction explicit — enforce this convention.

### Pitfall 6: Missing `NEXT_PUBLIC_` prefix on env vars

**What goes wrong:** Browser-side Supabase client silently gets `undefined` for URL and key.
**Why it happens:** Next.js only exposes env vars prefixed `NEXT_PUBLIC_` to the browser bundle.
**How to avoid:** Always name vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The anon key is safe to expose — it is scoped by RLS.

### Pitfall 7: design system CSS not loading

**What goes wrong:** Auth page renders without Agatha design tokens — wrong fonts, colors, no `.onboard` styles.
**Why it happens:** The existing `index.css` is at the repo root, not in `src/app/globals.css`. `create-next-app` generates its own `globals.css`.
**How to avoid:** Copy `index.css` content into `src/app/globals.css` (or import it from there), replacing the create-next-app default styles. Keep the `@import url(...)` for Google Fonts at the top.

---

## Code Examples

### Auth Callback Route (needed for email OTP if ever enabled)
```typescript
// src/app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) redirect(next)
  }
  redirect('/login?error=Invalid+confirmation+link')
}
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Root Layout (globals.css import)
```typescript
// src/app/layout.tsx
import './globals.css'  // This file contains the Agatha design system

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-shell">{children}</body>
    </html>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` with `createServerClient`/`createBrowserClient` | 2023–2024 | Must use new package for App Router cookie semantics |
| `getSession()` server-side | `getUser()` in middleware, `getClaims()` in Server Components | 2024–2025 | Security: `getSession` can be spoofed; performance: `getClaims` avoids network calls |
| Symmetric JWT (HMAC) | Asymmetric JWT (RSA/ECC) on new projects | Oct 2025 | All new Supabase projects use asymmetric keys by default — `getClaims()` now does local verification |
| Pages Router middleware pattern | App Router layout-level protection | Next.js 13+ | Layout-level protection is idiomatic for App Router |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Do not use. Official docs link redirects to `@supabase/ssr`.
- `createMiddlewareSupabaseClient`: Old API. Replaced by `createServerClient` inside `updateSession`.
- `supabase.auth.getSession()` on server: Insecure — reads unvalidated cookie. Use `getUser()` or `getClaims()`.

---

## Open Questions

1. **`getUser()` vs `getClaims()` in middleware**
   - What we know: New projects (post-Oct 2025) use asymmetric JWTs. `getClaims()` does local verification. Supabase's own SSR guide still shows `getUser()` in middleware. An open GitHub issue (#39947) tracks updating guides to use `getClaims()`.
   - What's unclear: Whether `getClaims()` in middleware also handles token *refresh* (writing updated session cookie), or whether `getUser()` is still needed in middleware specifically for the refresh side-effect.
   - Recommendation: Use `getUser()` in middleware (guarantees refresh side-effect). Use `getClaims()` in protected layouts/pages for fast local validation. Revisit when Supabase updates the SSR guide.

2. **Supabase project already exists vs new project**
   - What we know: The live URL is `agatha-psi.vercel.app`. A Supabase project likely already exists.
   - What's unclear: Whether it was created before or after October 2025 (asymmetric key default date), and whether the anon key is in the current format (`sb_publishable_xxx`) or legacy format.
   - Recommendation: Check Supabase Dashboard → Settings → API. Note whether "Publishable key" field exists (new format) or only "anon key" (old format). Both work with `@supabase/ssr`.

3. **Email confirmation for v1**
   - What we know: v2 requirements include `INT-03` (email verification). v1 SUCCESS CRITERIA say "user can create an account and land in the app" — implying no email gate.
   - Recommendation: Disable email confirmation in Supabase Dashboard for v1 build/test. Document the re-enable step for v2 handoff.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — greenfield project |
| Config file | Wave 0 to create: `jest.config.ts` or skip in favor of Playwright e2e |
| Quick run command | `npx playwright test --grep @smoke` (after Wave 0 setup) |
| Full suite command | `npx playwright test` |

**Note:** Auth flows are hard to unit test in isolation (cookies, redirects, network). Integration/e2e tests with Playwright against a real Supabase test project are the pragmatic choice for this phase.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User can sign up with email + password and land in app | e2e smoke | `npx playwright test --grep @auth-signup` | ❌ Wave 0 |
| AUTH-02 | User session persists across browser close/reopen | e2e smoke | `npx playwright test --grep @auth-session` | ❌ Wave 0 |
| AUTH-03 | Sign out from any page returns user to /login | e2e smoke | `npx playwright test --grep @auth-signout` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual browser verification of the changed flow
- **Per wave merge:** `npx playwright test` full suite
- **Phase gate:** All 3 smoke tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/auth.spec.ts` — covers AUTH-01, AUTH-02, AUTH-03 (@smoke @auth-signup @auth-session @auth-signout)
- [ ] `playwright.config.ts` — base URL, test project setup
- [ ] Supabase test credentials in `.env.test.local`
- [ ] Framework install: `npm install --save-dev @playwright/test && npx playwright install chromium`

*(Alternative: If Playwright is too heavy for phase 1, manual testing against the Vercel preview URL satisfies the phase gate — document the manual steps in the plan instead.)*

---

## Sources

### Primary (HIGH confidence)
- `supabase.com/docs/guides/auth/server-side/nextjs` — Official SSR setup for Next.js
- `supabase.com/docs/guides/auth/server-side/creating-a-client` — createServerClient / createBrowserClient API
- `supabase.com/docs/reference/javascript/auth-getclaims` — getClaims() documentation
- `supabase.com/docs/guides/auth/signing-keys` — Asymmetric JWT keys, new project defaults
- `nextjs.org/docs/app/api-reference/file-conventions/route-groups` — Route groups pattern

### Secondary (MEDIUM confidence)
- `ryankatayi.com/blog/server-side-auth-in-next-js-with-supabase-my-setup` — Verified against official Supabase docs; provided complete middleware + client code examples matching official pattern
- `github.com/orgs/supabase/discussions/28983` — getUser() performance concern + getClaims() recommendation
- `github.com/supabase/supabase/issues/39947` — SSR guides still using getUser instead of getClaims (open issue)

### Tertiary (LOW confidence)
- `dev.to/kvetoslavnovak/supabase-auth-itroduces-asymmetric-jwts-4i4e` — Community writeup on asymmetric key changes; used only to corroborate official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@supabase/ssr` is official, docs are current, package is stable
- Architecture patterns: HIGH — code verified against official Supabase SSR docs and working community examples
- Pitfalls: HIGH — pitfalls 1–6 are confirmed issues from official GitHub discussions and Supabase docs warnings
- `getClaims()` vs `getUser()` distinction: MEDIUM — the method is documented but official SSR guide hasn't been updated yet (open GitHub issue)

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (Supabase SSR is actively maintained — recheck if @supabase/ssr releases a major version)
