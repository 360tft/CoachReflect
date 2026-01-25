import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PlayerDetailClient } from "./player-detail-client"

interface Props {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: Props) {
  const { name } = await params
  const playerName = decodeURIComponent(name)
  const displayName = playerName.charAt(0).toUpperCase() + playerName.slice(1)

  return {
    title: `${displayName} - Player Development | Coach Reflection`,
    description: `Track ${displayName}'s development over time`,
  }
}

export default async function PlayerDetailPage({ params }: Props) {
  const { name } = await params
  const playerName = decodeURIComponent(name)

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

  // Player timeline is a Pro feature
  if (profile?.subscription_tier === "free") {
    redirect("/dashboard/players?upgrade=true")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PlayerDetailClient playerName={playerName} />
    </div>
  )
}
