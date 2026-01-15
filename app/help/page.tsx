import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Help Center",
  description: "Get help using CoachReflect. FAQs, guides, and support for football coaches.",
}

const faqs = [
  {
    question: "What is CoachReflect?",
    answer: "CoachReflect is an AI-powered reflection and journaling tool designed specifically for football coaches. It helps you track your coaching sessions, identify patterns over time, and grow as a coach through guided post-session reflections."
  },
  {
    question: "How do I create a reflection?",
    answer: "After logging in, click 'New Reflection' from the dashboard. You'll be guided through a series of questions about your session - what went well, what could be improved, and any notable player observations. The AI will then help you identify patterns and insights."
  },
  {
    question: "What's the difference between Free and Pro?",
    answer: "Free accounts get a limited number of reflections per month. Pro subscribers get unlimited reflections, AI-powered insights and summaries, session plan upload with AI analysis, and pattern detection across all your reflections."
  },
  {
    question: "How do I upload a session plan?",
    answer: "Pro subscribers can upload session plan images (diagrams, whiteboards, etc.) when creating a reflection. Our AI will analyze the plan and provide feedback on the session design."
  },
  {
    question: "Can I share my reflections with others?",
    answer: "Yes! Each reflection can be shared via a unique link. This is great for discussing sessions with mentors, other coaches, or for your own coaching portfolio."
  },
  {
    question: "How do I export my data?",
    answer: "Go to Settings > Account and click 'Export Data'. This will download all your reflections, sessions, and profile data as a JSON file."
  },
  {
    question: "How do I cancel my subscription?",
    answer: "Go to Settings > Subscription and click 'Manage Subscription'. This will take you to our payment portal where you can cancel or modify your subscription."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. Your data is stored securely using industry-standard encryption. We never share your coaching data with third parties for marketing purposes. See our Privacy Policy for full details."
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">CoachReflect</span>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-muted-foreground mb-8">Find answers to common questions about CoachReflect</p>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-3 mb-12">
          <Link
            href="/dashboard/reflect/new"
            className="p-4 border rounded-lg hover:border-amber-500 transition-colors"
          >
            <h3 className="font-semibold mb-1">Create a Reflection</h3>
            <p className="text-sm text-muted-foreground">Start reflecting on your latest session</p>
          </Link>
          <Link
            href="/dashboard/settings"
            className="p-4 border rounded-lg hover:border-amber-500 transition-colors"
          >
            <h3 className="font-semibold mb-1">Account Settings</h3>
            <p className="text-sm text-muted-foreground">Manage your profile and subscription</p>
          </Link>
          <a
            href="mailto:support@coachreflect.com"
            className="p-4 border rounded-lg hover:border-amber-500 transition-colors"
          >
            <h3 className="font-semibold mb-1">Contact Support</h3>
            <p className="text-sm text-muted-foreground">Get help from our team</p>
          </a>
        </div>

        {/* FAQs */}
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b pb-6">
              <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
          <p className="text-muted-foreground mb-4">
            Can not find what you are looking for? Our support team is here to help.
          </p>
          <a
            href="mailto:support@coachreflect.com"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Email Support
          </a>
        </div>

        <div className="mt-12 pt-6 border-t">
          <Link href="/" className="text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
