export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-600 mb-8">
            <strong>Effective Date:</strong> December 26, 2025
          </p>

          <div className="space-y-6 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">1. Introduction</h2>
              <p>
                Welcome to <strong>CrashKart</strong>. We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">2. Information We Collect</h2>
              <p className="mb-2">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                <li><strong>Profile Information:</strong> Profile picture, preferences, and settings</li>
                <li><strong>Order Information:</strong> Shipping address, billing information, purchase history</li>
                <li><strong>Payment Information:</strong> Credit card details processed securely through our payment providers</li>
                <li><strong>Communication Data:</strong> Messages, reviews, and feedback you provide</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">3. How We Use Your Information</h2>
              <p className="mb-2">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Process and fulfill your orders</li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>Send you order confirmations, shipping updates, and other transactional emails</li>
                <li>Personalize your shopping experience</li>
                <li>Improve our products, services, and website</li>
                <li>Detect and prevent fraud or unauthorized activities</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">4. Information Sharing</h2>
              <p className="mb-2">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Service Providers:</strong> Third-party companies that help us operate our business (e.g., payment processors, shipping companies)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulations</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">6. Your Rights</h2>
              <p className="mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access and review your personal information</li>
                <li>Update or correct inaccurate information</li>
                <li>Delete your account and personal data</li>
                <li>Opt-out of marketing communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">7. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">8. Third-Party Links</h2>
              <p>
                Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">9. Children's Privacy</h2>
              <p>
                Our services are not intended for children under the age of 13. We do not knowingly collect personal information from children. If we discover we have collected information from a child, we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. Your continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">11. Contact Us</h2>
              <p className="mb-2">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <ul className="list-none space-y-1">
                <li><strong>Email:</strong> crashkart.help@gmail.com</li>
                <li><strong>Phone:</strong> 1-800-CRASH-KART (1-800-2727-5278)</li>
              </ul>
            </section>

            <section className="border-t pt-6 mt-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Google OAuth Integration</h2>
              <p>
                CrashKart uses Google OAuth for secure authentication. When you sign in with Google, we only access your basic profile information (name, email, profile picture) as permitted by Google's API. We do not access or store your Google password.
              </p>
              <p className="mt-2">
                By using Google Sign-In, you agree to Google's Terms of Service and Privacy Policy. For more information about how Google handles your data, please visit{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Google's Privacy Policy
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
