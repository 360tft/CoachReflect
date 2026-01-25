import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { SUBSCRIPTION_LIMITS } from "@/app/types"
import { ProfileForm } from "./profile-form"
import { BillingToggle } from "./billing-toggle"
import { PushNotificationToggle } from "@/app/components/push-notification-prompt"
import { AccountActions } from "./account-actions"
import { CPDExport } from "./cpd-export"
import { EmailPreferences } from "./email-preferences"
import { ReminderSettings } from "./reminder-settings"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  const subscriptionTier = profile?.subscription_tier || "free"
  const limits = SUBSCRIPTION_LIMITS[subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile - Editable Form */}
      <ProfileForm
        profile={{
          display_name: profile?.display_name || null,
          club_name: profile?.club_name || null,
          age_group: profile?.age_group || null,
          coaching_level: profile?.coaching_level || null,
          sport: profile?.sport || null,
        }}
        email={user.email || ""}
      />

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>Get notified on your device</CardDescription>
        </CardHeader>
        <CardContent>
          <PushNotificationToggle />
        </CardContent>
      </Card>

      {/* Reflection Reminders */}
      <ReminderSettings />

      {/* Email Preferences */}
      <EmailPreferences
        weeklySummaryEnabled={profile?.weekly_summary_enabled ?? true}
        emailNotificationsEnabled={profile?.email_notifications_enabled ?? true}
      />

      {/* CPD Export */}
      <CPDExport isSubscribed={subscriptionTier !== "free"} />

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{subscriptionTier} Plan</p>
              <p className="text-sm text-muted-foreground">
                {subscriptionTier === "free"
                  ? `${profile?.reflections_this_month || 0}/${limits.reflections_per_month} reflections this month`
                  : "Unlimited reflections"
                }
              </p>
            </div>
            {subscriptionTier === "free" && (
              <div className="text-right">
                <p className="text-2xl font-bold">$7.99<span className="text-sm font-normal">/mo</span></p>
              </div>
            )}
          </div>

          {subscriptionTier === "free" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 dark:bg-background border border dark:border">
                <p className="font-medium text-primary dark:text-primary mb-2">
                  Upgrade to Pro
                </p>
                <ul className="text-sm text-primary dark:text-amber-300 space-y-1">
                  <li>• Unlimited reflections</li>
                  <li>• AI-powered insights and summaries</li>
                  <li>• Session plan upload with AI analysis</li>
                  <li>• Pattern detection across reflections</li>
                </ul>
              </div>
              <BillingToggle />
            </div>
          ) : (
            <form action="/api/stripe/portal" method="POST">
              <Button type="submit" variant="outline">
                Manage Subscription
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
          <CardDescription>Get help using Coach Reflection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Help Center</p>
              <p className="text-sm text-muted-foreground">
                FAQs and guides for getting the most out of Coach Reflection
              </p>
            </div>
            <Link href="/help">
              <Button variant="outline">View Help</Button>
            </Link>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Contact Support</p>
              <p className="text-sm text-muted-foreground">
                Need help? Reach out to our support team
              </p>
            </div>
            <a href="mailto:support@coachreflection.com">
              <Button variant="outline">Email Support</Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Refer a Coach */}
      <Card className="border dark:border bg-muted/50/50 dark:bg-background/30">
        <CardHeader>
          <CardTitle>Refer a Coach</CardTitle>
          <CardDescription>Share Coach Reflection with other coaches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Help other coaches improve their sessions with reflection. Coming soon: earn rewards for referrals.
              </p>
            </div>
            <Link href="/referral">
              <Button variant="outline" className="border dark:border-amber-700 hover:bg-primary/10 dark:hover:bg-primary/10/50">
                Learn More
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Account Management */}
      <AccountActions />
    </div>
  )
}
