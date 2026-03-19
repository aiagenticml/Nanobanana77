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

// Extended currency list for overseas trip expenses
export const TRIP_CURRENCIES = {
  SGD: 'S$',
  USD: '$',
  EUR: '€',
  MYR: 'RM',
  GBP: '£',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  HKD: 'HK$',
  TWD: 'NT$',
  KRW: '₩',
  THB: '฿',
  IDR: 'Rp',
  PHP: '₱',
  VND: '₫',
  INR: '₹',
  NZD: 'NZ$',
  CAD: 'C$',
  CHF: 'Fr',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  AED: 'د.إ',
  SAR: '﷼',
  QAR: 'QR',
  KWD: 'KD',
  TRY: '₺',
  BRL: 'R$',
  ZAR: 'R',
  PLN: 'zł',
  CZK: 'Kč',
}

export function formatAmount(amount, currency = 'SGD') {
  const symbol = CURRENCIES[currency] ?? currency
  const num = parseFloat(amount || 0)
  return `${symbol} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
