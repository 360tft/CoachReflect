import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatInterface } from "@/app/components/chat-interface"

export const metadata = {
  title: "Coach Chat | CoachReflect",
  description: "AI-powered coaching reflection conversations",
}

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get profile for subscription status
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("user_id", user.id)
    .single()

  const isSubscribed = profile?.subscription_tier !== "free"

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
    <div className="h-full">
      <ChatInterface isSubscribed={isSubscribed} initialRemaining={remaining} />
    </div>
  )
}
