# Legal Review Brief — Finance Planner App

**Prepared for:** Legal Counsel
**Date:** March 2026
**Purpose:** Review of Privacy Policy, Terms of Service, and overall legal posture before public launch

---

## 1. About the App

**Finance Planner** is a mobile-friendly web application (SPA) that allows users to:
- Track daily expenses (amounts, categories, dates, notes)
- Track loans (principal, interest rate, tenure, amortisation calculations)
- Track recurring subscriptions (billing cycle, due dates, amounts)
- View spending summaries and debt overviews

**What it is NOT:**
- NOT a financial advisor or licensed institution
- NOT a payment processor (no credit cards, no transfers, no banking integrations)
- NOT a tax preparation tool
- Does NOT connect to users' bank accounts
- Does NOT perform currency exchange or real transactions

**Business model (planned):** Freemium (free tier + paid features) via Play Store (Android) and web. No specific revenue model finalised yet.

**Target market:** Individual consumers (personal finance tracking). Initially targeting [REGION — e.g., Singapore/Southeast Asia] with potential global rollout.

---

## 2. Technology Stack

| Component | Service | Data Location |
|-----------|---------|---------------|
| Frontend | React SPA hosted on Vercel | No user data stored client-side (session token in localStorage only) |
| Backend/DB | Supabase (managed PostgreSQL) | [REGION — e.g., AWS ap-southeast-1] |
| Auth | Supabase Auth (email + password) | Passwords hashed by Supabase (bcrypt), never stored in plaintext |
| Error monitoring | Sentry (optional) | No PII or financial data sent; anonymised error reports only |

**Data in transit:** TLS 1.2+ enforced by both Vercel and Supabase
**Data at rest:** AES-256 encryption by Supabase's underlying infrastructure
**Access control:** Row Level Security (RLS) — each user can only read/write their own rows

---

## 3. Data Collected

| Data Type | Purpose | Sensitivity |
|-----------|---------|-------------|
| Email address | Account creation, password reset | PII |
| Hashed password | Authentication (bcrypt, managed by Supabase) | Credential |
| Display name | Personalisation (optional) | PII |
| Expense records | Core feature — amounts, dates, categories, notes | Financial PII |
| Loan records | Core feature — principal, rate, tenure, start date | Financial PII |
| Subscription records | Core feature — name, amount, cycle, due date | Financial PII |
| Currency preference | Display setting | Non-sensitive |
| Custom categories | User-defined expense categories | Non-sensitive |

