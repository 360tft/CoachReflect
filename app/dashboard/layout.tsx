import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/app/components/ui/button"

async function signOut() {
  "use server"
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Check if we need to reset monthly reflection count
  if (profile) {
    const currentPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM
    if (profile.reflection_count_period !== currentPeriod) {
      // New month - reset the counter
      await supabase
        .from("profiles")
        .update({
          reflections_this_month: 0,
          reflection_count_period: currentPeriod
        })
        .eq("user_id", user.id)

      // Update local profile object
      profile.reflections_this_month = 0
      profile.reflection_count_period = currentPeriod
    }
  }

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Coach"
  const subscriptionTier = profile?.subscription_tier || "free"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🪞</span>
            <span className="font-bold text-lg text-amber-800 dark:text-amber-200">CoachReflect</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {displayName}
            </span>
            {subscriptionTier === "free" && (
              <Link href="/dashboard/settings">
                <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-1 rounded-full">
                  Free
                </span>
              </Link>
            )}
            {subscriptionTier === "pro" && (
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                Pro
              </span>
            )}
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/dashboard/reflect/new">New Reflection</NavLink>
            <NavLink href="/dashboard/chat">Coach Chat</NavLink>
            <NavLink href="/dashboard/history">History</NavLink>
            <NavLink href="/dashboard/settings">Settings</NavLink>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
    >
      {children}
    </Link>
  )
}
