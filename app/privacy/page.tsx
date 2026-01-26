import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Coach Reflection</span>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground">
              Coach Reflection (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and safeguard your information
              when you use our coaching reflection application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-2">We collect information you provide directly:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Account information (name, email, password)</li>
              <li>Profile information (club name, coaching level, age group)</li>
              <li>Session and reflection content you create</li>
              <li>Session plan images you upload</li>
              <li>Payment information (processed securely by Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>To provide and improve our services</li>
              <li>To process your reflections and generate AI insights</li>
              <li>To analyze session plan images you upload</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send service-related communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. AI Processing</h2>
            <p className="text-muted-foreground">
              We use AI services (Anthropic Claude) to analyze your session plans and reflections.
              Your content is sent to these services solely for generating insights and is not used
              to train AI models. We do not share your personal coaching data with third parties
              for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Storage and Security</h2>
            <p className="text-muted-foreground">
              Your data is stored securely using Supabase (PostgreSQL database with encryption at rest).
              We implement industry-standard security measures to protect your information.
              Session plan images are stored in secure cloud storage with access controls.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active. You can request deletion
              of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground mb-2">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Withdraw consent for optional processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Cookies</h2>
            <p className="text-muted-foreground">
              We use essential cookies for authentication and session management.
              We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Third-Party Services</h2>
            <p className="text-muted-foreground mb-2">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Supabase - Database and authentication</li>
              <li>Stripe - Payment processing</li>
              <li>Anthropic - AI analysis</li>
              <li>Vercel - Hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any
              significant changes via email or through the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or your data, please contact us at{" "}
              <a href="mailto:admin@360tft.com" className="text-primary hover:underline">
                admin@360tft.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
