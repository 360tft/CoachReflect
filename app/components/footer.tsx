import Link from 'next/link'
import { NativeHidden } from '@/app/components/native-hidden'

export function Footer() {
  return (
    <footer className="w-full py-6 sm:py-8 border-t border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        {/* SEO Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 max-w-3xl mx-auto text-center">
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-3">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/blog" className="text-muted-foreground hover:text-primary">Blog</Link></li>
              <li><Link href="/help" className="text-muted-foreground hover:text-primary">Help</Link></li>
              <li><Link href="/#pricing" className="text-muted-foreground hover:text-primary">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-3">Features</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/reflect/new" className="text-muted-foreground hover:text-primary">Reflect</Link></li>
              <li><Link href="/dashboard/history" className="text-muted-foreground hover:text-primary">History</Link></li>
              <li><Link href="/dashboard/chat" className="text-muted-foreground hover:text-primary">AI Chat</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-3">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/settings" className="text-muted-foreground hover:text-primary">Settings</Link></li>
              <li><Link href="/dashboard/referrals" className="text-muted-foreground hover:text-primary">Referrals</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-primary">Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* 360 TFT Ecosystem */}
        <NativeHidden>
        <div className="pt-6 border-t border-border">
          <p className="text-center text-muted-foreground text-xs mb-3">
            Part of the <a href="https://360tft.co.uk" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">360 TFT</a> ecosystem
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <a href="https://www.skool.com/coachingacademy" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              Coaching Academy
            </a>
            <a href="https://footballgpt.co" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              FootballGPT
            </a>
            <a href="https://refereegpt.co" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              RefereeGPT
            </a>
          </div>
        </div>
        </NativeHidden>

        {/* Company Info */}
        <div className="text-center mt-6 pt-4 border-t border-border">
          <p className="text-sm font-semibold text-muted-foreground mb-1">
            CoachReflection <span className="font-normal">by 360TFT</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Operated by SVMS Consultancy Limited
          </p>
        </div>
      </div>
    </footer>
  )
}
