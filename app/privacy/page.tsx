import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy — आज क्या बनेगा?' }

export default function PrivacyPage() {
  return (
    <div className="py-8 max-w-lg mx-auto">
      <h1 className="text-[28px] font-bold text-[#2D2A26] mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-[15px] text-[#2D2A26] leading-relaxed">
        <p><strong>Last updated:</strong> June 2026</p>
        <p>आज क्या बनेगा? ("AajBanega", "we", "us") operates aajbanega.com. This policy describes how we collect, use, and protect your information.</p>

        <h2 className="text-[18px] font-semibold mt-6">What we collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account data:</strong> Email address or phone number when you sign up via Google or phone OTP.</li>
          <li><strong>Household data:</strong> Your name, meal preferences, cuisine choices, menus you generate, pantry inventory, and shopping lists.</li>
          <li><strong>Usage data:</strong> Pages visited, features used, and device information (via PostHog analytics).</li>
        </ul>

        <h2 className="text-[18px] font-semibold mt-6">How we use it</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To generate personalized meal plans and shopping lists.</li>
          <li>To share recipes with your cook via the cook view link.</li>
          <li>To improve the product based on aggregated usage patterns.</li>
        </ul>

        <h2 className="text-[18px] font-semibold mt-6">What we don't do</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>We don't sell your data to third parties.</li>
          <li>We don't show ads.</li>
          <li>We don't share your household data with other users unless you invite them.</li>
        </ul>

        <h2 className="text-[18px] font-semibold mt-6">Data storage</h2>
        <p>Your data is stored securely on Supabase (hosted on AWS in Mumbai, ap-south-1). Authentication is handled by Supabase Auth.</p>

        <h2 className="text-[18px] font-semibold mt-6">Cook view</h2>
        <p>The cook view is a read-only link. No account is needed to view recipes. We do not collect personal data from cook view visitors.</p>

        <h2 className="text-[18px] font-semibold mt-6">Your rights</h2>
        <p>You can delete your account and all associated data at any time from Settings. Email us at privacy@aajbanega.com for any requests.</p>

        <h2 className="text-[18px] font-semibold mt-6">Contact</h2>
        <p>For privacy questions: <strong>privacy@aajbanega.com</strong></p>
      </div>
    </div>
  )
}
