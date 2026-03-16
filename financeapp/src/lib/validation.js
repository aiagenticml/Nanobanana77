const MAX_AMOUNT = 100_000_000
const MAX_STRING = 500

export function validateExpense(data) {
  if (typeof data.amount !== 'number' || !isFinite(data.amount) || data.amount <= 0 || data.amount > MAX_AMOUNT) {
    throw new Error('Amount must be between 0 and 100,000,000')
  }
  if (data.notes && typeof data.notes === 'string' && data.notes.length > MAX_STRING) {
    throw new Error(`Notes must be under ${MAX_STRING} characters`)
  }
}

export function validateLoan(data) {
  if (typeof data.principal !== 'number' || !isFinite(data.principal) || data.principal <= 0 || data.principal > MAX_AMOUNT) {
    throw new Error('Principal must be between 0 and 100,000,000')
  }
  if (typeof data.interest_rate !== 'number' || !isFinite(data.interest_rate) || data.interest_rate < 0 || data.interest_rate > 100) {
    throw new Error('Interest rate must be between 0 and 100')
  }
  if (typeof data.term_months !== 'number' || !isFinite(data.term_months) || data.term_months < 1 || data.term_months > 600) {
    throw new Error('Loan tenure must be between 1 and 600 months')
  }
  if (data.name && typeof data.name === 'string' && data.name.length > 200) {
    throw new Error('Loan name must be under 200 characters')
  }
}

export function validateSubscription(data) {
  if (typeof data.amount !== 'number' || !isFinite(data.amount) || data.amount <= 0 || data.amount > MAX_AMOUNT) {
    throw new Error('Amount must be between 0 and 100,000,000')
  }
  if (data.name && typeof data.name === 'string' && data.name.length > 200) {
    throw new Error('Service name must be under 200 characters')
  }
}
