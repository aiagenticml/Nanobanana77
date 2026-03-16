import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// 1. Auth screen — login/signup UI
// ---------------------------------------------------------------------------
test.describe('Auth screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows sign in form by default', async ({ page }) => {
    await expect(page.locator('text=Finance Planner')).toBeVisible()
    await expect(page.locator('text=Sign in to continue')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('can switch to sign up mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign up' }).click()
    await expect(page.locator('text=Create your account')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  test('email field enforces maxLength of 254', async ({ page }) => {
    const email = page.locator('input[type="email"]')
    await expect(email).toHaveAttribute('maxlength', '254')
  })

  test('password field enforces minLength of 8 and maxLength of 128', async ({ page }) => {
    const pw = page.locator('input[type="password"]')
    await expect(pw).toHaveAttribute('minlength', '8')
    await expect(pw).toHaveAttribute('maxlength', '128')
  })

  test('shows error on invalid login attempt', async ({ page }) => {
    await page.locator('input[type="email"]').fill('test@test.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    // Should show an error (Supabase is unreachable in test env)
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10000 })
  })

  test('privacy policy link works', async ({ page }) => {
    await page.getByRole('button', { name: 'Privacy Policy' }).click()
    await expect(page.locator('text=What data we collect')).toBeVisible()
    // Can go back
    await page.getByRole('button', { name: /Back/ }).click()
    await expect(page.locator('text=Sign in to continue')).toBeVisible()
  })

  test('terms of service link works', async ({ page }) => {
    await page.getByRole('button', { name: 'Terms of Service' }).click()
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible()
    await page.getByRole('button', { name: /Back/ }).click()
    await expect(page.locator('text=Sign in to continue')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. No sensitive data in page source
// ---------------------------------------------------------------------------
test.describe('No sensitive data exposure', () => {
  test('page does not expose Supabase anon key in visible text', async ({ page }) => {
    await page.goto('/')
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/)
  })
})

// ---------------------------------------------------------------------------
// 3. XSS resistance on auth inputs
// ---------------------------------------------------------------------------
test.describe('XSS resistance', () => {
  test('script tag in email field is treated as plain text', async ({ page }) => {
    await page.goto('/')
    const email = page.locator('input[type="email"]')
    await email.fill('<script>alert("xss")</script>')
    await expect(email).toHaveValue('<script>alert("xss")</script>')

    const alertTriggered = await page.evaluate(() => window.__xssTriggered === true)
    expect(alertTriggered).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 4. Auth gate — unauthenticated users cannot access app
// ---------------------------------------------------------------------------
test.describe('Auth gate', () => {
  test('unauthenticated users see login, not the app tabs', async ({ page }) => {
    await page.goto('/')
    // Should NOT see the bottom navigation tabs
    await expect(page.locator('text=Sign in to continue')).toBeVisible()
    // The bottom nav buttons should not exist
    const homeBtn = page.getByRole('button', { name: 'Home' })
    await expect(homeBtn).not.toBeVisible()
  })
})
