export default function PrivacyPolicy({ onBack }) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back</button>
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-bold text-gray-800">Privacy Policy</h1>
        <p className="text-xs text-gray-400">Last updated: March 2026</p>

        <section className="space-y-2 text-sm text-gray-700">
          <h2 className="font-semibold text-gray-800">1. What data we collect</h2>
          <p>When you create an account, we store your email address and a hashed password (managed by Supabase Auth). When you use the app, we store the financial data you enter: expenses, loans, subscriptions, categories, and settings (name, currency preference).</p>

          <h2 className="font-semibold text-gray-800">2. How we use your data</h2>
          <p>Your data is used solely to provide the Finance Planner service to you. We do not sell, share, or transfer your personal or financial data to third parties. We do not use your data for advertising or profiling.</p>

          <h2 className="font-semibold text-gray-800">3. Where your data is stored</h2>
          <p>All data is stored in a Supabase-managed PostgreSQL database. Supabase encrypts data at rest and in transit. Row Level Security (RLS) ensures that you can only access your own data.</p>

          <h2 className="font-semibold text-gray-800">4. Data retention</h2>
          <p>Your data is retained as long as your account exists. You can delete individual records at any time through the app. To delete your account and all associated data, contact us via the email below.</p>

          <h2 className="font-semibold text-gray-800">5. Your rights</h2>
          <p>You have the right to access, correct, export, or delete your personal data. Under GDPR and similar regulations, you may also request data portability or object to processing. To exercise these rights, email us.</p>

          <h2 className="font-semibold text-gray-800">6. Cookies</h2>
          <p>This app does not use tracking cookies. Supabase Auth uses secure HTTP-only session tokens stored in localStorage for authentication purposes only.</p>

          <h2 className="font-semibold text-gray-800">7. Contact</h2>
          <p>For privacy-related inquiries, contact the app administrator.</p>
        </section>
      </div>
    </div>
  )
}
