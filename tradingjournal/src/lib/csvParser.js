/**
 * CSV parser with auto-detection for MT5 and Tradovate trade exports.
 * Used by both the in-app ImportModal and the Playwright import script.
 */

// --- Generic CSV parsing ---

function parseCSVText(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = splitCSVLine(lines[0])
  const rows = lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = splitCSVLine(line)
      const obj = {}
      headers.forEach((h, i) => { obj[h.trim()] = (values[i] ?? '').trim() })
      return obj
    })

  return { headers: headers.map(h => h.trim()), rows }
}

function splitCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else if (ch === '\t' && !inQuotes) {
      // Handle tab-separated (some MT5 exports use tabs)
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// --- Platform detection ---

const MT5_MARKERS = ['Open Price', 'Close Price', 'Volume', 'Open Time']
const TRADOVATE_MARKERS = ['B/S', 'Qty', 'Avg Price', 'Fill Time']

export function detectPlatform(headers) {
  const headerSet = new Set(headers.map(h => h.toLowerCase()))

  const mt5Hits = MT5_MARKERS.filter(m => headerSet.has(m.toLowerCase())).length
  const tradovateHits = TRADOVATE_MARKERS.filter(m => headerSet.has(m.toLowerCase())).length

  if (mt5Hits >= 2) return 'mt5'
  if (tradovateHits >= 2) return 'tradovate'
  return 'unknown'
}

// --- MT5 mapping ---

function mapMT5Row(row) {
  const symbol = (row['Symbol'] || '').toUpperCase()
  const typeRaw = (row['Type'] || '').toLowerCase()

  // MT5 types: "buy" / "sell" for market orders, also "buy limit", "buy stop", etc.
  let direction = null
  if (typeRaw.includes('buy')) direction = 'long'
  else if (typeRaw.includes('sell')) direction = 'short'
  if (!direction) return null // skip non-trade rows (balance, deposit, etc.)

  const entryPrice = parseFloat(row['Open Price'] || row['Price'])
  const exitPrice = parseFloat(row['Close Price'] || row['S / L'] || '')
  const size = parseFloat(row['Volume'] || row['Lots'] || '')
  const pnl = parseFloat(row['Profit'] || row['Total PnL'] || '')

  // Parse date from "Open Time" or "Open Date/Time"
  const dateRaw = row['Open Time'] || row['Open Date/Time'] || row['Date'] || ''
  const date = parseDateString(dateRaw)

  if (!symbol || !date || isNaN(entryPrice) || isNaN(size)) return null

  // Detect instrument: 6-char symbols like EURUSD are forex, others are futures
  const instrument = symbol.length === 6 && /^[A-Z]+$/.test(symbol) ? 'forex' : 'futures'

  return {
    date,
    symbol,
    instrument,
    direction,
    entry_price: entryPrice,
    exit_price: isNaN(exitPrice) ? null : exitPrice,
    size,
    pnl: isNaN(pnl) ? null : pnl,
  }
}

// --- Tradovate mapping ---

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
    date,
    symbol,
    instrument: 'futures', // Tradovate is futures-only
    direction,
    entry_price: entryPrice,
    exit_price: isNaN(exitPrice) ? null : exitPrice,
    size,
    pnl: isNaN(pnl) ? null : pnl,
  }
}

// --- Helpers ---

function parseDateString(raw) {
  if (!raw) return null
  // Handle formats: "2024.03.15 10:30:00", "2024-03-15", "03/15/2024", "2024/03/15"
  const cleaned = raw.replace(/\./g, '-').trim()
  const d = new Date(cleaned)
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0] // YYYY-MM-DD
}

// --- Main export ---

export function parseTradeCSV(text, currency = 'USD') {
  const { headers, rows } = parseCSVText(text)
  if (rows.length === 0) return { platform: 'unknown', trades: [], headers }

  const platform = detectPlatform(headers)
  const mapper = platform === 'tradovate' ? mapTradovateRow : mapMT5Row

  const trades = rows
    .map(row => mapper(row))
    .filter(Boolean)
    .map(trade => ({ ...trade, currency }))

  return { platform, trades, headers }
}

// --- Deduplication ---

export function deduplicateTrades(newTrades, existingTrades) {
  const existingKeys = new Set(
    existingTrades.map(t => `${t.date}|${t.symbol}|${t.entry_price}|${t.direction}`)
  )

  const unique = []
  const duplicates = []

  for (const trade of newTrades) {
    const key = `${trade.date}|${trade.symbol}|${trade.entry_price}|${trade.direction}`
    if (existingKeys.has(key)) duplicates.push(trade)
    else unique.push(trade)
  }

  return { unique, duplicates }
}
