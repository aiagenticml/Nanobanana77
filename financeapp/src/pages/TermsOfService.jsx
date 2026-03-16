export default function TermsOfService({ onBack }) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back</button>
      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-bold text-gray-800">Terms of Service</h1>
        <p className="text-xs text-gray-400">Last updated: March 2026</p>

        <section className="space-y-2 text-sm text-gray-700">
          <h2 className="font-semibold text-gray-800">1. Acceptance of Terms</h2>
          <p>By creating an account or using Finance Planner ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use the Service. These Terms constitute a legally binding agreement between you and [COMPANY_NAME] ("we", "us", "our").</p>

          <h2 className="font-semibold text-gray-800">2. Description of Service</h2>
          <p>Finance Planner is a personal finance tracking tool that allows you to record expenses, track loans, and manage subscriptions. The Service is provided "as is" and "as available" for personal, non-commercial use. We do not guarantee uninterrupted access or error-free operation.</p>

          <h2 className="font-semibold text-gray-800">3. Eligibility</h2>
          <p>You must be at least 16 years of age to use the Service. By using the Service, you represent that you meet this requirement and have the legal capacity to enter into these Terms.</p>

          <h2 className="font-semibold text-gray-800">4. Account Responsibilities</h2>
          <p>You are responsible for: (a) maintaining the confidentiality of your account credentials; (b) all activities that occur under your account; (c) the accuracy of the data you enter into the Service. You must not share your account credentials or attempt to access other users' data.</p>

          <h2 className="font-semibold text-gray-800">5. Not Financial Advice — Important Disclaimer</h2>
          <p><strong>The Service is a personal tracking tool for informational purposes only. It does not constitute financial, investment, tax, or legal advice.</strong> Financial calculations including but not limited to loan amortisation schedules, interest calculations, spending totals, and debt summaries are approximate and provided for reference only. They should not be relied upon for making financial decisions. Always consult a qualified financial professional before making important financial decisions. We are not a licensed financial advisor, broker, or institution.</p>

          <h2 className="font-semibold text-gray-800">6. Data Accuracy</h2>
          <p>The accuracy of the information displayed by the Service depends entirely on the data you enter. We do not verify, validate, or guarantee the accuracy of your financial records. Calculation results (loan payments, totals, etc.) are approximations and may differ from actual bank or institutional calculations.</p>

          <h2 className="font-semibold text-gray-800">7. Prohibited Use</h2>
          <p>You must not: (a) use the Service for any illegal purpose; (b) attempt to gain unauthorised access to other users' data or the underlying infrastructure; (c) use automated tools to scrape, overload, or abuse the Service; (d) upload malicious content or attempt to exploit vulnerabilities; (e) use the Service to launder money, evade taxes, or facilitate fraud.</p>

          <h2 className="font-semibold text-gray-800">8. Intellectual Property</h2>
          <p>The Service, including its design, code, and branding, is owned by [COMPANY_NAME]. Your data remains yours — we claim no ownership over the financial data you enter. You grant us a limited licence to store and process your data solely to provide the Service.</p>

          <h2 className="font-semibold text-gray-800">9. Limitation of Liability</h2>
          <p><strong>To the maximum extent permitted by applicable law, [COMPANY_NAME] shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to: loss of data, loss of profits, financial loss, or damages arising from reliance on calculations provided by the Service.</strong> Our total liability for any claim arising from or related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim (or $0 if the Service is free). This limitation applies regardless of the theory of liability (contract, tort, strict liability, or otherwise).</p>

          <h2 className="font-semibold text-gray-800">10. Indemnification</h2>
          <p>You agree to indemnify and hold harmless [COMPANY_NAME] and its officers, directors, and employees from any claims, damages, losses, or expenses (including legal fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) financial decisions you make based on information displayed by the Service.</p>

          <h2 className="font-semibold text-gray-800">11. Service Availability</h2>
          <p>We reserve the right to modify, suspend, or discontinue the Service (or any part of it) at any time, with or without notice. We will make reasonable efforts to provide advance notice for planned disruptions. We are not liable for any modification, suspension, or discontinuation of the Service.</p>

          <h2 className="font-semibold text-gray-800">12. Termination</h2>
          <p>We may suspend or terminate your account if you violate these Terms or engage in conduct that we reasonably believe is harmful to the Service or other users. You may terminate your account at any time from the Settings page. Upon termination, your data will be permanently deleted in accordance with our Privacy Policy.</p>

          <h2 className="font-semibold text-gray-800">13. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of [JURISDICTION — e.g., "Singapore" or "the State of California, USA"]. Any disputes arising from these Terms shall be resolved in the courts of [JURISDICTION].</p>

          <h2 className="font-semibold text-gray-800">14. Changes to Terms</h2>
          <p>We may update these Terms from time to time. We will notify you of material changes by posting a notice within the app at least 14 days before the changes take effect. Continued use of the Service after changes constitutes acceptance of the updated Terms. If you disagree with the changes, you must stop using the Service and delete your account.</p>

          <h2 className="font-semibold text-gray-800">15. Severability</h2>
          <p>If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>

          <h2 className="font-semibold text-gray-800">16. Contact</h2>
          <p>For questions about these Terms, contact: [CONTACT_EMAIL].</p>
        </section>
      </div>
    </div>
  )
}
