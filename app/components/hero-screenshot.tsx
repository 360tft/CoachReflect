'use client'

// Mock chat interface for hero section
// Shows a sample coaching reflection conversation to demonstrate product value

export function HeroScreenshot() {
  return (
    <div className="mt-16 relative max-w-4xl mx-auto">

      {/* Mock chat container */}
      <div className="rounded-xl shadow-2xl overflow-hidden border border-border bg-card">
        {/* Header bar */}
        <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-sm font-medium text-muted-foreground">CoachReflection</span>
          </div>
          <div className="w-16" /> {/* Spacer for symmetry */}
        </div>

        {/* Chat messages */}
        <div className="p-4 sm:p-6 space-y-4 bg-background min-h-[320px]">
          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
              <p className="text-sm">The rondo was brilliant today - Mia and Sophie were pinging it around. But the 5v5 was chaotic, players kept bunching up. Lily struggled with confidence again.</p>
            </div>
          </div>

          {/* AI response */}
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
              <p className="text-sm text-foreground leading-relaxed">
                It sounds like a productive session! A few things stood out:
              </p>
              <p className="text-sm text-foreground leading-relaxed mt-2">
                <strong className="text-primary">What worked:</strong> The rondo clicked - Mia and Sophie passing well is exactly what you&apos;re building toward.
              </p>
              <p className="text-sm text-foreground leading-relaxed mt-2">
                <strong className="text-primary">To explore:</strong> The bunching in 5v5 is common at this age. What cue were you using for spacing?
              </p>
              <p className="text-sm text-foreground leading-relaxed mt-2">
                <strong className="text-primary">About Lily:</strong> You&apos;ve mentioned her confidence before - has this been a pattern in open play situations?
              </p>
            </div>
          </div>

          {/* User follow-up */}
          <div className="flex justify-end">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
              <p className="text-sm">Yeah, Lily always seems to hide from the ball in games</p>
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <div className="flex gap-2">
            <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2">
              <span className="text-sm text-muted-foreground">Reflect on your session...</span>
            </div>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="mt-4 text-sm text-muted-foreground text-center">
        AI remembers your players and spots patterns across sessions
      </p>
    </div>
  )
}
