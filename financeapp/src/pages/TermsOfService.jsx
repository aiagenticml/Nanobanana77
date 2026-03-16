export default function TermsOfService({ onBack }) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back</button>
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-bold text-gray-800">Terms of Service</h1>
        <p className="text-xs text-gray-400">Last updated: March 2026</p>

        <section className="space-y-2 text-sm text-gray-700">
          <h2 className="font-semibold text-gray-800">1. Acceptance</h2>
          <p>By creating an account or using Finance Planner, you agree to these terms. If you do not agree, do not use the service.</p>

          <h2 className="font-semibold text-gray-800">2. Description of service</h2>
          <p>Finance Planner is a personal finance tracking tool. It allows you to record expenses, loans, and subscriptions. The app is provided "as is" for personal use.</p>

          <h2 className="font-semibold text-gray-800">3. Your responsibilities</h2>
          <p>You are responsible for maintaining the security of your account credentials. You must not use the service for illegal purposes or attempt to access other users' data.</p>

          <h2 className="font-semibold text-gray-800">4. Data accuracy</h2>
          <p>Financial calculations (loan amortisation, totals) are provided for informational purposes only. They should not be relied upon as financial advice. Always verify calculations independently for important financial decisions.</p>

          <h2 className="font-semibold text-gray-800">5. Limitation of liability</h2>
          <p>The service is provided without warranty. We are not liable for any loss of data, financial loss, or damages arising from use of the app. Use the service at your own risk.</p>

          <h2 className="font-semibold text-gray-800">6. Termination</h2>
          <p>We may suspend or terminate accounts that violate these terms. You may stop using the service at any time.</p>

          <h2 className="font-semibold text-gray-800">7. Changes to terms</h2>
          <p>We may update these terms. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
        </section>
      </div>
    </div>
  )
}