**NOT collected:** Bank account numbers, credit card numbers, SSN/NRIC, physical addresses, phone numbers, biometric data, IP addresses (beyond Vercel/Supabase access logs we don't control), location data.

---

## 4. Documents for Review

### 4a. Privacy Policy
**Location in app:** Accessible from login screen and Settings
**File:** `src/pages/PrivacyPolicy.jsx`

**Key areas needing review:**
- [ ] Placeholder `[COMPANY_NAME]` — need to confirm legal entity name
- [ ] Placeholder `[CONTACT_EMAIL]` — need to confirm DPO/contact email
- [ ] Placeholder `[REGION]` — need to confirm Supabase data centre region
- [ ] Section 3 (Legal basis) — verify this is correct for target jurisdictions
- [ ] Section 7 (Data retention) — "30 days for backup rotation" — verify this aligns with Supabase's actual backup retention
- [ ] Section 9 (Breach notification) — "72 hours" is GDPR standard; confirm if PDPA or other local law requires different timeline
- [ ] Section 10 (Children) — age 16 threshold; confirm this is appropriate for target jurisdictions (COPPA uses 13, GDPR uses 16)
- [ ] Confirm whether we need explicit cookie consent banner (we don't use cookies, but localStorage session tokens may need disclosure in some jurisdictions)
- [ ] Confirm whether Supabase's DPA (Data Processing Agreement) is sufficient for our needs
- [ ] Confirm if we need to register as a data controller with any local authority

### 4b. Terms of Service
**Location in app:** Accessible from login screen
**File:** `src/pages/TermsOfService.jsx`

**Key areas needing review:**
- [ ] Placeholder `[COMPANY_NAME]` — legal entity name
- [ ] Placeholder `[CONTACT_EMAIL]` — contact email
- [ ] Placeholder `[JURISDICTION]` — governing law jurisdiction
- [ ] Section 5 (Financial disclaimer) — is the disclaimer strong enough to shield against liability from incorrect loan calculations?
- [ ] Section 9 (Limitation of liability) — verify enforceability in target jurisdictions; some consumer protection laws limit liability caps
- [ ] Section 10 (Indemnification) — may not be enforceable in all consumer jurisdictions (e.g., EU consumer protection)
- [ ] Section 13 (Governing law) — choose jurisdiction and verify it's appropriate
- [ ] Confirm whether we need an arbitration clause
- [ ] Confirm whether we need a class action waiver (relevant if targeting US users)
- [ ] Confirm if 14-day notice period for ToS changes is sufficient

---

## 5. Specific Legal Questions

### Liability
1. **Loan calculator accuracy:** Our app calculates loan amortisation (reducing balance and flat rate). If a user relies on these calculations and suffers financial loss, are we adequately protected by the current disclaimer?
2. **Data loss:** If Supabase experiences an outage and user data is lost, what is our maximum exposure? Is the "total liability capped at fees paid" clause enforceable?
3. **Data breach:** If user financial data is exposed due to a security breach, what are our notification obligations and potential penalties in [TARGET JURISDICTIONS]?

### Regulatory
4. **Financial regulation:** Does a personal expense/loan tracker require any financial services licence in [TARGET JURISDICTIONS]? (We do not hold, transfer, or advise on money.)
5. **PDPA/GDPR compliance:** Is our current Privacy Policy and data handling sufficient for compliance? Do we need to appoint a Data Protection Officer?
6. **Play Store requirements:** Google requires a privacy policy URL for apps that handle personal data. Is our current policy sufficient for Play Store review?

### Monetisation
7. **Freemium model:** If we gate features behind a paywall, do we need additional terms for paid users (refund policy, subscription cancellation terms)?
8. **In-app purchases via Play Store:** Google Play handles billing — do we need to reference Google Play's terms in our ToS?

---

## 6. Current Security Measures (for reference)

| Measure | Status |
|---------|--------|
| Email + password authentication | Implemented |
| Password minimum 8 characters | Implemented |
| Brute force protection (5 attempts, 30s lockout) | Implemented (client-side) |
| Row Level Security (per-user data isolation) | Implemented (Supabase RLS) |
| IDOR protection (user_id on all queries) | Implemented |
| Input validation (length limits, numeric bounds) | Implemented |
| XSS protection (React auto-escaping) | Built-in |
| SQL injection protection (parameterised queries) | Built-in (Supabase SDK) |
| HTTPS in production | Enforced (Vercel) |
| Data export (GDPR portability) | Implemented (JSON export in Settings) |
| Account deletion (GDPR erasure) | Implemented (Settings page) |
| Financial disclaimer | Displayed in app (Settings, ToS) |
| Error monitoring | Sentry (no PII sent) |

---

## 7. Action Items After Legal Review

After counsel provides feedback, we will need to:

1. Replace all `[PLACEHOLDER]` values in Privacy Policy and ToS with confirmed details
2. Register as data controller if required
3. Execute Supabase DPA if required
4. Add arbitration/class action clauses if recommended
5. Add refund/cancellation terms if monetising
6. Obtain any required financial services exemptions
7. Update age threshold if needed for target jurisdictions
8. Add cookie consent banner if required

---

## 8. Files Included

| File | Description |
|------|-------------|
| `src/pages/PrivacyPolicy.jsx` | In-app Privacy Policy (React component) |
| `src/pages/TermsOfService.jsx` | In-app Terms of Service (React component) |
| `LEGAL_REVIEW_BRIEF.md` | This document |
| `SECURITY.md` | Technical security documentation |
| `supabase/migrations/001_add_auth_and_rls.sql` | Database security policies |

---

*This brief is prepared to assist legal counsel in reviewing the app's legal posture. All `[PLACEHOLDER]` values need to be confirmed before launch.*
