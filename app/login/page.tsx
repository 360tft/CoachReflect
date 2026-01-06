import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="text-4xl mb-4">🚀</div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            We're putting the finishing touches on this app. Sign up to be notified when we launch!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/">
            <Button variant="outline" className="w-full">
              ← Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
