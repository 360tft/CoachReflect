import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/app/components/ui/button"
import { BottomNav } from "@/app/components/bottom-nav"
import { PWAInstallPrompt } from "@/app/components/pwa-install-prompt"
import { ThemeToggle } from "@/app/components/theme-toggle"
import { isAdminUser } from "@/lib/admin"

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
  const isAdmin = isAdminUser(user.email, user.id)

  return (
    <div className="h-[100dvh] md:h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - fixed height */}
      <header className="border-b bg-card/80 backdrop-blur-sm shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            {/* Light mode logo (dark text) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CoachReflection" width={160} height={28} className="h-7 w-auto dark:hidden" />
            {/* Dark mode logo (white text) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.png" alt="CoachReflection" width={160} height={28} className="h-7 w-auto hidden dark:block" />
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {displayName}
            </span>
            {subscriptionTier === "free" && (
              <Link href="/dashboard/settings">
                <span className="text-xs bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary px-2 py-1 rounded-full">
                  Free
                </span>
              </Link>
            )}
            {subscriptionTier === "pro" && (
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                Pro
              </span>
            )}
            <ThemeToggle />
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Navigation - hidden on mobile where bottom nav is used */}
      <nav className="border-b bg-card hidden md:block shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/dashboard/chat">Reflect</NavLink>
            <NavLink href="/dashboard/history">History</NavLink>
            <NavLink href="/dashboard/analytics">Analytics</NavLink>
            <NavLink href="/dashboard/players">Players</NavLink>
            <NavLink href="/dashboard/drills">Drills</NavLink>
            <NavLink href="/dashboard/settings">Settings</NavLink>
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt variant="banner" />

      {/* Main content - fills remaining space, single scroll container */}
      <main className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-4 md:py-6 h-full">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
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
