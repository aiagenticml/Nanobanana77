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

/** Average win value. */
export function getAvgWin(trades) {
  const wins = trades.filter(t => resolvePnL(t) > 0)
  if (wins.length === 0) return null
  return wins.reduce((s, t) => s + resolvePnL(t), 0) / wins.length
}

/** Average loss value (returned as negative). */
export function getAvgLoss(trades) {
  const losses = trades.filter(t => resolvePnL(t) < 0)
  if (losses.length === 0) return null
  return losses.reduce((s, t) => s + resolvePnL(t), 0) / losses.length
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

/** Group trades by asset symbol with stats. */
export function getTradesByAsset(trades) {
  const map = {}
  for (const t of trades) {
    if (!map[t.symbol]) map[t.symbol] = []
    map[t.symbol].push(t)
  }
  return Object.entries(map).map(([symbol, group]) => {
    const closed = group.filter(g => g.exit_price != null)
    const wins = closed.filter(g => resolvePnL(g) > 0).length
    const total = getTotalPnL(group)
    return {
      symbol,
      count: group.length,
      closed: closed.length,
      wins,
      winRate: closed.length > 0 ? wins / closed.length : null,
      totalPnL: total,
    }
  }).sort((a, b) => b.count - a.count)
}

/** Time-of-day stats. Groups by entry_time hour and calculates winrate per hour. */
export function getTimeOfDayStats(trades) {
  const hourMap = {}
  for (const t of trades) {
    if (!t.entry_time || t.exit_price == null) continue
    const hour = parseInt(t.entry_time.split(':')[0], 10)
    if (isNaN(hour)) continue
    if (!hourMap[hour]) hourMap[hour] = { total: 0, wins: 0 }
    hourMap[hour].total++
    if (resolvePnL(t) > 0) hourMap[hour].wins++
  }
  return Object.entries(hourMap).map(([hour, stats]) => ({
    hour: parseInt(hour),
    label: `${String(hour).padStart(2, '0')}:00`,
    total: stats.total,
    wins: stats.wins,
    winRate: stats.total > 0 ? stats.wins / stats.total : 0,
  })).sort((a, b) => a.hour - b.hour)
}

/** Trade duration stats. Groups by duration bucket and calculates winrate. */
export function getTradeDurationStats(trades) {
  const buckets = {
    '<1h': { min: 0, max: 60, total: 0, wins: 0 },
    '1-4h': { min: 60, max: 240, total: 0, wins: 0 },
    '4-8h': { min: 240, max: 480, total: 0, wins: 0 },
    '1d': { min: 480, max: 1440, total: 0, wins: 0 },
    '2-3d': { min: 1440, max: 4320, total: 0, wins: 0 },
    '4d+': { min: 4320, max: Infinity, total: 0, wins: 0 },
  }

  for (const t of trades) {
    if (!t.entry_time || !t.exit_time || !t.exit_date || t.exit_price == null) continue
    const entryDate = new Date(`${t.date}T${t.entry_time}`)
    const exitDate = new Date(`${t.exit_date || t.date}T${t.exit_time}`)
    const mins = (exitDate - entryDate) / 60000
    if (isNaN(mins) || mins < 0) continue

    for (const [, bucket] of Object.entries(buckets)) {
      if (mins >= bucket.min && mins < bucket.max) {
        bucket.total++
        if (resolvePnL(t) > 0) bucket.wins++
        break
      }
    }
  }

  return Object.entries(buckets)
    .filter(([, b]) => b.total > 0)
    .map(([label, b]) => ({
      label,
      total: b.total,
      wins: b.wins,
      winRate: b.total > 0 ? b.wins / b.total : 0,
    }))
}
