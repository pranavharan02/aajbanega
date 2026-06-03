import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service — आज क्या बनेगा?' }

export default function TermsPage() {
  return (
    <div className="py-8 max-w-lg mx-auto">
      <h1 className="text-[28px] font-bold text-[#2D2A26] mb-6">Terms of Service</h1>
      <div className="space-y-4 text-[15px] text-[#2D2A26] leading-relaxed">
        <p><strong>Last updated:</strong> June 2026</p>
        <p>By using आज क्या बनेगा? ("AajBanega"), you agree to these terms.</p>

        <h2 className="text-[18px] font-semibold mt-6">The service</h2>
        <p>AajBanega is a meal planning tool that generates weekly menus, provides recipes, and creates shopping lists for Indian households. Recipes are shared with your cook via a read-only link.</p>

        <h2 className="text-[18px] font-semibold mt-6">Your account</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>You're responsible for keeping your account secure.</li>
          <li>One household per account by default. You can invite others to join your household.</li>
          <li>You can delete your account at any time.</li>
        </ul>

        <h2 className="text-[18px] font-semibold mt-6">Content</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Recipes and nutritional data are for informational purposes. We don't guarantee nutritional accuracy.</li>
          <li>AI-generated menus are suggestions. Always check for allergies and dietary needs.</li>
          <li>Custom dishes you add remain yours.</li>
        </ul>

        <h2 className="text-[18px] font-semibold mt-6">Fair use</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Menu generation is rate-limited to prevent abuse.</li>
          <li>Don't use the service for commercial redistribution of recipes.</li>
          <li>Don't attempt to scrape or bulk-download the recipe database.</li>
        </ul>

        <h2 className="text-[18px] font-semibold mt-6">Availability</h2>
        <p>We aim for high availability but don't guarantee it. The service is provided "as is". We may modify or discontinue features with reasonable notice.</p>

        <h2 className="text-[18px] font-semibold mt-6">Contact</h2>
        <p>Questions? Email <strong>hello@aajbanega.com</strong></p>
      </div>
    </div>
  )
}
