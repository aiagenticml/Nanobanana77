export const CURRENCIES = {
  SGD: 'S$',
  USD: '$',
  EUR: '€',
  MYR: 'RM',
  GBP: '£',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
}

export function formatAmount(amount, currency = 'SGD') {
  const symbol = CURRENCIES[currency] ?? currency
  const num = parseFloat(amount || 0)
  return `${symbol} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
