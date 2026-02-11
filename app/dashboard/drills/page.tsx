import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { hasActiveSubscription } from "@/lib/subscription"
import { DrillLibrary } from "@/app/components/drill-library"

export default async function DrillsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const isPro = await hasActiveSubscription(user.id)

  return <DrillLibrary isPro={isPro} />
}
