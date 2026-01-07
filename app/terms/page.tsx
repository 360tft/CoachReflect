import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="text-xl font-bold">CoachReflect</span>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using CoachReflect, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground">
              CoachReflect is a reflective journaling application for football coaches.
              We provide tools for logging coaching sessions, capturing reflections,
              uploading session plans for AI analysis, and generating insights to improve coaching practice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 18 years old to use this service</li>
              <li>One person may not maintain multiple free accounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Subscription and Payments</h2>
            <p className="text-muted-foreground mb-2">
              CoachReflect offers free and paid subscription tiers:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Free tier: Limited to 5 reflections per month</li>
              <li>Pro tier ($7.99/month): Unlimited reflections, AI insights, session plan analysis</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Subscriptions automatically renew unless cancelled. You can cancel anytime through
              your account settings. Refunds are handled on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. User Content</h2>
            <p className="text-muted-foreground mb-2">
              You retain ownership of all content you create, including reflections and session plans.
              By using our service, you grant us a limited license to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Store and display your content to you</li>
              <li>Process your content with AI services to generate insights</li>
              <li>Create anonymized, aggregated data for service improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Acceptable Use</h2>
            <p className="text-muted-foreground mb-2">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Use the service for any illegal purpose</li>
              <li>Upload harmful, offensive, or inappropriate content</li>
              <li>Attempt to gain unauthorized access to the service</li>
              <li>Share your account credentials with others</li>
              <li>Use automated systems to access the service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. AI-Generated Content</h2>
            <p className="text-muted-foreground">
              Our AI features provide suggestions and insights based on your input.
              AI-generated content is provided for informational purposes only and should not
              replace professional coaching judgment. We do not guarantee the accuracy or
              suitability of AI-generated insights for any specific situation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The CoachReflect application, including its design, features, and branding,
              is owned by us and protected by intellectual property laws. You may not copy,
              modify, or distribute our application without permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              CoachReflect is provided "as is" without warranties of any kind. We are not
              liable for any indirect, incidental, or consequential damages arising from
              your use of the service. Our total liability is limited to the amount you
              paid for the service in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your account if you violate these terms.
              You may delete your account at any time. Upon termination, your right
              to use the service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these terms from time to time. Continued use of the service
              after changes constitutes acceptance of the new terms. We will notify you
              of significant changes via email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms are governed by the laws of England and Wales. Any disputes
              will be resolved in the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, contact us at{" "}
              <a href="mailto:support@coachreflect.com" className="text-primary hover:underline">
                support@coachreflect.com
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
