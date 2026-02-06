"use server"

import { redirect } from "next/navigation"

export async function signupFallback() {
  // Fallback for when JS hasn't hydrated and the browser submits the form natively.
  // Just redirect back to the signup page so the user can try again once JS loads.
  redirect("/signup")
}
