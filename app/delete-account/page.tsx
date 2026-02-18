import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Delete Account - CoachReflection',
  description: 'Request deletion of your CoachReflection account and associated data',
}

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Delete Your Account</h1>

        <div className="space-y-6 text-muted-foreground">
          <p>
            You can delete your CoachReflection account and all associated data at any time.
          </p>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Option 1: Delete from the app</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Log in to your CoachReflection account</li>
              <li>Go to Settings</li>
              <li>Scroll down to &quot;Delete Account&quot;</li>
              <li>Click &quot;Delete Account&quot; and confirm</li>
            </ol>
            <div className="mt-4">
              <Link
                href="/login"
                className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
              >
                Log in to delete account
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Option 2: Request deletion via email</h2>
            <p className="mb-4">
              If you cannot access your account, email us at:
            </p>
            <a
              href="mailto:hello@send.coachreflection.com?subject=Account%20Deletion%20Request"
              className="text-primary hover:underline text-lg"
            >
              hello@send.coachreflection.com
            </a>
            <p className="mt-4 text-sm text-muted-foreground">
              Please include the email address associated with your account.
              We will process your request within 7 days.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">What data is deleted?</h2>
            <p className="mb-2">When you delete your account, we permanently delete:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Your profile information</li>
              <li>Your reflection history</li>
              <li>Your session plans and analysis</li>
              <li>Your preferences and settings</li>
              <li>Your subscription data</li>
              <li>Any other data associated with your account</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              This action is permanent and cannot be undone.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            For more information, see our{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
