import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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
import { SyllabusUpload } from "./syllabus-upload"
import { hasSyllabusFeature, getVoiceLimits, getTierDisplayName } from "@/lib/subscription"
import { NativeHidden } from "@/app/components/native-hidden"

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

  // Fetch syllabus
  const adminClient = createAdminClient()
  const { data: syllabus } = await adminClient
    .from('syllabi')
    .select('*')
    .eq('user_id', user.id)
    .is('club_id', null)
    .single()

  // Check if user is club member
  const { data: membership } = await adminClient
    .from('club_memberships')
    .select('club_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const isClubMember = !!membership?.club_id
  const canUploadSyllabus = hasSyllabusFeature(subscriptionTier, isClubMember)
  const voiceLimits = getVoiceLimits(subscriptionTier, isClubMember)
  const voiceNotesUsed = profile?.voice_notes_used_this_month || 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Subscription - FIRST */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{getTierDisplayName(subscriptionTier)} Plan</p>
              <p className="text-sm text-muted-foreground">
                {subscriptionTier === "free"
                  ? `${limits.messages_per_day} messages/day, ${limits.analytics_history_weeks * 7} days of history`
                  : "Unlimited messages and full history"
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
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="font-medium text-foreground mb-2">
                  Upgrade to Pro — Coach smarter
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Talk through sessions instead of typing</li>
                  <li>• Structured reflections that ask the right questions</li>
                  <li>• Upload session plans and get AI feedback</li>
                  <li>• AI spots patterns across your reflections</li>
                  <li>• Full history — nothing gets lost</li>
                </ul>
              </div>
              <BillingToggle />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-green-600 dark:text-green-400">You have {getTierDisplayName(subscriptionTier)} access</p>
              {profile?.stripe_customer_id ? (
                <NativeHidden>
                  <form action="/api/stripe/portal" method="POST">
                    <Button type="submit" variant="outline">
                      Manage Billing
                    </Button>
                  </form>
                </NativeHidden>
              ) : (
                <p className="text-xs text-muted-foreground">{getTierDisplayName(subscriptionTier)} access granted manually</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start a Club - for individual users */}
      {!isClubMember && (
        <Card>
          <CardHeader>
            <CardTitle>Start a Club</CardTitle>
            <CardDescription>Get your whole coaching team reflecting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="font-medium text-foreground mb-2">
                Club plans include Pro+ for every coach
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Unlimited voice notes + 12 full recordings per coach</li>
                <li>• Communication analysis and development blocks</li>
                <li>• Shared club syllabus — AI learns your philosophy</li>
                <li>• CPD documentation for every coach</li>
                <li>• Central billing for all coaches</li>
              </ul>
            </div>
            <Link href="/signup?plan=club">
              <Button variant="outline" className="w-full">
                View Club Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

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

      {/* Syllabus Upload */}
      <SyllabusUpload
        initialSyllabus={syllabus}
        canUpload={canUploadSyllabus}
        subscriptionTier={subscriptionTier}
      />

      {/* Voice Notes Usage */}
      {subscriptionTier !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle>Voice Notes</CardTitle>
            <CardDescription>Your monthly voice note usage</CardDescription>
          </CardHeader>
          <CardContent>
            {voiceLimits.isSharedPool ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{voiceNotesUsed} / {voiceLimits.shortPerMonth}</p>
                  <p className="text-sm text-muted-foreground">voice notes this month</p>
                </div>
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min((voiceNotesUsed / voiceLimits.shortPerMonth) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">
                      {voiceLimits.shortPerMonth === -1 ? 'Unlimited' : `${voiceNotesUsed} / ${voiceLimits.shortPerMonth}`}
                    </p>
                    <p className="text-sm text-muted-foreground">short voice notes</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">
                      {voiceLimits.fullPerMonth === -1 ? 'Unlimited' : `${voiceLimits.fullPerMonth}/month`}
                    </p>
                    <p className="text-sm text-muted-foreground">full session recordings</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CPD Export */}
      <CPDExport isSubscribed={subscriptionTier !== "free"} />

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
            <a href="mailto:admin@360tft.com">
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
