import { test, expect } from '@playwright/test'

// AUTH-01: User can create an account with email and password
test('@smoke @auth-signup — signup with email+password lands in app', async ({ page }) => {
  const testEmail = `test+${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'

  await page.goto('/login')
  await expect(page.getByText('Agatha')).toBeVisible()

  await page.getByPlaceholder('Email').fill(testEmail)
  await page.getByPlaceholder('Password').fill(testPassword)
  await page.getByRole('button', { name: /Create account/i }).click()

  // After signup, user should be redirected away from /login
  await expect(page).not.toHaveURL(/\/login/)
})

// AUTH-02: User can log in and stay logged in across browser sessions
test('@smoke @auth-session — session persists after page reload', async ({ page, context }) => {
  const testEmail = `session+${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'

  // Sign up first
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(testEmail)
  await page.getByPlaceholder('Password').fill(testPassword)
  await page.getByRole('button', { name: /Create account/i }).click()
  await expect(page).not.toHaveURL(/\/login/)

  // Reload — should still be authenticated (not redirected to /login)
  await page.reload()
  await expect(page).not.toHaveURL(/\/login/)
})

// AUTH-03: User can log out from any page
test('@smoke @auth-signout — sign out returns user to /login', async ({ page }) => {
  const testEmail = `signout+${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'

  // Sign up first
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(testEmail)
  await page.getByPlaceholder('Password').fill(testPassword)
  await page.getByRole('button', { name: /Create account/i }).click()
  await expect(page).not.toHaveURL(/\/login/)

  // Sign out — button text "Sign out" will be present in the app shell
  await page.getByRole('button', { name: /Sign out/i }).click()
  await expect(page).toHaveURL(/\/login/)
})
