import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isAdminUser } from "@/lib/admin"
import { AdminDashboard } from "./admin-dashboard"

export const metadata = {
  title: "Admin Dashboard | CoachReflect",
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  if (!isAdminUser(user.email, user.id)) {
    redirect("/dashboard")
  }

  return <AdminDashboard />
}
