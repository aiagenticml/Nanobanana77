/**
 * All trade analytics — pure functions, no dependencies.
 */

/** Calculate P&L for a single trade from its prices. */
export function calcPnL(trade) {
  if (trade.exit_price == null || trade.entry_price == null) return null
  const diff = trade.direction === 'long'
    ? trade.exit_price - trade.entry_price
    : trade.entry_price - trade.exit_price
  return diff * trade.size
}

/** Resolve P&L: use stored value if set, otherwise calculate. */
export function resolvePnL(trade) {
  if (trade.pnl != null) return parseFloat(trade.pnl)
  return calcPnL(trade) ?? 0
}

/** Win rate as a value 0–1. Returns null if no closed trades. */
export function getWinRate(trades) {
  const closed = trades.filter(t => resolvePnL(t) !== 0 || t.exit_price != null)
  if (closed.length === 0) return null
  const wins = closed.filter(t => resolvePnL(t) > 0)
  return wins.length / closed.length
}

/** Profit factor = gross profit / gross loss. Returns null if no losses. */
export function getProfitFactor(trades) {
  let grossProfit = 0
  let grossLoss = 0
  for (const t of trades) {
    const pnl = resolvePnL(t)
    if (pnl > 0) grossProfit += pnl
    else if (pnl < 0) grossLoss += Math.abs(pnl)
  }
  if (grossLoss === 0) return grossProfit > 0 ? Infinity : null
  return grossProfit / grossLoss
}

/** Average win / average |loss| ratio. Returns null if missing data. */
export function getAvgRR(trades) {
  const wins = trades.filter(t => resolvePnL(t) > 0)
  const losses = trades.filter(t => resolvePnL(t) < 0)
  if (wins.length === 0 || losses.length === 0) return null
  const avgWin = wins.reduce((s, t) => s + resolvePnL(t), 0) / wins.length
  const avgLoss = losses.reduce((s, t) => s + Math.abs(resolvePnL(t)), 0) / losses.length
  return avgWin / avgLoss
}

/**
 * Running equity curve sorted by date ascending.
 * Returns [{date, value}] where value is cumulative P&L.
 */
export function getEquityCurve(trades) {
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))
  let running = 0
  return sorted.map(t => {
    running += resolvePnL(t)
    return { date: t.date, value: running }
  })
}

/** Max drawdown (as a positive number) from the equity curve. */
export function getMaxDrawdown(trades) {
  const curve = getEquityCurve(trades)
  if (curve.length === 0) return 0
  let peak = curve[0].value
  let maxDd = 0
  for (const point of curve) {
    if (point.value > peak) peak = point.value
    const dd = peak - point.value
    if (dd > maxDd) maxDd = dd
  }
  return maxDd
}

/** Current consecutive win or loss streak. Returns {type: 'win'|'loss'|null, count}. */
export function getStreaks(trades) {
  const sorted = [...trades]
    .filter(t => t.exit_price != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  if (sorted.length === 0) return { type: null, count: 0 }
  const first = resolvePnL(sorted[0]) >= 0 ? 'win' : 'loss'
  let count = 0
  for (const t of sorted) {
    const isWin = resolvePnL(t) >= 0
    if ((first === 'win') === isWin) count++
    else break
  }
  return { type: first, count }
}

/** Total P&L across all trades. */
export function getTotalPnL(trades) {
  return trades.reduce((sum, t) => sum + resolvePnL(t), 0)
}
