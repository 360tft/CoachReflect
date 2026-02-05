import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent } from "@/app/components/ui/card"

export const metadata: Metadata = {
  title: "Page Not Found",
  description:
    "The page you are looking for does not exist on Coach Reflection. Browse our coaching journal features, blog, topics, and pricing instead.",
  robots: {
    index: false,
    follow: true,
  },
}

const popularPages = [
  { href: "/", label: "Homepage", description: "AI-powered coaching reflection and journalling" },
  { href: "/blog", label: "Blog", description: "Coaching development articles and insights" },
  { href: "/topics", label: "Topics", description: "Browse coaching reflection topics" },
  { href: "/#pricing", label: "Pricing", description: "Compare free and Pro plans" },
  { href: "/signup", label: "Sign Up", description: "Create your free account and start reflecting" },
]

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 heading */}
        <p className="text-primary text-sm font-semibold uppercase tracking-wide mb-2">
          Error 404
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Page not found
        </h1>
        <p className="text-lg text-muted-foreground mb-10">
          Sorry, we could not find the page you are looking for. It may have been moved or no longer exists.
        </p>

        {/* Popular pages */}
        <div className="text-left mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 text-center">
            Popular pages
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {popularPages.map((page, index) => (
              <Link key={index} href={page.href} className="group block">
                <Card className="hover:border-primary transition-colors h-full">
                  <CardContent className="p-4">
                    <span className="font-medium group-hover:text-primary transition-colors">
                      {page.label}
                    </span>
                    <span className="block text-sm text-muted-foreground mt-1">
                      {page.description}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Back to homepage */}
        <Link href="/">
          <Button size="lg">Back to Coach Reflection</Button>
        </Link>
      </div>
    </div>
  )
}
