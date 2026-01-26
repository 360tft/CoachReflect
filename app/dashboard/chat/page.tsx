import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatInterface } from "@/app/components/chat-interface"
import { ProfilePrompt } from "@/app/components/profile-prompt"

export const metadata = {
  title: "Coach Chat | Coach Reflection",
  description: "AI-powered coaching reflection conversations",
}

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get profile for subscription status and profile completeness
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, display_name, age_group, coaching_level, sport")
    .eq("user_id", user.id)
    .single()

  const isSubscribed = profile?.subscription_tier !== "free"

  // Check if profile is complete enough
  const isProfileComplete = !!(
    profile?.display_name &&
    profile?.age_group &&
    profile?.sport
  )

  // Get today's message count for free tier
  let remaining = 5
  if (!isSubscribed) {
    const today = new Date().toISOString().split("T")[0]
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00.000Z`)
      .eq("role", "user")

    remaining = Math.max(0, 5 - (count || 0))
  }

  return (
    <div className="h-full flex flex-col">
      {!isProfileComplete && <ProfilePrompt />}
      <div className="flex-1">
        <ChatInterface isSubscribed={isSubscribed} initialRemaining={remaining} />
      </div>
    </div>
  )
}
