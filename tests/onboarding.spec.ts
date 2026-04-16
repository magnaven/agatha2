import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function createUnboardedUser(supabase: ReturnType<typeof adminClient>) {
  const email = `unboarded${Date.now()}@agatha.dev`
  const password = 'TestPassword123!'
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`Seed failed: ${error.message}`)
  return { email, password, userId: created.user.id }
}

async function fillInitialSteps(page: import('@playwright/test').Page, name: string, _age: string) {
  // Step 1: Name
  await page.getByRole('textbox').fill(name)
  await page.getByRole('button', { name: /Continue/i }).click()
  // Step 2: Age — click first option (Under 18) to auto-advance; age parameter kept for API compat
  await page.locator('.option-item').first().click()
}

// @smoke @onbd-01 — "Screener loads at /onboarding with 9 options"
test('@smoke @onbd-01 — Screener loads at /onboarding with 9 options', async ({ page }) => {
  const supabase = adminClient()
  const { email, password, userId } = await createUnboardedUser(supabase)

  try {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(email)
    await page.getByPlaceholder('Password').fill(password)
    await page.getByRole('button', { name: /Log in/i }).click()

    // New user with no profile should be redirected to /onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 })

    // Navigate through name + age steps
    await fillInitialSteps(page, 'TestUser', '18-29')

    // Now on "brings you here" step — expect at least 9 option items
    const options = page.locator('.option-item')
    await expect(options).toHaveCount(9)
  } finally {
    await supabase.auth.admin.deleteUser(userId)
  }
})

// @smoke @onbd-02 — "Fertility path leads to conditions step; curious path skips it"
test('@smoke @onbd-02 — Fertility path leads to conditions step; curious path skips it', async ({ page }) => {
  const supabase = adminClient()
  const { email, password, userId } = await createUnboardedUser(supabase)

  try {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(email)
    await page.getByPlaceholder('Password').fill(password)
    await page.getByRole('button', { name: /Log in/i }).click()
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 })

    // Navigate through name + age
    await fillInitialSteps(page, 'TestUser', '18-29')

    // Select a fertility-indicating option
    await page.locator('.option-item', { hasText: "I'm trying to conceive" }).click()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Should show conditions step with an option list containing endometriosis
    await expect(page.locator('.option-list')).toBeVisible()
    await expect(page.locator('.option-item', { hasText: /endometriosis/i })).toBeVisible()
  } finally {
    await supabase.auth.admin.deleteUser(userId)
  }
})

test('@smoke @onbd-02b — Curious path skips conditions step', async ({ page }) => {
  const supabase = adminClient()
  const { email, password, userId } = await createUnboardedUser(supabase)

  try {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(email)
    await page.getByPlaceholder('Password').fill(password)
    await page.getByRole('button', { name: /Log in/i }).click()
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 })

    await fillInitialSteps(page, 'TestUser', '18-29')

    // Select a curious/general option only
    await page.locator('.option-item', { hasText: "I'm curious about my health" }).click()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Should NOT show conditions step — should go straight to synthesis
    await expect(page.locator('.option-item', { hasText: /endometriosis/i })).not.toBeVisible()
  } finally {
    await supabase.auth.admin.deleteUser(userId)
  }
})

// @smoke @onbd-03 — "Conditions multi-select lists Adenomyosis, Endometriosis, PCOS, POI, Fibroids"
test('@smoke @onbd-03 — Conditions step lists Adenomyosis, Endometriosis, PCOS, POI, Fibroids', async ({ page }) => {
  const supabase = adminClient()
  const { email, password, userId } = await createUnboardedUser(supabase)

  try {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(email)
    await page.getByPlaceholder('Password').fill(password)
    await page.getByRole('button', { name: /Log in/i }).click()
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 })

    await fillInitialSteps(page, 'TestUser', '18-29')

    // Navigate to conditions step via fertility path
    await page.locator('.option-item', { hasText: "I'm trying to conceive" }).click()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Verify all 5 named conditions are visible
    await expect(page.locator('.option-item', { hasText: /adenomyosis/i })).toBeVisible()
    await expect(page.locator('.option-item', { hasText: /endometriosis/i })).toBeVisible()
    await expect(page.locator('.option-item', { hasText: /pcos/i })).toBeVisible()
    await expect(page.locator('.option-item', { hasText: /poi/i })).toBeVisible()
    await expect(page.locator('.option-item', { hasText: /fibroids/i })).toBeVisible()
  } finally {
    await supabase.auth.admin.deleteUser(userId)
  }
})

// @smoke @onbd-04 — "Selecting Endometriosis shows a follow-up step"
test('@smoke @onbd-04 — Selecting Endometriosis shows a follow-up step', async ({ page }) => {
  const supabase = adminClient()
  const { email, password, userId } = await createUnboardedUser(supabase)

  try {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(email)
    await page.getByPlaceholder('Password').fill(password)
    await page.getByRole('button', { name: /Log in/i }).click()
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 })

    await fillInitialSteps(page, 'TestUser', '18-29')

    // Navigate to conditions step
    await page.locator('.option-item', { hasText: "I'm trying to conceive" }).click()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Select Endometriosis
    await page.locator('.option-item', { hasText: /endometriosis/i }).click()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Should show follow-up question about endometriosis
    await expect(page.locator('.onboard__question', { hasText: /endometriosis/i })).toBeVisible()
  } finally {
    await supabase.auth.admin.deleteUser(userId)
  }
})

// @smoke @onbd-05 — "'No I haven't' clears others; suspect stacks"
test('@smoke @onbd-05 — No I haven\'t clears others; suspect stacks with conditions', async ({ page }) => {
  const supabase = adminClient()
  const { email, password, userId } = await createUnboardedUser(supabase)

  try {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(email)
    await page.getByPlaceholder('Password').fill(password)
    await page.getByRole('button', { name: /Log in/i }).click()
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 })

    await fillInitialSteps(page, 'TestUser', '18-29')

    // Navigate to conditions step
    await page.locator('.option-item', { hasText: "I'm trying to conceive" }).click()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Select Endometriosis first, then "No I haven't" — endo should be deselected
    const endoItem = page.locator('.option-item', { hasText: /endometriosis/i })
    await endoItem.click()
    await expect(endoItem).toHaveClass(/selected/)

    const noHaventItem = page.locator('.option-item', { hasText: /No I haven't/ })
    await noHaventItem.click()
    // Endo should no longer be selected
    await expect(endoItem).not.toHaveClass(/selected/)

    // Now test: "No diagnosis but suspect something" stacks with Endometriosis
    // First clear "no-havent" by clicking Endometriosis
    await endoItem.click()
    // Now select "No diagnosis but suspect something" too
    const suspectItem = page.locator('.option-item', { hasText: /No diagnosis but suspect something/ })
    await suspectItem.click()
    // Both should be selected
    await expect(endoItem).toHaveClass(/selected/)
    await expect(suspectItem).toHaveClass(/selected/)
  } finally {
    await supabase.auth.admin.deleteUser(userId)
  }
})
