import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PlayersListClient } from "./players-list-client"

export const metadata = {
  title: "Player Development | CoachReflection",
  description: "Track player development over time",
}

export default async function PlayersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get profile to check subscription
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("user_id", user.id)
    .single()

  const isSubscribed = profile?.subscription_tier !== "free"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Player Development</h1>
        <p className="text-muted-foreground">
          Track individual players mentioned in your reflections
        </p>
      </div>

      <PlayersListClient isSubscribed={isSubscribed} />
    </div>
  )
}
