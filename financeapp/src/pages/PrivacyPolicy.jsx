export default function PrivacyPolicy({ onBack }) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back</button>
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-bold text-gray-800">Privacy Policy</h1>
        <p className="text-xs text-gray-400">Last updated: March 2026</p>

        <section className="space-y-2 text-sm text-gray-700">
          <h2 className="font-semibold text-gray-800">1. Data Controller</h2>
          <p>Finance Planner ("[COMPANY_NAME]", "we", "us") is the data controller responsible for your personal data. Contact: [CONTACT_EMAIL].</p>

          <h2 className="font-semibold text-gray-800">2. What data we collect</h2>
          <p>When you create an account, we collect your email address and a hashed password (managed by Supabase Auth — we never see or store your plaintext password). When you use the app, we store the financial data you voluntarily enter: expenses (amounts, dates, categories, notes), loans (principal, interest rate, tenure), subscriptions (name, amount, billing cycle, due dates), custom categories, and settings (display name, currency preference).</p>

          <h2 className="font-semibold text-gray-800">3. Legal basis for processing</h2>
          <p>We process your data based on: (a) your consent when you create an account; (b) contractual necessity to provide the service; and (c) our legitimate interest in maintaining service security. You may withdraw consent at any time by deleting your account.</p>

          <h2 className="font-semibold text-gray-800">4. How we use your data</h2>
          <p>Your data is used solely to provide the Finance Planner service to you — displaying your expenses, calculating loan amortisation, and tracking subscriptions. We do not sell, rent, share, or transfer your personal or financial data to third parties. We do not use your data for advertising, profiling, or automated decision-making.</p>

          <h2 className="font-semibold text-gray-800">5. Third-party processors</h2>
          <p>We use the following third-party services to operate Finance Planner:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> (database hosting, authentication) — processes your account and financial data. <a href="https://supabase.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a></li>
            <li><strong>Vercel</strong> (web hosting) — serves the application. Does not process your financial data. <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a></li>
            <li><strong>Sentry</strong> (error monitoring, optional) — may receive anonymised error reports. No personally identifiable information or financial data is sent. <a href="https://sentry.io/privacy/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Sentry Privacy Policy</a></li>
          </ul>

          <h2 className="font-semibold text-gray-800">6. Where your data is stored</h2>
          <p>All data is stored in a Supabase-managed PostgreSQL database. Supabase encrypts data at rest (AES-256) and in transit (TLS 1.2+). Row Level Security (RLS) policies ensure that authenticated users can only access their own data. Our servers are located in [REGION — e.g., "Southeast Asia (Singapore)" or "US East"].</p>

          <h2 className="font-semibold text-gray-800">7. Data retention</h2>
          <p>Your data is retained for as long as your account exists. You can delete individual records at any time through the app. You may delete your entire account and all associated data from the Settings page. Upon account deletion, all your data is permanently removed from our database within 30 days (to allow for backup rotation).</p>

          <h2 className="font-semibold text-gray-800">8. Your rights</h2>
          <p>Depending on your jurisdiction, you may have the following rights under GDPR, PDPA, CCPA, or equivalent regulations:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access</strong> — request a copy of your data (available via "Export My Data" in Settings)</li>
            <li><strong>Rectification</strong> — correct inaccurate data (editable directly in the app)</li>
            <li><strong>Erasure</strong> — delete your account and all data ("Delete My Account & Data" in Settings)</li>
            <li><strong>Portability</strong> — export your data in a machine-readable format (JSON export in Settings)</li>
            <li><strong>Restriction / Objection</strong> — contact us to restrict or object to processing</li>
          </ul>
          <p>To exercise any right not available through the app, contact [CONTACT_EMAIL]. We will respond within 30 days.</p>

          <h2 className="font-semibold text-gray-800">9. Data breach notification</h2>
          <p>In the event of a data breach affecting your personal data, we will notify affected users via email and the relevant supervisory authority within 72 hours of becoming aware of the breach, as required by applicable law.</p>

          <h2 className="font-semibold text-gray-800">10. Children's privacy</h2>
          <p>Finance Planner is not intended for users under the age of 16. We do not knowingly collect data from children. If we discover that a child under 16 has created an account, we will promptly delete it.</p>

          <h2 className="font-semibold text-gray-800">11. Cookies and tracking</h2>
          <p>This app does not use tracking cookies, analytics cookies, or advertising pixels. Supabase Auth uses secure session tokens stored in the browser's localStorage for authentication purposes only. No third-party tracking is present.</p>

          <h2 className="font-semibold text-gray-800">12. Changes to this policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of material changes by posting a notice within the app. Continued use of the service after changes constitutes acceptance.</p>

          <h2 className="font-semibold text-gray-800">13. Contact</h2>
          <p>For privacy-related inquiries, data requests, or complaints, contact: [CONTACT_EMAIL]. If you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority.</p>
        </section>
      </div>
    </div>
  )
}
