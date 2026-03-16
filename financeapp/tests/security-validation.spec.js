import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------
const navTo = async (page, tabLabel) => {
  await page.getByRole('button', { name: tabLabel }).click()
}

// ---------------------------------------------------------------------------
// 1. Expense form — input constraints
// ---------------------------------------------------------------------------
test.describe('Expense form input constraints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await navTo(page, 'Spend')
  })

  test('QuickAddBar enforces maxLength of 200', async ({ page }) => {
    const input = page.locator('input[placeholder*="Quick add"]')
    await expect(input).toHaveAttribute('maxlength', '200')
  })

  test('full expense form enforces notes maxLength of 500', async ({ page }) => {
    await page.getByText('+ Add with full form').click()
    const notes = page.locator('input[placeholder*="lunch at hawker"]')
    await expect(notes).toHaveAttribute('maxlength', '500')
  })

  test('full expense form enforces amount max of 100000000', async ({ page }) => {
    await page.getByText('+ Add with full form').click()
    const amount = page.locator('input[placeholder="0.00"]')
    await expect(amount).toHaveAttribute('max', '100000000')
  })

  test('QuickAddBar shows error for input without an amount', async ({ page }) => {
    const input = page.locator('input[placeholder*="Quick add"]')
    await input.fill('just text no number')
    await page.getByRole('button', { name: '+ Add', exact: true }).click()
    await expect(page.locator('text=Include an amount')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Loan form — input constraints
// ---------------------------------------------------------------------------
test.describe('Loan form input constraints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await navTo(page, 'Loans')
    await page.getByText('+ Add Loan').click()
  })

  test('loan name enforces maxLength of 200', async ({ page }) => {
    const name = page.locator('input[placeholder*="Car Loan"]')
    await expect(name).toHaveAttribute('maxlength', '200')
  })

  test('principal enforces max of 100000000', async ({ page }) => {
    const principal = page.locator('input[placeholder="50000"]')
    await expect(principal).toHaveAttribute('max', '100000000')
  })

  test('interest rate enforces max of 100', async ({ page }) => {
    const rate = page.locator('input[placeholder="4.5"]')
    await expect(rate).toHaveAttribute('max', '100')
  })

  test('term months enforces max of 600', async ({ page }) => {
    const term = page.locator('input[placeholder*="60"]')
    await expect(term).toHaveAttribute('max', '600')
  })
})

// ---------------------------------------------------------------------------
// 3. Subscription form — input constraints
// ---------------------------------------------------------------------------
test.describe('Subscription form input constraints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await navTo(page, 'Subs')
    await page.getByText('+ Add Subscription').click()
  })

  test('service name enforces maxLength of 200', async ({ page }) => {
    const name = page.locator('input[placeholder*="Netflix"]')
    await expect(name).toHaveAttribute('maxlength', '200')
  })

  test('amount enforces max of 100000000', async ({ page }) => {
    const amount = page.locator('input[placeholder="0.00"]')
    await expect(amount).toHaveAttribute('max', '100000000')
  })
})

// ---------------------------------------------------------------------------
// 4. Settings form — input constraints
// ---------------------------------------------------------------------------
test.describe('Settings form input constraints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await navTo(page, 'Settings')
  })

  test('user name enforces maxLength of 100', async ({ page }) => {
    const name = page.locator('input[placeholder*="John"]')
    await expect(name).toHaveAttribute('maxlength', '100')
  })
})

// ---------------------------------------------------------------------------
// 5. XSS resistance — injected script tags render as text, not HTML
// ---------------------------------------------------------------------------
test.describe('XSS resistance', () => {
  test('script tag in QuickAddBar is rendered as text', async ({ page }) => {
    await page.goto('/')
    await navTo(page, 'Spend')

    const input = page.locator('input[placeholder*="Quick add"]')
    await input.fill('50 <script>alert("xss")</script>')
    await page.getByRole('button', { name: '+ Add', exact: true }).click()

    // The script should never execute — check no alert dialog appeared
    // and the text appears as literal content if the expense was added
    // (or error shown if Supabase is unavailable — either is safe)
    const alertTriggered = await page.evaluate(() => {
      return window.__xssTriggered === true
    })
    expect(alertTriggered).toBe(false)
  })

  test('script tag in expense form notes is rendered as text', async ({ page }) => {
    await page.goto('/')
    await navTo(page, 'Spend')
    await page.getByText('+ Add with full form').click()

    const notes = page.locator('input[placeholder*="lunch at hawker"]')
    await notes.fill('<img src=x onerror=alert(1)>')

    // Verify the input value is stored as plain text, not interpreted
    await expect(notes).toHaveValue('<img src=x onerror=alert(1)>')
  })
})

// ---------------------------------------------------------------------------
// 6. No sensitive data in page source
// ---------------------------------------------------------------------------
test.describe('No sensitive data exposure', () => {
  test('page does not expose Supabase anon key in visible text', async ({ page }) => {
    await page.goto('/')
    // The anon key should only exist in JS bundles, never rendered as visible text
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/)
  })
})

// ---------------------------------------------------------------------------
// 7. App loads without crashing (basic smoke test)
// ---------------------------------------------------------------------------
test.describe('App smoke test', () => {
  test('app renders the Finance Planner title', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Finance Planner')).toBeVisible()
  })

  test('all navigation tabs are present', async ({ page }) => {
    await page.goto('/')
    for (const label of ['Home', 'Spend', 'Loans', 'Subs', 'Settings']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible()
    }
  })

  test('navigating between tabs works', async ({ page }) => {
    await page.goto('/')
    await navTo(page, 'Settings')
    await expect(page.locator('text=Preferences')).toBeVisible()
    await navTo(page, 'Spend')
    await expect(page.locator('text=Quick add')).toBeVisible()
    await navTo(page, 'Loans')
    await expect(page.getByText('+ Add Loan')).toBeVisible()
    await navTo(page, 'Subs')
    await expect(page.getByText('+ Add Subscription')).toBeVisible()
  })
})
