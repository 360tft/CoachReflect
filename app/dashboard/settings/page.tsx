import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { SUBSCRIPTION_LIMITS } from "@/app/types"
import { ProfileForm } from "./profile-form"
import { BillingToggle } from "./billing-toggle"
import { PushNotificationToggle } from "@/app/components/push-notification-prompt"

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
        }}
        email={user.email || ""}
      />

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive updates</CardDescription>
        </CardHeader>
        <CardContent>
          <PushNotificationToggle />
        </CardContent>
      </Card>

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
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Upgrade to Pro
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
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
    </div>
  )
}
