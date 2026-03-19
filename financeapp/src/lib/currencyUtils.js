export const CURRENCIES = {
  AUD: 'A$',
  CNY: '¥',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  MYR: 'RM',
  SGD: 'S$',
  USD: '$',
}

// Extended currency list for overseas trip expenses
export const TRIP_CURRENCIES = {
  AED: 'د.إ',
  AUD: 'A$',
  BRL: 'R$',
  CAD: 'C$',
  CHF: 'Fr',
  CNY: '¥',
  CZK: 'Kč',
  DKK: 'kr',
  EUR: '€',
  GBP: '£',
  HKD: 'HK$',
  IDR: 'Rp',
  INR: '₹',
  JPY: '¥',
  KRW: '₩',
  KWD: 'KD',
  MYR: 'RM',
  NOK: 'kr',
  NZD: 'NZ$',
  PHP: '₱',
  PLN: 'zł',
  QAR: 'QR',
  SAR: '﷼',
  SEK: 'kr',
  SGD: 'S$',
  THB: '฿',
  TRY: '₺',
  TWD: 'NT$',
  USD: '$',
  VND: '₫',
  ZAR: 'R',
}

export function formatAmount(amount, currency = 'SGD') {
  const symbol = CURRENCIES[currency] ?? currency
  const num = parseFloat(amount || 0)
  return `${symbol} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
