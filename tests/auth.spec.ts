import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Pre-confirmed account seeded by tests/global-setup.ts
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'playwright@test.agatha.dev'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'PlaywrightTest123!'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// AUTH-01: A newly created account can log in and land in the app
test('@smoke @auth-signup — new confirmed account login lands in app', async ({ page }) => {
  const supabase = adminClient()
  const email = `testnew${Date.now()}@agatha.dev`
  const password = 'TestPassword123!'

  // Use admin API to create a pre-confirmed user — avoids email confirmation flow
  // and Supabase rate limits that would block the smoke test
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`Seed failed: ${error.message}`)

  try {
    await page.goto('/login')
    await expect(page.getByText('Agatha')).toBeVisible()
    await page.getByPlaceholder('Email').fill(email)
    await page.getByPlaceholder('Password').fill(password)
    await page.getByRole('button', { name: /Log in/i }).click()
    await expect(page).not.toHaveURL(/\/login/)
  } finally {
    await supabase.auth.admin.deleteUser(created.user.id)
  }
})

// AUTH-02: User can log in and stay logged in across browser sessions
test('@smoke @auth-session — session persists after page reload', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(TEST_EMAIL)
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /Log in/i }).click()

  await expect(page).not.toHaveURL(/\/login/)

  // Reload — should still be authenticated
  await page.reload()
  await expect(page).not.toHaveURL(/\/login/)
})

// AUTH-03: User can log out from any page
test('@smoke @auth-signout — sign out returns user to /login', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(TEST_EMAIL)
  await page.getByPlaceholder('Password').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /Log in/i }).click()

  await expect(page).not.toHaveURL(/\/login/)

  await page.getByRole('button', { name: /Sign out/i }).click()
  await expect(page).toHaveURL(/\/login/)
})
