#!/usr/bin/env node

/**
 * Tradovate Auto-Import Script
 *
 * Launches a Playwright browser, logs into Tradovate, downloads trade history CSV,
 * parses it, deduplicates against existing Supabase trades, and inserts new ones.
 *
 * Prerequisites:
 *   npm install playwright csv-parse @supabase/supabase-js dotenv
 *   npx playwright install chromium
 *
 * Required env vars in tradingjournal/.env.local:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *   TRADOVATE_EMAIL, TRADOVATE_PASSWORD
 *
 * Usage:
 *   node scripts/tradovate-import.js
 */

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// --- Load env vars from .env.local ---
function loadEnv() {
  const envPath = join(ROOT, '.env.local')
  if (!existsSync(envPath)) {
    console.error('ERROR: .env.local not found at', envPath)
    process.exit(1)
  }
  const lines = readFileSync(envPath, 'utf-8').split(/\r?\n/)
  const env = {}
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim()
  }
  return env
}

// --- Simple CSV parser (matches the in-app csvParser.js logic) ---
function splitCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if ((ch === ',' || ch === '\t') && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = splitCSVLine(lines[0]).map(h => h.trim())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = splitCSVLine(line)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (values[i] ?? '').trim() })
    return obj
  })
}

function parseDateString(raw) {
  if (!raw) return null
  const d = new Date(raw.replace(/\./g, '-').trim())
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

function mapTradovateRow(row) {
  const symbol = (row['Product'] || row['Contract'] || row['Symbol'] || '').toUpperCase()
  const bsRaw = (row['B/S'] || row['Side'] || row['Action'] || '').toLowerCase()

  let direction = null
  if (bsRaw.includes('buy') || bsRaw === 'b') direction = 'long'
  else if (bsRaw.includes('sell') || bsRaw === 's') direction = 'short'
  if (!direction) return null

  const entryPrice = parseFloat(row['Avg Price'] || row['Price'] || row['Fill Price'] || '')
  const exitPrice = parseFloat(row['Exit Price'] || '')
  const size = parseFloat(row['Qty'] || row['Quantity'] || row['Size'] || '')
  const pnl = parseFloat(row['P&L'] || row['PnL'] || row['Profit'] || row['Net P&L'] || '')

  const dateRaw = row['Fill Time'] || row['Date'] || row['Time'] || ''
  const date = parseDateString(dateRaw)

  if (!symbol || !date || isNaN(entryPrice) || isNaN(size)) return null

  return {
    date, symbol, instrument: 'futures', direction,
    entry_price: entryPrice,
    exit_price: isNaN(exitPrice) ? null : exitPrice,
    size,
    pnl: isNaN(pnl) ? null : pnl,
    currency: 'USD',
  }
}

// --- Main ---
async function main() {
  const env = loadEnv()

  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY
  const email = env.TRADOVATE_EMAIL
  const password = env.TRADOVATE_PASSWORD

  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
    process.exit(1)
  }
  if (!email || !password) {
    console.error('ERROR: Missing TRADOVATE_EMAIL or TRADOVATE_PASSWORD in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('Launching browser...')
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({ acceptDownloads: true })
  const page = await context.newPage()

  try {
    // Step 1: Navigate to Tradovate login
    console.log('Navigating to Tradovate...')
    await page.goto('https://trader.tradovate.com/', { waitUntil: 'networkidle', timeout: 60000 })

    // Step 2: Log in
    console.log('Logging in...')
    // Tradovate login form — selectors may change, wrapped in try/catch with helpful error
    try {
      await page.waitForSelector('input[name="name"], input[name="email"], input[type="email"]', { timeout: 15000 })
      const emailInput = await page.$('input[name="name"]') || await page.$('input[name="email"]') || await page.$('input[type="email"]')
      const passwordInput = await page.$('input[name="password"]') || await page.$('input[type="password"]')

      if (!emailInput || !passwordInput) throw new Error('Could not find login form fields')

      await emailInput.fill(email)
      await passwordInput.fill(password)

      // Click login/sign-in button
      const loginBtn = await page.$('button[type="submit"]') || await page.$('button:has-text("Log In")') || await page.$('button:has-text("Sign In")')
      if (!loginBtn) throw new Error('Could not find login button')
      await loginBtn.click()

      // Wait for the app to load after login
      await page.waitForTimeout(5000)
      console.log('Logged in successfully')
    } catch (err) {
      console.error('LOGIN FAILED:', err.message)
      console.error('The Tradovate UI may have changed. Check the selectors in this script.')
      await browser.close()
      process.exit(1)
    }

    // Step 3: Navigate to account performance / trade history
    console.log('Looking for trade history / export option...')
    // This is best-effort — Tradovate's UI changes frequently.
    // If auto-navigation fails, the user can manually navigate and we'll wait.
    try {
      // Try clicking on "Account" or "Performance" menu items
      const accountLink = await page.$('text=Account') || await page.$('text=Performance') || await page.$('[data-testid="account"]')
      if (accountLink) await accountLink.click()
      await page.waitForTimeout(2000)
    } catch {
      console.log('Could not auto-navigate to account section. Please navigate manually in the browser.')
    }

    // Step 4: Trigger CSV download
    console.log('Attempting to trigger CSV export...')
    let downloadPath = null
    try {
      // Look for export/download buttons
      const exportBtn = await page.$('text=Export') || await page.$('text=Download') || await page.$('text=CSV') || await page.$('[title="Export"]')
      if (!exportBtn) {
        console.log('Could not find export button automatically.')
        console.log('Please manually export your trade history CSV in the browser window.')
        console.log('Waiting up to 2 minutes for a CSV download...')
      } else {
        await exportBtn.click()
      }

      // Wait for download
      const download = await page.waitForEvent('download', { timeout: 120000 })
      downloadPath = await download.path()
      console.log('CSV downloaded:', download.suggestedFilename())
    } catch (err) {
      console.error('DOWNLOAD FAILED:', err.message)
      console.error('Could not capture a CSV download. Try exporting manually and using the in-app import instead.')
      await browser.close()
      process.exit(1)
    }

    // Step 5: Parse CSV
    console.log('Parsing CSV...')
    const csvText = readFileSync(downloadPath, 'utf-8')
    const rows = parseCSV(csvText)
    const trades = rows.map(mapTradovateRow).filter(Boolean)
    console.log(`Parsed ${trades.length} trades from CSV`)

    if (trades.length === 0) {
      console.log('No valid trades found in CSV. Check the file format.')
      await browser.close()
      process.exit(0)
    }

    // Step 6: Deduplicate
    console.log('Checking for duplicates...')
    const { data: existing } = await supabase.from('trades').select('date,symbol,entry_price,direction')
    const existingKeys = new Set(
      (existing ?? []).map(t => `${t.date}|${t.symbol}|${t.entry_price}|${t.direction}`)
    )
    const newTrades = trades.filter(t =>
      !existingKeys.has(`${t.date}|${t.symbol}|${t.entry_price}|${t.direction}`)
    )
    const skipped = trades.length - newTrades.length

    // Step 7: Insert
    if (newTrades.length > 0) {
      console.log(`Inserting ${newTrades.length} new trades...`)
      const { error } = await supabase.from('trades').insert(newTrades)
      if (error) {
        console.error('INSERT FAILED:', error.message)
        await browser.close()
        process.exit(1)
      }
    }

    console.log(`\nDone! ${newTrades.length} new trades imported, ${skipped} duplicates skipped.`)
  } finally {
    await browser.close()
  }
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
