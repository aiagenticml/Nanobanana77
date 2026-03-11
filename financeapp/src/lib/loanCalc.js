/**
 * Calculate monthly payment for a reducing balance loan (standard bank loan)
 * PMT = P * r / (1 - (1+r)^-n)
 */
export function calculateReducingPMT(principal, annualRate, termMonths) {
  if (annualRate === 0) return principal / termMonths
  const r = annualRate / 100 / 12
  const n = termMonths
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

/**
 * Calculate monthly payment for a flat rate loan
 * Total = P + (P * annualRate * years)
 * Monthly = Total / termMonths
 */
export function calculateFlatPMT(principal, annualRate, termMonths) {
  const years = termMonths / 12
  const totalInterest = principal * (annualRate / 100) * years
  const totalRepayment = principal + totalInterest
  return totalRepayment / termMonths
}

/**
 * Calculate total interest paid
 */
export function calculateTotalInterest(principal, annualRate, termMonths, loanType) {
  if (loanType === 'flat') {
    const years = termMonths / 12
    return principal * (annualRate / 100) * years
  }
  const pmt = calculateReducingPMT(principal, annualRate, termMonths)
  return pmt * termMonths - principal
}

/**
 * Generate full amortization schedule
 * Returns array of { month, openingBalance, interest, principalPaid, closingBalance, payment }
 */
export function generateAmortizationSchedule(loan) {
  const { principal, interest_rate, term_months, loan_type } = loan
  const schedule = []

  if (loan_type === 'flat') {
    const years = term_months / 12
    const totalInterest = principal * (interest_rate / 100) * years
    const monthlyInterest = totalInterest / term_months
    const monthlyPrincipal = principal / term_months
    const payment = monthlyPrincipal + monthlyInterest

    let balance = principal
    for (let i = 1; i <= term_months; i++) {
      const openingBalance = balance
      balance = Math.max(0, balance - monthlyPrincipal)
      schedule.push({
        month: i,
        openingBalance,
        interest: monthlyInterest,
        principalPaid: monthlyPrincipal,
        closingBalance: balance,
        payment,
      })
    }
  } else {
    // reducing balance
    const r = interest_rate / 100 / 12
    const pmt = calculateReducingPMT(principal, interest_rate, term_months)
    let balance = principal

    for (let i = 1; i <= term_months; i++) {
      const openingBalance = balance
      const interest = balance * r
      const principalPaid = pmt - interest
      balance = Math.max(0, balance - principalPaid)
      schedule.push({
        month: i,
        openingBalance,
        interest,
        principalPaid,
        closingBalance: balance,
        payment: pmt,
      })
    }
  }

  return schedule
}

/**
 * Get remaining balance as of today
 */
export function getRemainingBalance(loan) {
  const start = new Date(loan.start_date)
  const now = new Date()
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())

  if (monthsElapsed <= 0) return parseFloat(loan.principal)
  if (monthsElapsed >= loan.term_months) return 0

  const schedule = generateAmortizationSchedule(loan)
  return schedule[monthsElapsed - 1]?.closingBalance ?? 0
}

/**
 * Get payoff date string
 */
export function getPayoffDate(loan) {
  const start = new Date(loan.start_date)
  const payoff = new Date(start)
  payoff.setMonth(payoff.getMonth() + loan.term_months)
  return payoff.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })
}
